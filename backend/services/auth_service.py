import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from core.auth import create_access_token, generate_refresh_token, hash_refresh_token
from models.pg.oauth_account import OAuthAccount
from models.pg.refresh_token import RefreshToken
from models.pg.user import User
from repositories.pg.auth_repository import AuthRepository
from schemas.auth import AccessTokenPairResponse, CurrentUserResponse, OAuthExchangeRequest


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = AuthRepository(session)
        self.settings = get_settings()

    async def exchange_oauth_login(
        self,
        payload: OAuthExchangeRequest,
        *,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AccessTokenPairResponse:
        now = datetime.now(timezone.utc)

        try:
            account = await self.repository.get_oauth_account(
                payload.provider,
                payload.provider_user_id,
            )

            if account is not None:
                user = await self.repository.get_user_by_id(account.user_id)
                if user is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="OAuth account references a missing user",
                    )
            else:
                resolved_email = self._resolve_email(payload)
                user = await self.repository.get_user_by_email(resolved_email)
                if user is None:
                    user = self.repository.add_user(
                        User(
                            email=resolved_email,
                            display_name=self._resolve_display_name(payload),
                            avatar_url=payload.avatar_url,
                            email_verified_at=now if payload.email else None,
                            status="ACTIVE",
                            last_login_at=now,
                        )
                    )
                    await self.repository.flush()
                else:
                    user.display_name = self._resolve_display_name(payload)
                    user.avatar_url = payload.avatar_url
                    user.email_verified_at = user.email_verified_at or (
                        now if payload.email else None
                    )

                account = self.repository.add_oauth_account(
                    OAuthAccount(
                        user_id=user.id,
                        provider=payload.provider,
                        provider_user_id=payload.provider_user_id,
                        provider_email=payload.email,
                        scope=payload.scope,
                        token_type=payload.token_type,
                        access_token=payload.access_token,
                        refresh_token=payload.refresh_token,
                        id_token=payload.id_token,
                        expires_at=payload.expires_at,
                    )
                )
            if account is not None:
                account.provider_email = payload.email
                account.scope = payload.scope
                account.token_type = payload.token_type
                account.access_token = payload.access_token
                account.refresh_token = payload.refresh_token
                account.id_token = payload.id_token
                account.expires_at = payload.expires_at

                user.display_name = self._resolve_display_name(payload)
                user.avatar_url = payload.avatar_url
                user.email_verified_at = user.email_verified_at or (now if payload.email else None)

            await self.repository.touch_user_login(user, now)

            token_response = await self._issue_token_pair(
                user=user,
                provider=payload.provider,
                family_id=None,
                user_agent=user_agent,
                ip_address=ip_address,
            )
            await self.repository.commit()
            return token_response
        except HTTPException:
            await self.repository.rollback()
            raise
        except Exception as exc:
            await self.repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to exchange oauth login",
            ) from exc

    async def refresh_access_token(
        self,
        refresh_token: str,
        *,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AccessTokenPairResponse:
        now = datetime.now(timezone.utc)
        token_hash = hash_refresh_token(refresh_token)
        stored_token = await self.repository.get_refresh_token_by_hash(token_hash)

        if stored_token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is invalid",
            )
        if stored_token.revoked_at is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )
        if stored_token.expires_at <= now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired",
            )

        user = await self.repository.get_user_by_id(stored_token.user_id)
        if user is None or user.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not available",
            )

        replacement = await self._issue_token_pair(
            user=user,
            provider=None,
            family_id=stored_token.family_id,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        newest_token_hash = hash_refresh_token(replacement.refresh_token)
        replacement_record = await self.repository.get_refresh_token_by_hash(newest_token_hash)
        stored_token.last_used_at = now
        stored_token.revoked_at = now
        if replacement_record is not None:
            stored_token.replaced_by_token_id = replacement_record.id

        await self.repository.commit()
        return replacement

    async def _issue_token_pair(
        self,
        *,
        user: User,
        provider: str | None,
        family_id: uuid.UUID | None,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AccessTokenPairResponse:
        access_token, access_expires_at = create_access_token(
            subject=str(user.id),
            email=user.email,
            provider=provider,
        )
        raw_refresh_token = generate_refresh_token()
        refresh_expires_at = datetime.now(timezone.utc) + timedelta(
            days=self.settings.refresh_token_ttl_days
        )
        refresh_record = self.repository.add_refresh_token(
            RefreshToken(
                user_id=user.id,
                token_hash=hash_refresh_token(raw_refresh_token),
                family_id=family_id or uuid.uuid4(),
                user_agent=user_agent,
                ip_address=ip_address,
                expires_at=refresh_expires_at,
            )
        )
        await self.repository.flush()

        return AccessTokenPairResponse(
            access_token=access_token,
            refresh_token=raw_refresh_token,
            expires_in=int(
                (access_expires_at - datetime.now(timezone.utc)).total_seconds()
            ),
            refresh_expires_at=refresh_record.expires_at,
            user=CurrentUserResponse.model_validate(user),
        )

    def _resolve_email(self, payload: OAuthExchangeRequest) -> str:
        if payload.email:
            return payload.email.lower()
        return f"{payload.provider}-{payload.provider_user_id}@oauth.local"

    def _resolve_display_name(self, payload: OAuthExchangeRequest) -> str:
        if payload.display_name and payload.display_name.strip():
            return payload.display_name.strip()
        if payload.email:
            return payload.email.split("@", 1)[0]
        return f"{payload.provider}-{payload.provider_user_id}"
