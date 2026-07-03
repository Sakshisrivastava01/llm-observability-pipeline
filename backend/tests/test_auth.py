from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from app.core.password import hash_password, verify_password
from app.db.models.password_reset import PasswordResetToken
from app.db.models.user import User
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.anyio
async def test_registration_success(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verifies that a user can register successfully."""
    payload = {
        "email": "register@test.com",
        "password": "password123",
        "name": "Register Test",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 200
    assert response.json() == {"message": "Registration successful"}

    stmt = select(User).where(User.email == "register@test.com")
    result = await db_session.execute(stmt)
    user = result.scalars().first()
    assert user is not None
    assert user.name == "Register Test"


@pytest.mark.anyio
async def test_duplicate_registration_failure(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verifies duplicate email registration returns 400."""
    user = User(
        email="dup@test.com",
        name="Dup User",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    payload = {
        "email": "dup@test.com",
        "password": "password123",
        "name": "Dup User Two",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


@pytest.mark.anyio
async def test_login_success(client: AsyncClient, db_session: AsyncSession) -> None:
    """Verifies successful login returns token and user info."""
    user = User(
        email="login@test.com",
        name="Login User",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    payload = {
        "email": "login@test.com",
        "password": "password123",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login@test.com"
    assert data["user"]["name"] == "Login User"


@pytest.mark.anyio
async def test_login_failure(client: AsyncClient, db_session: AsyncSession) -> None:
    """Verifies failed login with bad password or email."""
    payload = {
        "email": "nonexistent@test.com",
        "password": "password123",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Incorrect email" in response.json()["detail"]


@pytest.mark.anyio
async def test_jwt_validation_success_and_failure(client: AsyncClient) -> None:
    """Verifies JWT validation for protected endpoints."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 200

    from app.main import app
    from httpx import ASGITransport

    bad_client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    response_no_auth = await bad_client.get("/api/v1/auth/me")
    assert response_no_auth.status_code == 401


@pytest.mark.anyio
async def test_forgot_password_flow(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verifies the forgot password and email trigger flow."""
    user = User(
        email="forgot@test.com",
        name="Forgot User",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.services.email_service.SendGridAPIClient"):
        payload = {"email": "forgot@test.com"}
        response = await client.post("/api/v1/auth/forgot-password", json=payload)
        assert response.status_code == 200
        assert response.json() == {
            "message": "If this email exists, OTP has been sent."
        }

        stmt = (
            select(PasswordResetToken)
            .join(User, PasswordResetToken.user_id == User.id)
            .where(User.email == "forgot@test.com")
        )
        result = await db_session.execute(stmt)
        token = result.scalars().first()
        assert token is not None
        assert len(token.otp) == 6


@pytest.mark.anyio
async def test_reset_password_success(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verifies reset password with correct OTP."""
    user = User(
        email="reset@test.com",
        name="Reset User",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    token = PasswordResetToken(
        user_id=user.id,
        otp="123456",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db_session.add(token)
    await db_session.commit()

    payload = {
        "email": "reset@test.com",
        "otp": "123456",
        "new_password": "newpassword123",
    }
    response = await client.post("/api/v1/auth/reset-password", json=payload)
    assert response.status_code == 200
    assert response.json() == {"message": "Password reset successful"}

    await db_session.refresh(user)
    assert verify_password("newpassword123", user.hashed_password)


@pytest.mark.anyio
async def test_reset_password_invalid_otp(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verifies reset password fails with incorrect OTP."""
    user = User(
        email="reset_fail@test.com",
        name="Reset User",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    token = PasswordResetToken(
        user_id=user.id,
        otp="123456",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db_session.add(token)
    await db_session.commit()

    payload = {
        "email": "reset_fail@test.com",
        "otp": "999999",
        "new_password": "newpassword123",
    }
    response = await client.post("/api/v1/auth/reset-password", json=payload)
    assert response.status_code == 400
    assert "Invalid or expired OTP" in response.json()["detail"]


@pytest.mark.anyio
async def test_reset_password_expired_otp(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verifies reset password fails with expired OTP."""
    user = User(
        email="reset_exp@test.com",
        name="Reset User",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    token = PasswordResetToken(
        user_id=user.id,
        otp="123456",
        expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    db_session.add(token)
    await db_session.commit()

    payload = {
        "email": "reset_exp@test.com",
        "otp": "123456",
        "new_password": "newpassword123",
    }
    response = await client.post("/api/v1/auth/reset-password", json=payload)
    assert response.status_code == 400
    assert "Invalid or expired OTP" in response.json()["detail"]
