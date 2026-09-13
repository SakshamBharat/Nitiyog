from pydantic import BaseModel, Field, HttpUrl


class SchemeRecommendation(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=500)
    tag: str = Field(min_length=1, max_length=50)
    explore_url: HttpUrl
    eligibility_reason: str = Field(min_length=1, max_length=300)


class GeminiSchemeSearchResult(BaseModel):
    schemes: list[SchemeRecommendation] = Field(default_factory=list, max_length=6)


class SchemeSearchResponse(BaseModel):
    success: bool = True
    query: str
    schemes: list[SchemeRecommendation]