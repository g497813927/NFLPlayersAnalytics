"""Shared OpenAPI metadata; these models document responses without changing them."""

from .schemas.error_envelope import ErrorEnvelope

API_DESCRIPTION = """
Explore the fictional football dataset used by the CS5614 prototype.
Browsing is public. Sign in to sync favorites; only admins can change shared sports data.
Interactive writes change your local database.

### Start here

1. Sign in using **Accounts → Sign in**. For writes, paste the returned `csrf_token`
   into the `X-CSRF-Token` header field. The browser sends the HttpOnly cookie automatically.
2. Check **System → Check database connection**.
3. Use **Lookups** to choose existing IDs by their readable labels.
4. Open an entity section and choose a request example before using **Try it out**.
   Example descriptions explain any records you need to create first.

### Request conventions

- Lists return `items`, `total`, `page`, and `page_size` (1-based pages).
- `PUT` replaces all editable fields. Load the current record first;
  omitted optional fields reset to their documented defaults.
- Dates use `YYYY-MM-DD`. Game timestamps use ISO 8601; prefer an explicit
  UTC offset such as `2026-11-01T18:00:00Z`.
- Failed writes roll back and return a readable `error.message`.
  The Responses section documents the actual error envelope.
- The optional request guard rejects common SQL probes, oversized requests,
  and repeated abuse. A temporary block returns 429 with `Retry-After`.
  SQL remains parameterized independently of this guard.
- Every response includes `X-Request-ID`. With development SQL inspection
  enabled, admins can use this ID in the **Development** section to inspect emitted SQL.
"""

API_TAGS = [
    {
        "name": "Accounts",
        "description": "Register a normal user, sign in, restore a session, and sign out. Admin accounts are provisioned by the local create_admin command.",
    },
    {
        "name": "My favorite teams",
        "description": "Read and change only the signed-in user's favorite teams. Normal users and admins can both follow teams.",
    },
    {
        "name": "System",
        "description": "Check connectivity and whether the demo database is initialized.",
    },
    {
        "name": "Overview",
        "description": "Homepage record counts and the latest completed games.",
    },
    {
        "name": "Lookups",
        "description": "Read IDs and labels for form selectors before creating related records.",
    },
    {
        "name": "Teams",
        "description": "Search, inspect, create, update, and delete teams within a league.",
    },
    {
        "name": "Athletes",
        "description": "Manage athlete profiles and view their memberships and statistics.",
    },
    {
        "name": "Rosters",
        "description": "Connect a team to a season. Each team has at most one roster per season.",
    },
    {
        "name": "Memberships",
        "description": "Place an athlete on a roster with a position, jersey number, and dates.",
    },
    {
        "name": "Games",
        "description": "Manage games and their home/away participants together in one transaction.",
    },
    {
        "name": "Performance statistics",
        "description": "Record one statistic for either an athlete or a team in a game.",
    },
    {
        "name": "Standings",
        "description": "Read basic standings derived from completed games; direct edits are unavailable.",
    },
    {
        "name": "Development",
        "description": "Inspect bounded, request-specific SQL traces when SQL_DEBUG_UI is enabled locally.",
    },
]


def documented_error(description: str, code: str, message: str) -> dict:
    return {
        "description": description,
        "model": ErrorEnvelope,
        "content": {
            "application/json": {
                "example": {"error": {"code": code, "message": message}},
            },
        },
    }


SERVER_RESPONSES = {
    403: documented_error(
        "The request guard rejected suspicious query syntax.",
        "request_blocked",
        "This request contains unsupported query syntax. Use ordinary names or values and try again.",
    ),
    408: documented_error(
        "The request body took too long to arrive.",
        "request_timeout",
        "This request took too long. Please try again.",
    ),
    413: documented_error(
        "The request body exceeds the configured size limit.",
        "body_too_large",
        "This request is too large. Send fewer or shorter values.",
    ),
    414: documented_error(
        "The query string exceeds 8 KiB.",
        "query_too_large",
        "Shorten the search or filter values and try again.",
    ),
    429: documented_error(
        "Temporary peer-IP block; see the Retry-After response header.",
        "temporarily_blocked",
        "Too many requests. Try again in 300 seconds.",
    ),
    500: documented_error(
        "Unexpected failure; internal details are kept in the backend logs.",
        "unexpected_error",
        "Something went wrong. Please try again.",
    ),
    503: documented_error(
        "The database could not complete the operation.",
        "database_unavailable",
        "The database could not complete this operation. Check that it has been initialized, then try again.",
    ),
}

LIST_RESPONSES = {
    **SERVER_RESPONSES,
    422: documented_error(
        "Invalid request fields or a sports business rule was rejected. No changes are saved.",
        "invalid_input",
        "Please check the highlighted fields.",
    ),
}

READ_RESPONSES = {
    **LIST_RESPONSES,
    404: documented_error(
        "The requested record or a selected related record does not exist.",
        "not_found",
        "The selected record could not be found. Refresh the page and try again.",
    ),
}

WRITE_RESPONSES = {
    **READ_RESPONSES,
    401: documented_error(
        "Sign-in is required or the session expired.",
        "sign_in_required",
        "Please sign in to continue.",
    ),
    403: documented_error(
        "An admin role or valid CSRF token is required, or the request guard blocked query syntax.",
        "admin_required",
        "Only an administrator can change shared sports records.",
    ),
    409: documented_error(
        "Duplicate record, record in use, or an edit/delete would invalidate related data. No changes are saved.",
        "duplicate_record",
        "A record with this name or combination already exists. Please choose different values.",
    ),
}
