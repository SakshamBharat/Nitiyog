import logging
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from config import get_settings
from schemas.scheme_search import SchemeSearchResponse
from schemas.scheme_catalog import SchemeCatalogItem
from schemas.scheme_api import SchemeEnrichmentResponse, SchemePdfResponse
from schemas.scheme_pdf import SchemeTextRequest
from services.gemini_service import GeminiService, GeminiServiceError
from services.scheme_matcher import SchemeMatcher

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["Scheme search"])
_matcher = SchemeMatcher(GeminiService(get_settings()))


class SchemeSearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
    category: str | None = Field(default=None, max_length=80)
    schemes: list[SchemeCatalogItem] = Field(default_factory=list, max_length=300)


@router.post("/search-schemes", response_model=SchemeSearchResponse)
async def search_schemes(request: SchemeSearchRequest) -> SchemeSearchResponse:
    try:
        schemes = await _matcher.search(request.query, request.schemes, request.category)
    except GeminiServiceError as exc:
        logger.warning("Gemini scheme search unavailable: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected scheme search error")
        raise HTTPException(status_code=500, detail="Scheme search failed") from exc
    return SchemeSearchResponse(query=request.query, schemes=schemes)


class SchemeEnrichRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scheme: SchemeCatalogItem


@router.post("/enrich-scheme", response_model=SchemeEnrichmentResponse)
async def enrich_scheme(request: SchemeEnrichRequest) -> SchemeEnrichmentResponse:
    try:
        enrichment = await _matcher.enrich(request.scheme)
    except GeminiServiceError as exc:
        logger.warning("Gemini scheme enrichment unavailable: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected scheme enrichment error")
        raise HTTPException(status_code=500, detail="Scheme enrichment failed") from exc
    return SchemeEnrichmentResponse(enrichment=enrichment)


@router.post("/scan-scheme-pdf", response_model=SchemePdfResponse)
async def scan_scheme_pdf(file: UploadFile = File(...)) -> SchemePdfResponse:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Only PDF files are supported.")
    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")
    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="The uploaded file is not a valid PDF.")
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="PDF must be 10 MB or smaller.")
    try:
        extraction = await _matcher.scan_pdf(pdf_bytes)
    except GeminiServiceError as exc:
        logger.warning("Gemini PDF scan unavailable: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected scheme PDF scan error")
        raise HTTPException(status_code=500, detail="Scheme PDF scan failed") from exc
    return SchemePdfResponse(scheme=extraction)

@router.post("/scan-scheme-text", response_model=SchemePdfResponse)
async def scan_scheme_text(request: SchemeTextRequest) -> SchemePdfResponse:
    try:
        extraction = await _matcher.scan_text(request.source_url, request.text)
    except GeminiServiceError as exc:
        logger.warning("Gemini scheme page scan unavailable: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected scheme page scan error")
        raise HTTPException(status_code=500, detail="Scheme page scan failed") from exc
    return SchemePdfResponse(scheme=extraction)