# Final report evidence

The report follows the supplied Phase 5 Word template and the final-project
rubric. Evidence was prepared on November 11, 2026 against baseline
`baf2c23a8291dfecc2d4cd73e93c14b05f1c8a25` plus the accompanying account changes.
The existing repository layout is retained.

## Deliverables

- [PDF report](NFL_Players_Analytics_Final_Report.pdf)
- [Editable Word report](NFL_Players_Analytics_Final_Report.docx)
- [Reviewable report text](report.md)
- [Original screenshot captures](../screenshots/final-report/)
- [Final UML views and architecture diagram](diagrams/)
- [All ORM columns, keys, and constraints](schema_metadata.json)
- [Sanitized sample rows and evidence counts](sample_rows.json)
- [Additional report-only catalog fixtures](catalog_fixtures.json)
- [Dated automated review snapshot](review_snapshot.json)
- [Comparison results, emitted SQL, and separate parameters](report_queries.json)

Word creator/last-modified-by and PDF author metadata include John Zhao,
Ishaan Parikh, and Victor Prosekov. Every report figure, table, and SQL listing
has a number, caption, and reference in the text. The PDF page numbers are used
in the linked Word table of contents; regenerate the contents after editing.

## Remaining submission items

- Individual contribution paragraphs are intentionally blank, as requested.
  Each member should fill in their own paragraph before submission. AI assistance
  is described separately; no teammate's contribution was invented.
- The team should review the report and choose one person to submit the PDF and
  [public repository link](https://github.com/g497813927/NFLPlayersAnalytics).

## Evidence method

A new disposable SQLite database was initialized with the actual
`scripts.init_db --method sql` path, then populated with `scripts.seed` using
fixed random seed 5614. Initialization and seeding completed successfully;
the evidence database's foreign-key check returned no violations. The existing local
development database and environment files were not reset or overwritten.

The first synthetic admin was created with the interactive `create_admin`
command. Further synthetic users were registered or created through the app/API.
Five credential rows were available for the sample appendix. Hash fields were
replaced with `[withheld]` before the sample was written; usable passwords,
cookies, CSRF tokens, database files, and machine logs are not included.
Authentication/session counts are a point-in-time snapshot and can change with
subsequent sign-ins.

The normal seed contains one sport and league. Four additional synthetic
sport/league pairs from `catalog_fixtures.json` were inserted during report fixture
setup, using the existing SQLAlchemy `Sport` and `League` models and one committed
transaction against the disposable database. These lookup rows have no games;
all sports walkthroughs and comparisons still use Frontier Football League. The
lookup extract was refreshed after insertion so every table has five sample
rows. This does not change the application's normal seed or add catalog-editing
screens. The fixture operation was initialization work, not a direct-table user
workflow; the CRUD demonstration used the application GUI.

Browser captures show actual local application states. The password-change
capture shows the form; successful password rotation was verified separately
through the API and is not misrepresented as a screenshot of a UI submission.
CRUD captures show a temporary Quarry Bay Comets team before creation, after
creation, before/after a city edit, and before/after confirmed deletion. Those
mutations used GUI forms. The database sample is a separate read-only coursework
extract, not an end-user table-editing workflow.

Word frames omit blank or unrelated screenshot regions where useful. Full
original JPEG captures remain available. Comparison and roster screenshots from
the preceding feature work are retained; both comparison result sets were
rechecked through the API while preparing this report. Mock replay events never
enter either report.

## Targeted account verification

These were manual HTTP checks and browser walkthroughs, not a new automated test
suite or a comprehensive security assessment.

| Operation                                | Observed result                                                                           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Wrong current password                   | 422 with readable message                                                                 |
| Password change without CSRF             | 403                                                                                       |
| Successful password change               | 200; fresh session and CSRF token                                                         |
| Previously active second session         | Became anonymous after the change                                                         |
| Old/new password sign-in                 | 401 / 200                                                                                 |
| Fan attempts admin user creation         | 403                                                                                       |
| Admin creation without CSRF              | 403                                                                                       |
| Duplicate email                          | 409 without overwriting an account                                                        |
| Admin requests an admin role             | 422; administrator provisioning remains local-only                                        |
| Admin creates analyst and fan            | 201; created users could sign in                                                          |
| SQL-like text inside password fields     | Accepted on password change; admin duplicate reaches 409, including trailing-slash routes |
| Credential logging with SQL_ECHO enabled | Tested passwords, Argon2 hashes, and credential-write SQL absent                          |
| SQL probe in team search                 | 403 and readable on-screen message                                                        |

Controlled concurrency checks also verified both login/password-change orderings.
A stale verified login was rejected after rotation; a login that obtained the
credential lock first had its session revoked by the following password change.
The actual React account provider was also run with controlled responses: logout
waited for either a successful or rejected password change, used the current CSRF
token, and cleared both the browser session and the displayed account. Temporary
verification harnesses and databases were kept outside the repository.

`npm run check` covers formatting, ESLint, Stylelint, strict TypeScript/Vite,
Ruff formatting/linting, and Python syntax compilation. It does not establish
complete behavior or integrity coverage. The dated review snapshot records successful CI and resolved findings before the
final report addendum. Current status should be read from the accompanying PRs.

## Preserved artifacts and limits

The supplied Word template was not modified. Its page size, margins, heading
styles, and original PAGE footer were retained in the new report. Word and PDF
renders were checked for layout and page-number consistency. All 57 pages were
visually reviewed. All 31 linked contents entries were checked against their PDF
pages; 28 figures, 47 tables, and 6 SQL/command listings are numbered.

The core `db/schema.sql` remains byte-for-byte unchanged, SHA-256:

```text
d1653c7c2f2c42049b8182fc0c917c8f777de4a5b18be2b0515c2a6bdead2bc1
```

The two account features reuse the current authentication tables and need no
migration. Password recovery, email verification, account deletion, distributed
rate limiting, account-backed saved comparisons, imports/exports, general schema
migrations, and an automated test suite remain deferred. The request guard is a
small application-level defensive layer; parameterized SQL is still required.

## Review outcomes and original ER source

[PR #11](https://github.com/g497813927/NFLPlayersAnalytics/pull/11) and
[PR #12](https://github.com/g497813927/NFLPlayersAnalytics/pull/12) were reviewed
by Copilot and Codex. The dated snapshot records green Node/Python CI and zero
unresolved findings for both reviewed revisions. Copilot recommended approval
for the account changes and retained human layout/submission review for the report.
The stack remains unmerged for the team.

Fixes cover local-only administrator provisioning, the login/password-change
race, queued password-change/logout operations, the two-participant database
limit, and explicit schema-export/admin-authorization instructions in CLAUDE.md.
The supplied Phase 2 PDF's page-9 image was extracted unchanged as
`diagrams/initial-phase2.jpg`. The final report explains 16 diagram entities,
17 normalized core tables, and 19 tables after authentication. The source PDF's
older contribution paragraphs were not copied into the final blank sections.

`admin-roles-reviewed.jpg` captures the final role selector. It is an illustrative
refill of the form, not a second successful creation. The original creation
before/after images remain intact. Source attribution is placed beside relevant
content; no standalone reference page is included.
