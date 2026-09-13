import logging
import json

from google import genai
from google.genai import types

from config import Settings
from schemas.scheme_catalog import SchemeEnrichment, SchemeCatalogItem
from schemas.scheme_pdf import SchemePdfExtraction
from schemas.scheme_search import GeminiSchemeSearchResult, SchemeRecommendation
from schemas.user_profile import UserProfile

logger = logging.getLogger(__name__)


class GeminiServiceError(RuntimeError):
    """Raised when Gemini cannot return a valid structured result."""


class GeminiService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: genai.Client | None = None

    def _get_client(self) -> genai.Client:
        if not self._settings.gemini_api_key:
            logger.error("Gemini request blocked: GEMINI_API_KEY is not configured")
            raise GeminiServiceError("GEMINI_API_KEY is not configured")
        if self._client is None:
            try:
                self._client = genai.Client(api_key=self._settings.gemini_api_key)
            except Exception as exc:
                logger.exception("Unable to initialize Gemini client using model %s", self._settings.gemini_model)
                raise GeminiServiceError("Gemini client initialization failed") from exc
        return self._client

    async def _generate_content(self, contents, config):
        client = self._get_client()
        try:
            return await client.aio.models.generate_content(
                model=self._settings.gemini_model,
                contents=contents,
                config=config,
            )
        except Exception as exc:
            status_code = getattr(exc, "status_code", None)
            is_service_unavailable = status_code == 503 or str(exc).startswith("503 ")
            if not is_service_unavailable or self._settings.gemini_fallback_model == self._settings.gemini_model:
                raise
            logger.warning(
                "Gemini model %s returned 503; retrying with %s",
                self._settings.gemini_model,
                self._settings.gemini_fallback_model,
            )
            try:
                return await client.aio.models.generate_content(
                    model=self._settings.gemini_fallback_model,
                    contents=contents,
                    config=config,
                )
            except Exception:
                logger.exception("Gemini fallback model %s also failed", self._settings.gemini_fallback_model)
                raise

    async def analyze_story(self, story: str, system_instruction: str) -> UserProfile:
        try:
            response = await self._generate_content(
                contents=story,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=UserProfile,
                    temperature=0,
                ),
            )
        except Exception as exc:
            logger.exception("Gemini story analysis failed")
            raise GeminiServiceError("Gemini story analysis failed") from exc

        parsed = getattr(response, "parsed", None)
        if parsed is None:
            raise GeminiServiceError("Gemini returned no structured profile")
        try:
            return parsed if isinstance(parsed, UserProfile) else UserProfile.model_validate(parsed)
        except Exception as exc:
            raise GeminiServiceError("Gemini returned an invalid user profile") from exc

    async def search_schemes(
        self, query: str, schemes: list[SchemeCatalogItem], system_instruction: str
    ) -> list[SchemeRecommendation]:
        try:
            response = await self._generate_content(
                contents=json.dumps(
                    {"query": query, "schemes": [scheme.model_dump(mode="json") for scheme in schemes]},
                    ensure_ascii=True,
                ),
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=GeminiSchemeSearchResult,
                    temperature=0,
                ),
            )
        except Exception as exc:
            logger.exception("Gemini scheme search failed")
            raise GeminiServiceError("Gemini scheme search failed") from exc

        parsed = getattr(response, "parsed", None)
        if parsed is None:
            raise GeminiServiceError("Gemini returned no scheme recommendations")
        try:
            result = parsed if isinstance(parsed, GeminiSchemeSearchResult) else GeminiSchemeSearchResult.model_validate(parsed)
            return result.schemes
        except Exception as exc:
            raise GeminiServiceError("Gemini returned invalid scheme recommendations") from exc

    async def enrich_scheme(self, scheme: SchemeCatalogItem, system_instruction: str) -> SchemeEnrichment:
        try:
            response = await self._generate_content(
                contents=json.dumps(scheme.model_dump(mode="json"), ensure_ascii=True),
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=SchemeEnrichment,
                    temperature=0,
                ),
            )
        except Exception as exc:
            logger.exception("Gemini scheme enrichment failed")
            raise GeminiServiceError("Gemini scheme enrichment failed") from exc

        parsed = getattr(response, "parsed", None)
        if parsed is None:
            raise GeminiServiceError("Gemini returned no scheme definition")
        try:
            return parsed if isinstance(parsed, SchemeEnrichment) else SchemeEnrichment.model_validate(parsed)
        except Exception as exc:
            raise GeminiServiceError("Gemini returned an invalid scheme definition") from exc

    async def scan_scheme_pdf(self, pdf_bytes: bytes, system_instruction: str) -> SchemePdfExtraction:
        try:
            response = await self._generate_content(
                contents=[
                    types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
                    "Extract the government scheme details from this PDF.",
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=SchemePdfExtraction,
                    temperature=0,
                ),
            )
        except Exception as exc:
            logger.exception("Gemini scheme PDF scan failed")
            raise GeminiServiceError("Gemini scheme PDF scan failed") from exc

        parsed = getattr(response, "parsed", None)
        if parsed is None:
            raise GeminiServiceError("Gemini returned no scheme data from PDF")
        try:
            return parsed if isinstance(parsed, SchemePdfExtraction) else SchemePdfExtraction.model_validate(parsed)
        except Exception as exc:
            raise GeminiServiceError("Gemini returned invalid scheme data from PDF") from exc

    async def scan_scheme_text(self, source_url: str, text: str, system_instruction: str) -> SchemePdfExtraction:
        try:
            response = await self._generate_content(
                contents=f"OFFICIAL SOURCE: {source_url}\n\nDOCUMENT TEXT:\n{text}",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=SchemePdfExtraction,
                    temperature=0,
                ),
            )
        except Exception as exc:
            logger.exception("Gemini scheme text scan failed")
            raise GeminiServiceError("Gemini scheme text scan failed") from exc

        parsed = getattr(response, "parsed", None)
        if parsed is None:
            raise GeminiServiceError("Gemini returned no scheme data from page")
        try:
            return parsed if isinstance(parsed, SchemePdfExtraction) else SchemePdfExtraction.model_validate(parsed)
        except Exception as exc:
            raise GeminiServiceError("Gemini returned invalid scheme data from page") from exc
