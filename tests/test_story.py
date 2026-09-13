import pytest
from httpx import ASGITransport, AsyncClient

from main import app
from routes import story as story_route
from routes import schemes as schemes_route
from schemas.scheme_search import SchemeRecommendation
from schemas.scheme_pdf import SchemePdfExtraction
from schemas.user_profile import UserProfile


class FakeStoryAnalyzer:
    async def analyze(self, story: str) -> UserProfile:
        assert story == "Main Lucknow mein tailoring business start karna chahta hu."
        return UserProfile(
            intent="business_startup",
            state="Uttar Pradesh",
            district="Lucknow",
            occupation="entrepreneur",
            business_type="tailoring",
            requirements=["business_startup", "financial_assistance"],
        )


class FakeSchemeMatcher:
    async def search(
        self,
        query: str,
        schemes: list[object],
        category: str | None,
    ) -> list[SchemeRecommendation]:
        assert query == "tailoring business support"
        assert schemes == []
        assert category == "Employment"
        return [
            SchemeRecommendation(
                title="PM SVANidhi",
                category="Employment",
                description="Working capital support for eligible street vendors.",
                tag="Business support",
                explore_url="https://www.india.gov.in/",
                eligibility_reason="It may support a small livelihood business.",
            )
        ]

    async def scan_pdf(self, pdf_bytes: bytes) -> SchemePdfExtraction:
        assert pdf_bytes == b"%PDF-1.7 test"
        return SchemePdfExtraction(
            name="Test Scheme",
            description="Support for eligible citizens.",
            category="Employment",
            eligibility=["Resident citizen"],
            benefits=["Training support"],
            documents=["Identity proof"],
            application_process=["Submit application online"],
            deadline="31 March 2027",
            current_status="Applications open",
            official_source="https://www.myscheme.gov.in/",
            searchable_text="Test Scheme supports eligible citizens through training.",
            keywords=["training", "employment"],
        )

    async def scan_text(self, source_url: str, text: str) -> SchemePdfExtraction:
        assert source_url == "https://www.myscheme.gov.in/schemes/test"
        assert "official scheme" in text
        return SchemePdfExtraction(name="Text Scheme", description="Official scheme details.")


@pytest.mark.asyncio
async def test_health() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_analyze_story_returns_structured_profile(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(story_route, "_analyzer", FakeStoryAnalyzer())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/ai/analyze-story",
            json={"story": "Main Lucknow mein tailoring business start karna chahta hu."},
        )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["profile"]["age"] is None
    assert response.json()["profile"]["district"] == "Lucknow"


@pytest.mark.asyncio
async def test_analyze_story_rejects_blank_story() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/ai/analyze-story", json={"story": "   "})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_scheme_search_returns_recommendations(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(schemes_route, "_matcher", FakeSchemeMatcher())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/ai/search-schemes",
            json={"query": "tailoring business support", "category": "Employment"},
        )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["schemes"][0]["title"] == "PM SVANidhi"


@pytest.mark.asyncio
async def test_scheme_pdf_rejects_non_pdf_content(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(schemes_route, "_matcher", FakeSchemeMatcher())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/ai/scan-scheme-pdf",
            files={"file": ("scheme.txt", b"not pdf", "text/plain")},
        )
    assert response.status_code == 415


@pytest.mark.asyncio
async def test_scheme_pdf_returns_typed_scheme(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(schemes_route, "_matcher", FakeSchemeMatcher())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/ai/scan-scheme-pdf",
            files={"file": ("scheme.pdf", b"%PDF-1.7 test", "application/pdf")},
        )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["scheme"]["name"] == "Test Scheme"
    assert response.json()["scheme"]["application_process"] == ["Submit application online"]
    assert response.json()["scheme"]["keywords"] == ["training", "employment"]


@pytest.mark.asyncio
async def test_scheme_text_returns_typed_scheme(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(schemes_route, "_matcher", FakeSchemeMatcher())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/ai/scan-scheme-text",
            json={
                "source_url": "https://www.myscheme.gov.in/schemes/test",
                "text": "This is official scheme text with eligibility and benefits details. The scheme provides support to eligible citizens and explains the application process, required documents, and current status.",
            },
        )
    assert response.status_code == 200
    assert response.json()["scheme"]["name"] == "Text Scheme"
