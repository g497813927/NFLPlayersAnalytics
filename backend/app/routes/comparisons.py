"""Read-only season comparisons of saved team and athlete statistics."""

from fastapi import APIRouter, Query

from ..api_docs import READ_RESPONSES
from ..schemas.comparison_options import ComparisonOptions
from ..schemas.comparison_response import ComparisonKind, ComparisonResponse
from ..services.comparison_options import comparison_options
from ..services.comparisons import compare_subjects
from .common import DB

router = APIRouter(prefix="/comparisons", tags=["Comparisons"], responses=READ_RESPONSES)


@router.get(
    "/options",
    response_model=ComparisonOptions,
    summary="Get teams and players available in a season",
    description="Returns the complete selector list from this season's rosters and memberships. "
    "Historical membership stints are included. A roster entry does not guarantee recorded statistics. "
    "Choose a season ID from /api/lookups; the seeded 2026 season is ID 5.",
)
def get_options(session: DB, season_id: int = Query(ge=1, examples=[5])):
    return comparison_options(session, season_id)


@router.get(
    "",
    response_model=ComparisonResponse,
    summary="Compare two teams or players in a season",
    description="Choose two distinct IDs from /api/comparisons/options for the same season. "
    "Aggregates all saved statistics from completed games, independent of list pagination. "
    "Each definition uses sum, arithmetic average of recorded values, minimum, maximum, or last. "
    "Last is determined by game time, then game ID and statistic ID. Missing values are null, "
    "never zero; sample counts show how many observations contributed. Games counts include only "
    "completed games with at least one recorded statistic for that subject. "
    "Team subjects use team statistics, not totals reconstructed from athlete rows. "
    "Example: ?subject_type=team&season_id=5&left_id=1&right_id=2. No records are written.",
)
def get_comparison(
    session: DB,
    subject_type: ComparisonKind = Query(examples=["team"]),
    season_id: int = Query(ge=1, examples=[5]),
    left_id: int = Query(ge=1, examples=[1]),
    right_id: int = Query(ge=1, examples=[2]),
):
    return compare_subjects(session, subject_type, season_id, left_id, right_id)
