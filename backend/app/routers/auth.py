import random
from datetime import datetime, timedelta, timezone

from app.core.jwt import create_access_token
from app.core.password import hash_password, verify_password
from app.core.security import get_current_user
from app.db.models.password_reset import PasswordResetToken
from app.db.models.user import User
from app.db.session import get_db
from app.repositories.auth_repository import AuthRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserRegisterResponse,
    UserResponse,
)
from app.services.email_service import send_password_reset_email
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserRegisterResponse)
async def register(
    payload: UserRegisterRequest, db: AsyncSession = Depends(get_db)
) -> UserRegisterResponse:
    user_repo = UserRepository(db)
    existing_user = await user_repo.get_by_email(payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed = hash_password(payload.password)
    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hashed,
    )
    await user_repo.create(user)
    return UserRegisterResponse(message="Registration successful")


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: UserLoginRequest, db: AsyncSession = Depends(get_db)
) -> LoginResponse:
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    from app.schemas.auth import UserLoginResponseDetail

    token = create_access_token(email=user.email)
    return LoginResponse(
        access_token=token,
        user=UserLoginResponseDetail(
            id=user.id,
            email=user.email,
            name=user.name,
        ),
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> ForgotPasswordResponse:
    user_repo = UserRepository(db)
    auth_repo = AuthRepository(db)

    user = await user_repo.get_by_email(payload.email)
    if user:
        await auth_repo.delete_unused_tokens_by_user(user.id)

        otp = f"{random.randint(100000, 999999)}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        token = PasswordResetToken(
            user_id=user.id,
            otp=otp,
            expires_at=expires_at,
        )
        await auth_repo.create_password_reset_token(token)

        send_password_reset_email(user.email, otp)

    return ForgotPasswordResponse(message="If this email exists, OTP has been sent.")


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
) -> ResetPasswordResponse:
    user_repo = UserRepository(db)
    auth_repo = AuthRepository(db)

    token = await auth_repo.get_active_token_by_email_and_otp(
        payload.email, payload.otp
    )
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    now = datetime.now(timezone.utc)
    if token.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    user = await user_repo.get_by_id(token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    hashed = hash_password(payload.new_password)
    user.hashed_password = hashed

    token.used = True

    await auth_repo.delete_expired_tokens()

    return ResetPasswordResponse(message="Password reset successful")


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        created_at=current_user.created_at,
    )
