import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
OTP_REGEX = re.compile(r"^\d{6}$")


class UserRegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    name: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format")
        return v


class UserRegisterResponse(BaseModel):
    message: str


class UserLoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format")
        return v


class UserLoginResponseDetail(BaseModel):
    id: UUID
    email: str
    name: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserLoginResponseDetail


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format")
        return v


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str = Field(..., min_length=8)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        v = v.strip()
        if not OTP_REGEX.match(v):
            raise ValueError("OTP must be exactly 6 digits")
        return v


class ResetPasswordResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    created_at: datetime
