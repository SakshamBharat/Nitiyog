from pydantic import BaseModel

from schemas.scheme_catalog import SchemeEnrichment
from schemas.scheme_pdf import SchemePdfExtraction


class SchemeEnrichmentResponse(BaseModel):
    success: bool = True
    enrichment: SchemeEnrichment


class SchemePdfResponse(BaseModel):
    success: bool = True
    scheme: SchemePdfExtraction