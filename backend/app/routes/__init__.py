"""Compose the API from independent resource routers."""

from fastapi import APIRouter

from . import (
    athletes,
    development,
    games,
    lookups,
    memberships,
    overview,
    rosters,
    standings,
    statistics,
    system,
    teams,
)

router = APIRouter(prefix="/api")

router.include_router(system.router)
router.include_router(overview.router)
router.include_router(lookups.router)
router.include_router(teams.router)
router.include_router(athletes.router)
router.include_router(rosters.router)
router.include_router(memberships.router)
router.include_router(games.router)
router.include_router(statistics.router)
router.include_router(standings.router)
router.include_router(development.router)
