"""Public request schemas; each entity owns its payload and examples."""

from .athlete import ATHLETE_EXAMPLES, AthleteWrite
from .base import WriteModel
from .game import GAME_EXAMPLES, GameWrite
from .membership import MEMBERSHIP_EXAMPLES, MembershipWrite
from .participant import ParticipantWrite
from .roster import ROSTER_EXAMPLES, RosterWrite
from .statistic import STATISTIC_EXAMPLES, StatisticWrite
from .team import TEAM_EXAMPLES, TeamWrite

__all__ = [
    "ATHLETE_EXAMPLES",
    "AthleteWrite",
    "GAME_EXAMPLES",
    "GameWrite",
    "MEMBERSHIP_EXAMPLES",
    "MembershipWrite",
    "ParticipantWrite",
    "ROSTER_EXAMPLES",
    "RosterWrite",
    "STATISTIC_EXAMPLES",
    "StatisticWrite",
    "TEAM_EXAMPLES",
    "TeamWrite",
    "WriteModel",
]
