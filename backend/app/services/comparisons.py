"""Aggregate the complete saved season, respecting each statistic's calculation."""

from sqlalchemy import case, distinct, func, select
from sqlalchemy.orm import Session

from ..errors import AppError
from ..models import Game, PerformanceStatistic, StatDefinition
from ..schemas.comparison_metric import ComparisonMetric
from ..schemas.comparison_response import ComparisonKind, ComparisonResponse
from .comparison_options import comparison_options


def compare_subjects(
    session: Session, subject_type: ComparisonKind, season_id: int, left_id: int, right_id: int
) -> ComparisonResponse:
    if left_id == right_id:
        raise AppError(422, "same_subject", "Choose two different teams or players to compare.")
    options = comparison_options(session, season_id)
    choices = options.teams if subject_type == "team" else options.athletes
    subjects = {subject.id: subject for subject in choices}
    if left_id not in subjects or right_id not in subjects:
        raise AppError(
            422,
            "subject_outside_season",
            "Both selections must belong to a roster in this season. Choose from the current list.",
        )
    subject_column = (
        PerformanceStatistic.team_id if subject_type == "team" else PerformanceStatistic.athlete_id
    )
    recorded = (
        select(
            subject_column.label("subject_id"),
            PerformanceStatistic.stat_definition_id,
            PerformanceStatistic.stat_value,
            Game.game_id,
            func.row_number()
            .over(
                partition_by=(subject_column, PerformanceStatistic.stat_definition_id),
                order_by=(
                    Game.game_time.desc(),
                    Game.game_id.desc(),
                    PerformanceStatistic.performance_statistic_id.desc(),
                ),
            )
            .label("recency"),
        )
        .join(Game, Game.game_id == PerformanceStatistic.game_id)
        .where(
            subject_column.in_((left_id, right_id)),
            Game.season_id == season_id,
            Game.status == "completed",
        )
        .subquery()
    )
    value = recorded.c.stat_value
    aggregate = case(
        (StatDefinition.calc_type == "sum", func.sum(value)),
        (StatDefinition.calc_type == "average", func.avg(value)),
        (StatDefinition.calc_type == "min", func.min(value)),
        (StatDefinition.calc_type == "max", func.max(value)),
        (StatDefinition.calc_type == "last", func.max(case((recorded.c.recency == 1, value)))),
    )
    rows = session.execute(
        select(StatDefinition, recorded.c.subject_id, func.count(), aggregate)
        .join(recorded, recorded.c.stat_definition_id == StatDefinition.stat_definition_id)
        .group_by(StatDefinition, recorded.c.subject_id)
        .order_by(StatDefinition.stat_name, StatDefinition.stat_definition_id)
    )
    metrics: dict[int, ComparisonMetric] = {}
    for definition, subject_id, samples, result in rows:
        metric = metrics.setdefault(
            definition.stat_definition_id,
            ComparisonMetric(
                stat_definition_id=definition.stat_definition_id,
                name=definition.stat_name,
                abbreviation=definition.abbreviation,
                calculation=definition.calc_type,
            ),
        )
        if subject_id == left_id:
            metric.left_value, metric.left_samples = result, samples
        else:
            metric.right_value, metric.right_samples = result, samples
    games = dict(
        session.execute(
            select(recorded.c.subject_id, func.count(distinct(recorded.c.game_id))).group_by(
                recorded.c.subject_id
            )
        ).all()
    )
    return ComparisonResponse(
        subject_type=subject_type,
        season_id=options.season_id,
        season_name=options.season_name,
        league_name=options.league_name,
        left=subjects[left_id],
        right=subjects[right_id],
        left_games=games.get(left_id, 0),
        right_games=games.get(right_id, 0),
        metrics=list(metrics.values()),
    )
