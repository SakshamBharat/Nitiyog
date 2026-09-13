import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from config import get_settings
from schemas.user_profile import UserProfile
from services.gemini_service import GeminiService, GeminiServiceError
from services.story_analyzer import StoryAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI analysis"])
_analyzer = StoryAnalyzer(GeminiService(get_settings()))


class AnalyzeStoryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    story: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10_000)]


class AnalyzeStoryResponse(BaseModel):
    success: bool = True
    profile: UserProfile


@router.post("/analyze-story", response_model=AnalyzeStoryResponse)
async def analyze_story(request: AnalyzeStoryRequest) -> AnalyzeStoryResponse:
    try:
        profile = await _analyzer.analyze(request.story)
    except GeminiServiceError as exc:
        logger.warning("Story analysis unavailable: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected story analysis error")
        raise HTTPException(status_code=500, detail="Story analysis failed") from exc
    return AnalyzeStoryResponse(profile=profile)
