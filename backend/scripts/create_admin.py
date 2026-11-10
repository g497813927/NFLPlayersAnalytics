"""Create an administrator explicitly, without default passwords or changing existing users."""

import argparse
from getpass import getpass

from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from app.auth.database import AuthSessionLocal, auth_engine
from app.auth.passwords import password_hasher
from app.models import User, UserCredential
from app.schemas.register_request import RegisterRequest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", help="Prompted when omitted; no default account is supplied.")
    parser.add_argument("--name", help="Display name, prompted when omitted.")
    args = parser.parse_args()
    email = args.email or input("Admin email: ").strip()
    name = args.name or input("Admin display name: ").strip()
    password = getpass("New admin password (12–128 characters): ")
    if password != getpass("Confirm password: "):
        raise SystemExit("Passwords do not match. Nothing was changed.")
    try:
        payload = RegisterRequest(email=email, display_name=name, password=password)
    except ValidationError:
        raise SystemExit(
            "Use a valid email, a name of 1–100 characters, and a password of 12–128 characters."
        ) from None
    try:
        with AuthSessionLocal.begin() as session:
            if session.scalar(select(User.user_id).where(func.lower(User.email) == payload.email)):
                raise SystemExit(
                    "That email already exists. No account or role was changed. Choose a new admin email."
                )
            user = User(email=payload.email, display_name=payload.display_name, role="admin")
            session.add(user)
            session.flush()
            session.add(
                UserCredential(
                    user_id=user.user_id, password_hash=password_hasher.hash(payload.password)
                )
            )
        print("Administrator created. Sign in with the email and password you supplied.")
    except SQLAlchemyError:
        raise SystemExit(
            "Could not create the admin. No changes were saved. Run setup/upgrade_auth and check DATABASE_URL."
        ) from None
    finally:
        auth_engine.dispose()


if __name__ == "__main__":
    main()
