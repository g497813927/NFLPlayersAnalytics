"""Public ORM imports and complete metadata for ORM/SQL database creation.

Entity definitions live in app.entities, with one mapped class per file.
Importing this module registers 17 core tables and two authentication tables.
"""

from .entities.athlete import Athlete
from .entities.auth_session import AuthSession
from .entities.base import Base
from .entities.data_import import DataImport
from .entities.favorite import Favorite
from .entities.game import Game
from .entities.game_participant import GameParticipant
from .entities.league import League
from .entities.membership import Membership
from .entities.performance_statistic import PerformanceStatistic
from .entities.roster import Roster
from .entities.saved_comparison import SavedComparison
from .entities.season import Season
from .entities.sport import Sport
from .entities.standing import Standing
from .entities.stat_definition import StatDefinition
from .entities.team import Team
from .entities.user import User
from .entities.user_credential import UserCredential
from .entities.venue import Venue

__all__ = [
    "Base",
    "User",
    "UserCredential",
    "AuthSession",
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
