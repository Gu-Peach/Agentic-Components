from fastapi import APIRouter, Depends

from dependencies import get_current_user
from schemas.auth import CurrentUserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me", response_model=CurrentUserResponse)
async def get_me(user=Depends(get_current_user)):
    return CurrentUserResponse.model_validate(user)
