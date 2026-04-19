from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_serializer


class CurrentUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    display_name: str
    avatar_url: str | None = None
    status: str

    @field_serializer("id")
    def serialize_id(self, value: UUID) -> str:
        return str(value)


class OAuthExchangeRequest(BaseModel):
    provider: Literal["github", "google"]
    provider_user_id: str
    email: EmailStr | None = None
    display_name: str | None = None
    avatar_url: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str | None = None
    scope: str | None = None
    id_token: str | None = None
    expires_at: datetime | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AccessTokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    refresh_expires_at: datetime
    user: CurrentUserResponse
