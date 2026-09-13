from schemas.scheme_catalog import SchemeCatalogItem, SchemeEnrichment
from schemas.scheme_pdf import SchemePdfExtraction
from schemas.scheme_search import SchemeRecommendation
from services.gemini_service import GeminiService


SCHEME_SEARCH_INSTRUCTION = """
You recommend only schemes from the supplied catalog for a citizen based on their
search text. Return 3 to 6 genuinely relevant schemes, ordered from best match to
weakest match. Never invent a scheme, benefit, eligibility rule, or URL. Preserve
the catalog name and links exactly.
Keep descriptions concise. The eligibility_reason must explain why the scheme
matches the search, without claiming the citizen is definitely eligible.
Answer in the same language used by the citizen's query. Keep official scheme
names and URLs unchanged.
Return a JSON object with a `schemes` array containing the recommendations.
""".strip()


class SchemeMatcher:
    def __init__(self, gemini_service: GeminiService) -> None:
        self._gemini_service = gemini_service

    async def search(self, query: str, schemes: list[SchemeCatalogItem], category: str | None = None) -> list[SchemeRecommendation]:
        search_text = query
        if category and category.lower() != "all":
            search_text = f"{query}. Focus category: {category}."
        return await self._gemini_service.search_schemes(search_text, schemes, SCHEME_SEARCH_INSTRUCTION)

    async def enrich(self, scheme: SchemeCatalogItem) -> SchemeEnrichment:
        instruction = """
        Create a precise searchable definition for this government scheme. Use only facts
        present in the supplied record. Return a concise definition, one broad category,
        and useful search keywords. Never add facts or eligibility requirements.
        """.strip()
        return await self._gemini_service.enrich_scheme(scheme, instruction)

    async def scan_pdf(self, pdf_bytes: bytes) -> SchemePdfExtraction:
        instruction = """
    Read the entire government scheme PDF, including every page, tables, headings,
    footnotes, and scanned/OCR text. Extract only facts explicitly present in the PDF.
    Do not guess or invent missing details. Convert the document into complete,
    searchable JSON: preserve important text in searchable_text, and turn eligibility,
    benefits, documents, application steps, deadlines, status, and keywords into
    separate points. Use an empty string or empty list when a fact is absent.
""".strip()
        return await self._gemini_service.scan_scheme_pdf(pdf_bytes, instruction)

    async def scan_text(self, source_url: str, text: str) -> SchemePdfExtraction:
        instruction = """
Extract a government scheme from this official portal text. Use only facts in the
text, preserve all important searchable content, and return structured points for
eligibility, benefits, documents, application steps, deadline, status, and keywords.
Return empty values when a fact is absent. Never invent facts.
""".strip()
        return await self._gemini_service.scan_scheme_text(source_url, text, instruction)