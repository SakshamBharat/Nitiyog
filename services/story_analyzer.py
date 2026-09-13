from schemas.user_profile import UserProfile
from services.gemini_service import GeminiService

STORY_ANALYSIS_INSTRUCTION = """
You extract facts from a user's story for a government scheme matching platform.
Return only information explicitly stated or unambiguously expressed in the story.
Never infer, guess, complete, or assume facts. Use null for unknown scalar fields and
an empty list for requirements when none are explicitly stated. Preserve the user's
meaning, but normalize obvious location and category names when the story provides
those names. Do not decide scheme eligibility.
""".strip()


class StoryAnalyzer:
    def __init__(self, gemini_service: GeminiService) -> None:
        self._gemini_service = gemini_service

    async def analyze(self, story: str) -> UserProfile:
        return await self._gemini_service.analyze_story(story, STORY_ANALYSIS_INSTRUCTION)
