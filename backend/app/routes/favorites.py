"""Account-owned favorites; no request can choose another user's ID."""

from fastapi import APIRouter
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from ..api_docs import WRITE_RESPONSES
from ..auth.dependencies import SignedInUser
from ..errors import AppError
from ..models import Favorite, Team
from ..schemas.favorite_teams_response import FavoriteTeamsResponse
from .common import DB

router = APIRouter(
    prefix="/me/favorite-teams", tags=["My favorite teams"], responses=WRITE_RESPONSES
)


def favorite_ids(session, user_id: int) -> FavoriteTeamsResponse:
    ids = session.scalars(
        select(Favorite.team_id)
        .where(
            Favorite.user_id == user_id,
            Favorite.team_id.is_not(None),
        )
        .order_by(Favorite.team_id)
    ).all()
    return FavoriteTeamsResponse(user_id=user_id, team_ids=list(ids))


@router.get(
    "",
    response_model=FavoriteTeamsResponse,
    summary="List my favorite teams",
    description="Sign in to read your own saved team IDs. Changes appear on other devices "
    "when they reload or refocus the app. No user_id parameter is accepted.",
)
def list_favorites(user: SignedInUser, session: DB):
    return favorite_ids(session, user.user_id)


@router.put(
    "/{team_id}",
    response_model=FavoriteTeamsResponse,
    summary="Follow a team",
    description="Requires a session and X-CSRF-Token. Choose team_id from Lookups → teams "
    "(for example 1 in the seeded dataset). No body is needed. Repeated follows are idempotent.",
)
def follow_team(team_id: int, user: SignedInUser, session: DB):
    if session.get(Team, team_id) is None:
        raise AppError(404, "not_found", "That team no longer exists. Refresh the team list.")
    existing = select(Favorite).where(Favorite.user_id == user.user_id, Favorite.team_id == team_id)
    if session.scalar(existing) is None:
        session.add(Favorite(user_id=user.user_id, team_id=team_id))
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            # A simultaneous follow is success; unrelated integrity failures are not.
            if session.scalar(existing) is None:
                raise
    return favorite_ids(session, user.user_id)


@router.delete(
    "/{team_id}",
    response_model=FavoriteTeamsResponse,
    summary="Unfollow a team",
    description="Requires a session and X-CSRF-Token. Removes only your favorite link, "
    "never the team itself. Already-absent favorites are a successful no-op.",
)
def unfollow_team(team_id: int, user: SignedInUser, session: DB):
    session.execute(
        delete(Favorite).where(Favorite.user_id == user.user_id, Favorite.team_id == team_id)
    )
    session.commit()
    return favorite_ids(session, user.user_id)
