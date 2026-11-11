# Using the prototype

[Back to README](../README.md)

## Accounts, synced favorites, and admins

Open **Sign in → Create an account** to register a normal user. Email addresses
are case-insensitive; passwords use 12–128 characters and preserve whitespace.
Use fictional details for the local prototype. There are no default passwords.
The five seeded users are sample records without credentials, even the seeded
`admin` row. Registration cannot claim them or choose an admin role.

| Capability                                 | Guest | Normal user (`fan` / `analyst`) | Admin                  |
| ------------------------------------------ | ----- | ------------------------------- | ---------------------- |
| Browse sports data and mock game replays   | Yes   | Yes                             | Yes                    |
| Favorite teams in this browser             | Yes   | Uses account favorites          | Uses account favorites |
| Sync own favorites to the database         | No    | Yes                             | Yes                    |
| Create, edit, or delete shared sports data | No    | No                              | Yes                    |
| Inspect development SQL in the browser     | No    | No                              | When enabled           |

Create the first admin explicitly after setup, from the repository root:

```sh
uv run --directory backend --frozen python -m scripts.create_admin
```

The command prompts for email, display name, and a new password twice without
echoing the password. It saves the account and an Argon2 hash to the configured
database, never a plaintext credentials file or `.env` entry. It refuses
existing emails and never promotes or overwrites another account. Then sign in
normally and open **Data management → Performance statistics**, or use
**Statistics → Edit statistics**. Select a team as the statistic's subject and
choose its game/statistic definition from the database-backed selectors.
Admins can also edit teams, athletes, memberships, rosters, and games/scores.
Standings continue to recalculate from saved games; they are not manually edited.
Normal users calling those write APIs directly receive a readable 403.

For an existing checkout, stop both servers and run `npm run setup`. It adds
only the missing authentication extension to a compatible 17-table database
and preserves existing data. If dependencies are already installed, the smaller
upgrade command is:

```sh
uv run --directory backend --frozen python -m scripts.upgrade_auth
```

Both paths refuse partial/incompatible schemas. Back up the database before
manual administration. `db/schema.sql` remains unchanged; `db/auth_schema.sql`
contains the two new tables. Startup itself never upgrades the schema.

Sessions are stored server-side with a fixed expiry (seven days by default).
Passwords use Argon2; only hashes of opaque session tokens are stored. The
session cookie is HttpOnly and SameSite=Lax. Logging out revokes that session;
other devices keep theirs. Authenticated writes require `X-CSRF-Token`, and
account creation/sign-in require JSON from an allowed origin. No account
credentials, password hashes, or session tokens enter the SQL terminal/browser
traces, even with both SQL debug flags enabled. Sports SQL remains visible.

In Swagger at `/docs/api`, use **Accounts → Sign in** first, then copy the
returned `csrf_token` into the `X-CSRF-Token` field on a write operation. The
browser sends the session cookie automatically. API clients must retain cookies
and send the same header. Request examples are illustrative, not seeded logins.
Favorite routes under `/api/me/favorite-teams` always use the signed-in owner.
Devices must reach the same backend/database; separate local checkouts do not
share favorites. Reload or refocus the app to fetch changes made elsewhere.

## Request guard (WAF-like plugin)

The optional `RequestGuardMiddleware` runs before API handlers. It rejects common
SQL-injection probes in URLs and JSON values (union-select, stacked destructive
statements, quoted boolean probes, and common time-delay functions), limits
request bodies to 64 KiB, and limits each peer IP to 180 API requests per minute.
Ordinary names such as `O'Neal` remain valid. Password fields are excluded from
signature scanning, so the guard does not restrict legitimate passphrases.

Five SQL probes or failed sign-ins within five minutes temporarily block the
peer for five minutes. Exceeding the request rate also starts a temporary block.
Responses use the normal readable error envelope: 403 for a detected probe,
413 for an oversized body, and 429 with `Retry-After` while blocked. Health and
CORS preflight requests are exempt. Bodies have a ten-second receive timeout;
query strings are limited to 8 KiB. Guard logs contain reason codes and peer IPs,
never request bodies, cookies, or passwords.

