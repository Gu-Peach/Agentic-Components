from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from core.auth import decode_access_token
from core.database import get_db_session
from repositories.pg.auth_repository import AuthRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def require_bridge_secret(
    x_auth_bridge_secret: str | None = Header(default=None, alias="X-Auth-Bridge-Secret"),
) -> None:
    settings = get_settings()
    if not x_auth_bridge_secret or x_auth_bridge_secret != settings.auth_bridge_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid auth bridge secret",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_db_session),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    repository = AuthRepository(session)
    user = await repository.get_user_by_id(user_id)
    if user is None or user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not available",
        )

    return user
