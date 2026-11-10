"""ASGI plugin rejecting large bodies, obvious SQL probes, and repeated abuse."""

import asyncio
import logging

from starlette.types import ASGIApp, Receive, Scope, Send

from ..config import Settings
from ..errors import error_response
from .limiter import RequestLimiter
from .rules import body_has_sql_probe, looks_like_sql_probe

logger = logging.getLogger(__name__)


class RequestGuardMiddleware:
    def __init__(self, app: ASGIApp, settings: Settings):
        self.app = app
        self.settings = settings
        self.limiter = RequestLimiter(settings)

    async def reject(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
        peer: str,
        status: int,
        code: str,
        message: str,
        retry: int = 0,
    ) -> None:
        # Never log the URL/query, request body, cookie, or credentials.
        logger.warning("Request guard: code=%s peer=%s retry_after=%s", code, peer, retry)
        response = error_response(status, code, message)
        response.headers["Cache-Control"] = "no-store"
        if retry:
            response.headers["Retry-After"] = str(retry)
        await response(scope, receive, send)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        path = scope.get("path", "")
        if (
            scope["type"] != "http"
            or not self.settings.waf_enabled
            or not path.startswith("/api/")
            or path == "/api/health"
            or scope["method"] == "OPTIONS"
        ):
            await self.app(scope, receive, send)
            return
        # Launch Uvicorn with --no-proxy-headers; forwarded client-IP headers
        # from untrusted callers must never control the rate-limit key.
        peer = scope.get("client", ("unknown", 0))
        peer = peer[0] if peer else "unknown"
        retry = self.limiter.check(peer)
        if retry:
            await self.reject(
                scope,
                receive,
                send,
                peer,
                429,
                "temporarily_blocked",
                f"Too many requests. Try again in {retry} seconds.",
                retry,
            )
            return

        query = scope.get("query_string", b"")
        if len(query) > 8192:
            await self.reject(
                scope,
                receive,
                send,
                peer,
                414,
                "query_too_large",
                "Shorten the search or filter values and try again.",
            )
            return
        if looks_like_sql_probe(path) or looks_like_sql_probe(
            query.decode("utf-8", errors="replace")
        ):
            await self.block_probe(scope, receive, send, peer)
            return

        body = bytearray()
        try:
            async with asyncio.timeout(10):
                while True:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        return
                    body.extend(message.get("body", b""))
                    if len(body) > self.settings.waf_max_body_bytes:
                        await self.reject(
                            scope,
                            receive,
                            send,
                            peer,
                            413,
                            "body_too_large",
                            "This request is too large. Send fewer or shorter values.",
                        )
                        return
                    if not message.get("more_body", False):
                        break
        except TimeoutError:
            await self.reject(
                scope,
                receive,
                send,
                peer,
                408,
                "request_timeout",
                "This request took too long. Please try again.",
            )
            return

        if body_has_sql_probe(
            bytes(body), account_request=path in {"/api/auth/login", "/api/auth/register"}
        ):
            await self.block_probe(scope, receive, send, peer)
            return

        consumed = False

        async def replay():
            nonlocal consumed
            if not consumed:
                consumed = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        async def record_failures(message):
            if (
                message["type"] == "http.response.start"
                and message["status"] == 401
                and path == "/api/auth/login"
            ):
                retry = self.limiter.strike(peer)
                if retry:
                    logger.warning(
                        "Request guard: code=login_ban peer=%s retry_after=%s", peer, retry
                    )
            await send(message)

        await self.app(scope, replay, record_failures)

    async def block_probe(self, scope: Scope, receive: Receive, send: Send, peer: str) -> None:
        retry = self.limiter.strike(peer)
        await self.reject(
            scope,
            receive,
            send,
            peer,
            403,
            "request_blocked",
            "This request contains unsupported query syntax. Use ordinary names or values and try again.",
            retry,
        )