| Setting in `backend/.env`   | Default | Meaning                                                                                    |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `WAF_ENABLED`               | `true`  | Enable the request guard. Auth, CSRF, constraints, and bound SQL remain active when false. |
| `WAF_REQUESTS_PER_MINUTE`   | `180`   | API requests permitted per peer IP in a rolling minute.                                    |
| `WAF_STRIKE_LIMIT`          | `5`     | Probes/failed sign-ins before temporary blocking.                                          |
| `WAF_STRIKE_WINDOW_SECONDS` | `300`   | Rolling window for counting strikes.                                                       |
| `WAF_BAN_SECONDS`           | `300`   | Temporary blocking duration.                                                               |
| `WAF_MAX_BODY_BYTES`        | `65536` | Maximum API request body size.                                                             |

Restart the backend after changes. This is an application-level prototype
plugin, not an installed OS firewall or the Fail2ban daemon. State is bounded
in memory, private to each server process, and cleared on restart. Wait for
`Retry-After` or restart your local backend to clear a demo block. Through Vite,
all browsers share the proxy's loopback peer IP and therefore its limits. Do not
use these per-process limits as distributed or production DDoS protection.
The supplied launcher uses `--no-proxy-headers` so caller-supplied
`X-Forwarded-For` cannot choose a fresh IP. Keep that option with custom launchers;
a production reverse proxy needs an explicit trusted-proxy design.

