"""Public ORM imports and complete metadata for ORM/SQL database creation.

Entity definitions live in app.entities, with one mapped class per file.
Importing this module registers all 17 tables on Base.metadata.
"""

from .entities.base import Base
from .entities.user import User
from .entities.sport import Sport
from .entities.league import League
from .entities.team import Team
from .entities.athlete import Athlete
from .entities.season import Season
from .entities.venue import Venue
from .entities.roster import Roster
from .entities.membership import Membership
from .entities.game import Game
from .entities.game_participant import GameParticipant
from .entities.stat_definition import StatDefinition
from .entities.performance_statistic import PerformanceStatistic
from .entities.standing import Standing
from .entities.favorite import Favorite
from .entities.saved_comparison import SavedComparison
from .entities.data_import import DataImport

__all__ = [
    "Base",
    "User",
    "Sport",
    "League",
    "Team",
    "Athlete",
    "Season",
    "Venue",
    "Roster",
    "Membership",
    "Game",
    "GameParticipant",
    "StatDefinition",
    "PerformanceStatistic",
    "Standing",
    "Favorite",
    "SavedComparison",
    "DataImport",
]
