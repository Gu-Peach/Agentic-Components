from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from core.auth import decode_supabase_access_token
from core.database import get_db_session
from models.pg.user import User
from repositories.pg.auth_repository import AuthRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_db_session),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    repository = AuthRepository(session)
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured",
        )

    return await _get_user_from_supabase_token(credentials.credentials, repository)


async def _get_user_from_supabase_token(
    token: str,
    repository: AuthRepository,
) -> User:
    payload = decode_supabase_access_token(token)

    email = payload.get("email")
    subject = payload.get("sub")
    user_metadata = payload.get("user_metadata") or {}

    if not subject or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase token is missing required claims",
        )

    user = await repository.get_user_by_email(email.lower())
    if user is None:
        user = repository.add_user(
            User(
                email=email.lower(),
                display_name=_resolve_display_name(user_metadata, email),
                avatar_url=_resolve_avatar_url(user_metadata),
                status="ACTIVE",
            )
        )
        await repository.flush()
    else:
        user.display_name = _resolve_display_name(user_metadata, email)
        user.avatar_url = _resolve_avatar_url(user_metadata)

    await repository.touch_user_login(user, datetime.now(timezone.utc))
    await repository.commit()
    return user


def _resolve_display_name(user_metadata: dict[str, object], email: str) -> str:
    full_name = user_metadata.get("full_name")
    name = user_metadata.get("name")
    user_name = user_metadata.get("user_name")

    for candidate in (full_name, name, user_name):
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()

    return email.split("@", 1)[0]


def _resolve_avatar_url(user_metadata: dict[str, object]) -> str | None:
    avatar_url = user_metadata.get("avatar_url")
    if isinstance(avatar_url, str) and avatar_url.strip():
        return avatar_url
    return None
