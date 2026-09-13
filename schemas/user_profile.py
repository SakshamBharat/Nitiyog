from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """Facts explicitly extracted from a user's story."""

    intent: str | None = None
    state: str | None = None
    district: str | None = None
    occupation: str | None = None
    business_type: str | None = None
    requirements: list[str] = Field(default_factory=list)
    age: int | None = Field(default=None, ge=0, le=150)
    annual_income: float | None = Field(default=None, ge=0)
    social_category: str | None = None
    gender: str | None = None