Signature checks can have false positives and cannot recognize every injection.
SQLAlchemy expressions/bound parameters remain the actual SQL-injection defense;
never concatenate user input into SQL or weaken that rule because the guard is
present. This follows the [OWASP SQL injection prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

## Game center

Open **Games** or **Explore game center** on the homepage. The layout takes
inspiration from [Apple Sports](https://www.apple.com/newsroom/2024/08/apple-sports-is-ready-for-football-season/):
prominent scores, team colors, a drive tracker, and a compact event feed.
Team initials are generated from the synthetic database names.
The header button collapses or expands navigation at every screen size. Below
768px, expansion opens a full-screen menu; selecting a page or pressing the
close button/Escape returns to the content.

- **Mock live** plays a fictional fourth-quarter drive using the selected teams.
  Play/pause, advance one play, scrub, change speed, or restart. Changing games
  resets playback. All mock scores, quarter totals, and events are simulated in
  memory; the replay never writes to the database or modifies saved scores.
- **Low-key impact** highlights a simulated block, pass breakup, or third-down
  conversion and explains why it mattered. These are editorial examples of
  understated contributions, not player rankings or claims about real athletes.
- **Saved game** shows the stored score and available team statistics. The saved
  record drawer includes recorded player statistics. Non-football and cancelled
  games only offer the saved view.
- Star a team or use **Follow a team**, then select **My teams** to filter the
  schedule. Signed-in users save their favorites in the `favorite` table and
  retrieve them on any device connected to the same backend. Guests use browser
  storage with an in-memory fallback. Guest favorites stay separate and are not
  automatically imported into an account. Reload or refocus to fetch changes
  made on another device; this is not a real-time push feed.
- Search/filter by team, season, status, and UTC date. All games from `/api/lookups`
  are filtered before client-side pagination. Game times display in your local
  timezone. This is suitable for the prototype dataset; a larger dataset will
  need server-side filtering and pagination.

No live sports feed, real player information, or external sports API is used.

## Compare teams and players

Open **Compare** in the navigation, or **Compare teams & players** on the
Statistics page. Choose **Teams** or **Players**, select a season, then choose
two different records. The swap button exchanges the two sides. Selectors
include every team or player with a roster membership in that season; players
show their position and team context. Comparison is public and read-only.

- Charts aggregate all saved statistics from **completed games** in the chosen
  season, rather than just the first page of results. Simulated game-center
  events never enter these figures.
- Each statistic uses its definition's calculation: sum, arithmetic average of
  recorded values, minimum, maximum, or latest value. Latest is ordered by game
  time, game ID, and statistic ID. The caption names the calculation and shows
  how many games contributed to each value.
- A dash means no recorded value, not zero. Each metric has its own scale;
  negative values remain visible, and a larger value does not always mean better.
  Team comparisons use recorded team statistics, not sums of player records.
- Team and player selections reset when the season or comparison type changes.
  Saving a comparison to an account remains deferred.

Swagger UI documents both read-only endpoints under **Comparisons**:

```text
GET /api/comparisons/options?season_id=5
GET /api/comparisons?subject_type=team&season_id=5&left_id=1&right_id=2
```

Use `subject_type=athlete` for players, and IDs from the options response.
Invalid or duplicate selections return readable errors. No schema changes or
database initialization are needed for this page.

Preview captures: [team comparison](screenshots/team-comparison.jpg) and
[player comparison](screenshots/player-comparison.jpg).

## Season and year filters

On **Teams**, use **Season / year** to find teams with a roster for that season.
Open a team to view its rosters, players, and team statistics with the same
season filter. Change or clear the filter inside the drawer, and paginate each
section independently. These are historical membership stints, including ended
ones. A season label such as **2025** refers to the whole stored season, even
when its end date is in 2026; it is not a calendar-year filter.

The **Statistics** page also offers a season filter. Changing it clears the
selected game and limits the game selector to the new season.

Preview capture: [roster filtered by season](screenshots/team-roster-year.jpg).

## What works

- Home with connection status, record counts, and recent results.
- Teams, athletes, games, statistics, and basic standings backed by the API.
- Side-by-side team/player season comparisons.
- Season filters for team rosters, player memberships, and recorded statistics.
- Admin-only Data Management forms for teams, athletes, rosters, memberships, games and
  their participants, and individual/team performance statistics.
- Search and filters, database-backed relationship selectors, edit forms, and
  delete confirmation.
- Database constraints plus cross-table validation, transactional writes, and
  readable error messages.
- Terminal SQL logging enabled by the new setup template, and an optional
  read-only SQL inspector in the browser.

Game participants are saved as one home/away pair with the game. A completed
game needs two scores. Statistics have exactly one subject: an athlete or a
team. Athlete statistics require a matching roster membership on the game date.
An edit that would invalidate existing statistics is rejected.

The seeded rosters contain selected athletes, not complete professional team
rosters. Standings count completed games and use `(wins + 0.5 * ties) / games`
for ranking. Equal percentages share a rank. They are intentionally labeled
basic demo standings and do not implement official NFL tiebreakers.

## Current boundaries and next steps

This remains a local prototype with real server-enforced account permissions.
Keep the demo bound to loopback. Public registration creates normal users;
administrators are provisioned with the local CLI; admins can create fan or analyst users in the app. Password recovery, email verification,
account deletion, shared rate limiting, and production
deployment hardening remain deferred. The login limiter is per process, with
ten account attempts per client IP per minute; it is not distributed protection.

There is no automated test suite yet. This phase uses static checks and targeted
manual walkthroughs, including the [SQL injection demo](SQL_INJECTION_DEMO.md)
and the comparison and roster captures above. Those demonstrate specific cases; do not
interpret the prototype as fully tested.

Later phases can add account recovery, synced comparisons, advanced
analytics, import/export, a migration history, and the deferred test suite. `DATABASE_URL` and SQLAlchemy isolate the connection configuration, but
changing RDBMS still requires its driver, migrations, and compatibility checks;
the checked-in SQL script targets SQLite.

## Password change and user creation

Open your account menu and select **Change password**. Enter your current password
and a new 12–128 character password twice. A successful change revokes every old
session, including other devices, and issues a fresh session for this browser.
Incorrect current passwords and mismatched confirmation receive readable errors.

After bootstrapping the first administrator with `scripts.create_admin`, open
**Account menu → Create a user**. Enter a unique email, display name, initial
password, and either fan or analyst access. Both roles have normal access;
create additional administrators with the local command above. Creation preserves the current admin
session and never overwrites an existing account. The new user can change their
password after signing in.

Swagger documents `POST /api/auth/password` under **Accounts** and
`POST /api/admin/users` under **User administration**. Both require the session
cookie and `X-CSRF-Token`. All password fields bypass request-guard signature
scanning; other submitted values remain checked. Both routes use the private
engine and are excluded from SQL inspection. No schema changes are needed.
