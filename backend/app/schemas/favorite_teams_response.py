"""Favorite IDs belong only to the current authenticated user."""

from pydantic import BaseModel


class FavoriteTeamsResponse(BaseModel):
    user_id: int
    team_ids: list[int]
