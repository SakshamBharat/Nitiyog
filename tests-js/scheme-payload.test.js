const test = require("node:test");
const assert = require("node:assert/strict");

const {
  governmentUrl,
  validateEnrichment,
  validateExtractedScheme
} = require("../services/scheme-payload");

test("validates and normalizes an extracted scheme", () => {
  const scheme = validateExtractedScheme({
    name: " PM Kisan ",
    description: "Income support for eligible farmers.",
    eligibility: ["Landholding farmer"],
    benefits: ["Income support"],
    documents: ["Identity proof"]
  });

  assert.equal(scheme.name, "PM Kisan");
  assert.equal(scheme.category, "General");
  assert.deepEqual(scheme.requiredDocuments, ["Identity proof"]);
});

test("rejects malformed extracted scheme data", () => {
  assert.throws(
    () => validateExtractedScheme({ name: "Missing description" }),
    /description is required/
  );
});

test("validates enrichment and official URLs", () => {
  const enrichment = validateEnrichment({
    category: "Agriculture",
    ai_definition: "Farmer income support scheme.",
    ai_keywords: ["farmer", "income"]
  });

  assert.equal(enrichment.category, "Agriculture");
  assert.equal(governmentUrl("https://www.myscheme.gov.in/", "sourceUrl"), "https://www.myscheme.gov.in/");
});

test("rejects non-http URLs", () => {
  assert.throws(() => governmentUrl("javascript:alert(1)", "sourceUrl"), /valid HTTP or HTTPS URL/);
});