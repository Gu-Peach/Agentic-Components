from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db_session
from dependencies import get_current_user, require_bridge_secret
from schemas.auth import (
    AccessTokenPairResponse,
    CurrentUserResponse,
    OAuthExchangeRequest,
    RefreshTokenRequest,
)
from services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/oauth/exchange",
    response_model=AccessTokenPairResponse,
    status_code=status.HTTP_200_OK,
)
async def exchange_oauth_login(
    payload: OAuthExchangeRequest,
    request: Request,
    _: None = Depends(require_bridge_secret),
    session: AsyncSession = Depends(get_db_session),
):
    service = AuthService(session)
    return await service.exchange_oauth_login(
        payload,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )


@router.post(
    "/refresh",
    response_model=AccessTokenPairResponse,
    status_code=status.HTTP_200_OK,
)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
):
    service = AuthService(session)
    return await service.refresh_access_token(
        payload.refresh_token,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )


@router.get("/me", response_model=CurrentUserResponse)
async def get_me(user=Depends(get_current_user)):
    return CurrentUserResponse.model_validate(user)
