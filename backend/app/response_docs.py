"""Success-response documentation without runtime response validation."""

RECORD_SCHEMA = {
    "type": "object",
    "description": "Record fields, identifiers, and related display labels.",
    "additionalProperties": True,
}

RECORD_LIST_SCHEMA = {
    "type": "array",
    "items": RECORD_SCHEMA,
}


def json_response(description: str, schema: dict) -> dict:
    return {
        "description": description,
        "content": {"application/json": {"schema": schema}},
    }


RECORD_RESPONSE = json_response(
    "The requested or saved record, including its ID and display labels.",
    RECORD_SCHEMA,
)

PAGINATED_RESPONSE = json_response(
    "One result page and pagination metadata. An unmatched filter returns an empty items array.",
    {
        "type": "object",
        "required": ["items", "total", "page", "page_size"],
        "properties": {
            "items": RECORD_LIST_SCHEMA,
            "total": {
                "type": "integer",
                "minimum": 0,
                "description": "Total matching records before pagination.",
            },
            "page": {
                "type": "integer",
                "minimum": 1,
                "description": "Requested one-based page number.",
            },
            "page_size": {
                "type": "integer",
                "minimum": 1,
                "maximum": 200,
                "description": "Maximum records requested per page.",
            },
        },
    },
)

OVERVIEW_RESPONSE = json_response(
    "Record counts and up to five recent completed games.",
    {
        "type": "object",
        "required": ["counts", "recent_games"],
        "properties": {
            "counts": {
                "type": "object",
                "properties": {
                    name: {"type": "integer", "minimum": 0}
                    for name in (
                        "sports",
                        "leagues",
                        "teams",
                        "athletes",
                        "rosters",
                        "memberships",
                        "games",
                        "performance_statistics",
                    )
                },
            },
            "recent_games": {
                **RECORD_LIST_SCHEMA,
                "maxItems": 5,
                "description": "Completed game records with participants and scores.",
            },
        },
    },
)

LOOKUPS_RESPONSE = json_response(
    "Unpaginated records used by related-record selectors.",
    {
        "type": "object",
        "properties": {
            name: RECORD_LIST_SCHEMA
            for name in (
                "sports",
                "leagues",
                "seasons",
                "venues",
                "stat_definitions",
                "teams",
                "athletes",
                "rosters",
                "games",
            )
        },
    },
)
