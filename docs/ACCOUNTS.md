# Account management

Administrators are created locally, with a hidden interactive password prompt:

```sh
uv run --directory backend --frozen python -m scripts.create_admin
```

Signed-in users can open **Account menu → Change password**. The form requires
the current password and matching new passwords of 12–128 characters. Success
revokes all previous sessions, including other devices, and issues a new session
and CSRF token for this browser.

Login rechecks the verified password hash under a database write lock before
issuing a session. A concurrent password change either rejects that stale login
or revokes its session after the login commits.

Admins can open **Account menu → Create a user** to provide a unique email,
display name, initial password, and either the fan or analyst role. Both have
normal access. The API rejects the admin role; use the local command above to
provision administrators. Existing accounts are never overwritten, and creation
does not replace the admin's own session.

The endpoints are `POST /api/auth/password` and `POST /api/admin/users`.
Swagger at `/docs/api` includes descriptions and payload examples. Both require
a session cookie and `X-CSRF-Token`; public registration still cannot choose a
role. Passwords are hashed with Argon2. The routes use the private account engine
and are excluded from terminal/browser SQL traces. Password fields are excluded
from request-guard signature scanning, including trailing-slash requests.

This reuses the existing authentication tables. No database migration, reset,
or change to `db/schema.sql` is required. Account recovery, user deletion, and
editing another user's account remain deferred.
