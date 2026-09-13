function requiredText(value, field, maxLength) {
  const text = String(value ?? "").trim();
  if (!text || text.length > maxLength) {
    throw new Error(`${field} is required and must be at most ${maxLength} characters.`);
  }
  return text;
}

function optionalText(value, maxLength) {
  const text = String(value ?? "").trim();
  if (text.length > maxLength) {
    throw new Error(`Text value must be at most ${maxLength} characters.`);
  }
  return text;
}

function listValue(value, field) {
  if (!Array.isArray(value) || value.length > 30 || value.some((item) => typeof item !== "string")) {
    throw new Error(`${field} must be an array of at most 30 text values.`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function governmentUrl(value, field) {
  const url = String(value ?? "").trim();
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    return parsed.toString();
  } catch {
    throw new Error(`${field} must be a valid HTTP or HTTPS URL.`);
  }
}

function officialGovernmentUrl(value, field) {
  const url = governmentUrl(value, field);
  const hostname = new URL(url).hostname.toLowerCase();
  const isOfficial = hostname === "myscheme.gov.in"
    || hostname.endsWith(".gov.in")
    || hostname.endsWith(".nic.in");
  if (!isOfficial) {
    throw new Error(`${field} must use an official .gov.in, .nic.in, or myscheme.gov.in domain.`);
  }
  return url;
}

function validateExtractedScheme(value) {
  if (!value || typeof value !== "object") throw new Error("AI returned no scheme data.");
  return {
    name: requiredText(value.name, "name", 255),
    shortDescription: optionalText(value.short_description, 500),
    description: requiredText(value.description, "description", 5000),
    category: optionalText(value.category || "General", 100) || "General",
    ministry: optionalText(value.ministry, 255),
    department: optionalText(value.department, 255),
    state: optionalText(value.state, 100),
    eligibility: listValue(value.eligibility || [], "eligibility"),
    benefits: listValue(value.benefits || [], "benefits"),
    requiredDocuments: listValue(value.documents || [], "documents"),
    applicationProcess: listValue(value.application_process || [], "application_process"),
    deadline: optionalText(value.deadline, 200),
    currentStatus: optionalText(value.current_status, 500),
    officialSource: optionalText(value.official_source, 500),
    searchableText: optionalText(value.searchable_text, 50000),
    keywords: listValue(value.keywords || [], "keywords")
  };
}

function validateEnrichment(value) {
  if (!value || typeof value !== "object") throw new Error("AI returned no enrichment data.");
  return {
    category: requiredText(value.category, "category", 100),
    aiDefinition: requiredText(value.ai_definition, "ai_definition", 5000),
    aiKeywords: listValue(value.ai_keywords, "ai_keywords")
  };
}

module.exports = {
  governmentUrl,
  officialGovernmentUrl,
  validateExtractedScheme,
  validateEnrichment
};
