from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class SchemeCatalogItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=255)
    short_description: str = Field(default="", max_length=500)
    description: str = Field(default="", max_length=5000)
    category: str = Field(default="General", max_length=100)
    ministry: str = Field(default="", max_length=255)
    department: str = Field(default="", max_length=255)
    state: str = Field(default="", max_length=100)
    application_url: HttpUrl
    source_url: HttpUrl
    eligibility: list[str] = Field(default_factory=list, max_length=30)
    benefits: list[str] = Field(default_factory=list, max_length=30)
    documents: list[str] = Field(default_factory=list, max_length=30)
    application_process: list[str] = Field(default_factory=list, max_length=30)
    deadline: str = Field(default="", max_length=200)
    current_status: str = Field(default="", max_length=500)
    searchable_text: str = Field(default="", max_length=50_000)
    keywords: list[str] = Field(default_factory=list, max_length=100)
    ai_definition: str = Field(default="", max_length=5000)
    ai_keywords: list[str] = Field(default_factory=list, max_length=50)


class SchemeEnrichment(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    ai_definition: str = Field(min_length=1, max_length=5000)
    ai_keywords: list[str] = Field(min_length=1, max_length=50)
