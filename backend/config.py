import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development", description="Environment: development, staging, production")
    DEBUG: bool = Field(default=False, description="Enable debug mode")
    PORT: int = Field(default=8000, description="Port to listen on")
    APP_NAME: str = Field(default="RetailPulse Enterprise", description="Application name")
    APP_URL: str = Field(default="http://localhost:8000", description="Public URL")

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./retailpulse.db",
        description="Database connection string (SQLite for dev/test, PostgreSQL for staging/prod)"
    )

    # In-memory / Task broker
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")

    # JWT Authentication & Cryptography
    JWT_SECRET: str = Field(
        default="retailpulse-enterprise-jwt-secret-key-2026-prod",
        description="Cryptographic secret key for signing JWT tokens"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=10080, description="Token expiration duration in minutes (7 days)")

    # CORS & Security Headers
    ALLOWED_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:8000",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:8000",
            "http://127.0.0.1:5173",
            "https://retailpulse.in",
            "https://www.retailpulse.in",
            "https://api.retailpulse.in",
            "https://app.retailpulse.ai",
            "https://retailpulse.ai",
            "https://damru123-retailpulse.hf.space",
            "https://*.hf.space",
            "https://*.onrender.com"
        ],
        description="Allowed CORS origin domains"
    )

    # E-Commerce Integrations
    SHOPIFY_API_KEY: str = Field(default="live_shopify_key", description="Shopify Partner API Key")
    SHOPIFY_API_SECRET: str = Field(default="live_shopify_secret", description="Shopify Partner API Secret")

    # Billing & Payments
    RAZORPAY_KEY_ID: str = Field(default="rzp_test_RetailPulseAI2026", description="Razorpay Key ID")
    RAZORPAY_KEY_SECRET: str = Field(default="rzp_secret_RetailPulseLiveKey2026", description="Razorpay Key Secret")

    # Automated PO Dispatch / Email
    SMTP_HOST: str = Field(default="smtp.sendgrid.net", description="SMTP host for purchase order dispatches")
    SMTP_PORT: int = Field(default=587, description="SMTP port")
    SMTP_USER: str = Field(default="apikey", description="SMTP user")
    SMTP_PASSWORD: str = Field(default="", description="SMTP password")
    DEFAULT_FROM_EMAIL: str = Field(default="procurement@retailpulse.ai", description="Default sender email")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
