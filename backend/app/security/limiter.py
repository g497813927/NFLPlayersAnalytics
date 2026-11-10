"""Bounded in-memory rate/strike tracking with temporary bans per peer IP."""

import math
from collections import OrderedDict, deque
from dataclasses import dataclass, field
from threading import Lock
from time import monotonic


@dataclass
class PeerState:
    requests: deque[float] = field(default_factory=deque)
    strikes: deque[float] = field(default_factory=deque)
    banned_until: float = 0


class RequestLimiter:
    def __init__(self, settings):
        self.settings = settings
        self.peers: OrderedDict[str, PeerState] = OrderedDict()
        self.lock = Lock()

    def _peer(self, key: str) -> PeerState:
        peer = self.peers.pop(key, None) or PeerState()
        self.peers[key] = peer
        if len(self.peers) > 10_000:
            self.peers.popitem(last=False)
        return peer

    def check(self, key: str) -> int:
        """Zero permits the request; otherwise return seconds before retry."""
        now = monotonic()
        with self.lock:
            peer = self._peer(key)
            if peer.banned_until > now:
                return math.ceil(peer.banned_until - now)
            while peer.requests and peer.requests[0] <= now - 60:
                peer.requests.popleft()
            if len(peer.requests) >= self.settings.waf_requests_per_minute:
                peer.banned_until = now + self.settings.waf_ban_seconds
                peer.requests.clear()
                return self.settings.waf_ban_seconds
            peer.requests.append(now)
        return 0

    def strike(self, key: str) -> int:
        now = monotonic()
        with self.lock:
            peer = self._peer(key)
            while peer.strikes and peer.strikes[0] <= now - self.settings.waf_strike_window_seconds:
                peer.strikes.popleft()
            peer.strikes.append(now)
            if len(peer.strikes) >= self.settings.waf_strike_limit:
                peer.banned_until = now + self.settings.waf_ban_seconds
                peer.strikes.clear()
                return self.settings.waf_ban_seconds
        return 0
