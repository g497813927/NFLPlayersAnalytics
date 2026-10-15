# Database notes

## ER mapping

The prototype keeps all 17 entities in the supplied normalized ER diagram:

| Area | Tables |
| --- | --- |
| Catalog | `sport`, `league`, `team`, `athlete`, `season`, `venue` |
| Rosters | `roster`, `membership` |
| Events | `game`, `game_participant` |
| Performance | `stat_definition`, `performance_statistic`, `standing` |
| Future account features | `app_user`, `favorite`, `saved_comparison` |
| Import metadata | `data_import` |

`app_user` represents the diagram's User entity without relying on a reserved
SQL word. `standing.ties` is added for football ties. Integer foreign keys match
the integer keys they reference. Game participants use the diagram's composite
primary key `(game_id, team_id)`.

## Integrity

The database defines required columns, business-key uniqueness, date and numeric
checks, enumerated value checks, foreign keys, and explicit deletion actions.
SQLAlchemy's metadata and the exported SQL carry the same definitions.

- A team has one roster and one standing per season.
- Home and away roles cannot repeat within a game.
- A statistic belongs to exactly one athlete or one team, with no duplicate
  game/definition/subject record.
- A favorite has one target; a saved comparison has two distinct targets of
  one kind.
- Game scores and win/loss/tie counts cannot be negative; general performance
  values may be negative.
- Dates must be ordered; jersey numbers are text to preserve values like `00`.

Historical references generally restrict deletion. Deleting a roster cascades
to memberships; deleting a game cascades to participants and statistics. Derived
standings and saved favorites/comparisons cascade from their owning references.
Deleting a venue clears the game's optional venue. Deleting an import's user
clears the optional importer reference.

Cross-table rules are enforced by backend services, in the same transaction as
the write: a team's roster and season share a league; a game's participants
have rosters in its season; the game takes place within its season; statistics
match the game's sport; athlete statistics have an active membership with a
participating team. Games are saved with exactly two distinct home/away teams.
Changes that invalidate existing records are rejected and rolled back.

These application rules are not database triggers. Direct SQL can bypass them.
Use the application for normal edits; manual SQL changes require the same
business-rule care and a standings refresh. A future migration can add stronger
database-level enforcement where appropriate for the selected RDBMS.

## Derived standings

The application refreshes affected seasons when games, results, or roster
participation change. The seed uses the same calculation. Completed games count
as wins, losses, or ties. `points = wins + 0.5 * ties`; the API additionally
returns `win_percentage = points / games_played` (zero if no games were played).
Ranks are dense by descending percentage and shared by equal percentages.
Alphabetical order breaks display ties only; it does not claim official NFL
tiebreaker behavior.

## Synthetic data

The deterministic Python seeder creates fictional players, organizations,
venues, events, and results for 2022–2026. No public datasets, personal records,
or live APIs are used. The sample demonstrates a selection of athletes per
team, not full professional rosters.

The football-only prototype intentionally has one sport and one league. Other
lookup tables have at least five useful records; core entities have at least
20. Import rows describe synthetic seed batches, not actual third-party imports.
Future account-feature rows are sample database content, not real accounts or
authentication credentials.

## Deferred verification

Automated integrity/CRUD tests, repeatable rejection demonstrations, and the
formal screenshot evidence package are intentionally left for a later phase.
