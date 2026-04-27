from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_serializer


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
