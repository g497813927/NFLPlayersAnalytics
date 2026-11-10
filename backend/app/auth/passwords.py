"""Argon2 password hashing, including a constant-work missing-account path."""

import secrets

from pwdlib import PasswordHash

password_hasher = PasswordHash.recommended()
_dummy_hash = password_hasher.hash(secrets.token_urlsafe(32))


def verify_password(password: str, stored_hash: str | None) -> bool:
    valid = password_hasher.verify(password, stored_hash or _dummy_hash)
    return bool(stored_hash) and valid
