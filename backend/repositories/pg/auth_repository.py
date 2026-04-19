from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.pg.oauth_account import OAuthAccount
from models.pg.refresh_token import RefreshToken
from models.pg.user import User


class AuthRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_id(self, user_id: str | UUID) -> User | None:
        return await self.session.get(User, user_id)

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_oauth_account(self, provider: str, provider_user_id: str) -> OAuthAccount | None:
        result = await self.session.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == provider,
                OAuthAccount.provider_user_id == provider_user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_refresh_token_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    def add_user(self, user: User) -> User:
        self.session.add(user)
        return user

    def add_oauth_account(self, account: OAuthAccount) -> OAuthAccount:
        self.session.add(account)
        return account

    def add_refresh_token(self, token: RefreshToken) -> RefreshToken:
        self.session.add(token)
        return token

    async def flush(self) -> None:
        await self.session.flush()

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()

    async def touch_user_login(self, user: User, timestamp: datetime) -> None:
        user.last_login_at = timestamp
