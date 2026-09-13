const express = require("express");
const { Scheme } = require("../models");

const {
  requireUser,
  requireAdmin
} = require("../middleware/auth");

const router = express.Router();

const pythonApiUrl =
  process.env.PYTHON_API_URL || "http://127.0.0.1:8000";


router.get("/", (req, res) => {
  res.render("user/index", {
    user: req.user || null
  });
});


router.get("/sarthak-ai", (req, res) => {
  res.render("user/sarthak-ai", {
    user: req.user || null,
    query: typeof req.query.query === "string" ? req.query.query : "",
    category: typeof req.query.category === "string" ? req.query.category : "all"
  });
});


router.get("/schemes/:slug", async (req, res, next) => {
  try {
    const scheme = await Scheme.findOne({
      where: { slug: req.params.slug, status: "PUBLISHED" }
    });
    if (!scheme) return res.status(404).send("Scheme not found");
    return res.render("user/scheme-detail", {
      user: req.user || null,
      scheme
    });
  } catch (error) {
    return next(error);
  }
});


router.post("/api/schemes/search", async (req, res) => {
  const query = typeof req.body?.query === "string"
    ? req.body.query.trim()
    : "";
  const category = typeof req.body?.category === "string"
    ? req.body.category.trim()
    : "all";

  if (!query) {
    return res.status(400).json({
      error: "Search text is required."
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const storedSchemes = await Scheme.findAll({
      where: { status: "PUBLISHED" },
      order: [["lastSyncedAt", "DESC"], ["createdAt", "DESC"]],
      limit: 300
    });
    const catalog = storedSchemes.map((scheme) => ({
      name: scheme.name,
      short_description: scheme.shortDescription || "",
      description: scheme.description || "",
      category: scheme.category || "General",
      ministry: scheme.ministry || "",
      department: scheme.department || "",
      state: scheme.state || "",
      application_url: scheme.applicationUrl || scheme.sourceUrl || "https://www.myscheme.gov.in/",
      source_url: scheme.sourceUrl || scheme.applicationUrl || "https://www.myscheme.gov.in/",
      eligibility: scheme.eligibility || [],
      benefits: scheme.benefits || [],
      documents: scheme.requiredDocuments || [],
      application_process: scheme.applicationProcess || [],
      deadline: scheme.deadline || "",
      current_status: scheme.currentStatus || "",
      searchable_text: scheme.searchableText || "",
      keywords: scheme.extractedKeywords || [],
      ai_definition: scheme.aiDefinition || "",
      ai_keywords: scheme.aiKeywords || []
    }));

    const response = await fetch(
      `${pythonApiUrl}/ai/search-schemes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, category, schemes: catalog }),
        signal: controller.signal
      }
    );
    const responseText = await response.text();
    let payload;
    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error("FastAPI returned invalid JSON for scheme search:", parseError.message);
      return res.status(502).json({
        error: "The AI scheme service returned an invalid response."
      });
    }

    if (!response.ok) {
      console.error("FastAPI scheme search failed:", response.status, payload.detail || payload);
      return res.status(response.status >= 500 ? 502 : response.status).json({
        error: payload.detail || "Scheme search is unavailable."
      });
    }

    const schemeByName = new Map(storedSchemes.map((scheme) => [scheme.name.toLowerCase(), scheme]));
    payload.schemes = (payload.schemes || []).map((recommendation) => {
      const matchedScheme = schemeByName.get(String(recommendation.title || "").toLowerCase());
      return {
        ...recommendation,
        detail_url: matchedScheme ? `/schemes/${encodeURIComponent(matchedScheme.slug)}` : null
      };
    });
    return res.json(payload);
  } catch (error) {
    console.error("Python scheme search request failed:", error.message);
    return res.status(502).json({
      error: "The AI scheme service is unavailable. Start the FastAPI service and try again."
    });
  } finally {
    clearTimeout(timeout);
  }
});


router.get("/register", (req, res) => {
  if (req.user) {
    return res.redirect(
      req.user.role === "ADMIN"
        ? "/admin/dashboard"
        : "/dashboard"
    );
  }

  res.render("register");
});


router.get("/login", (req, res) => {
  if (req.user) {
    return res.redirect(
      req.user.role === "ADMIN"
        ? "/admin/dashboard"
        : "/dashboard"
    );
  }

  res.render("login");
});


router.get("/verify-otp", (req, res) => {
  res.render("verify-otp", {
    email: req.query.email || ""
  });
});


router.get(
  "/dashboard",
  requireUser,
  (req, res) => {
    res.render("user/index", {
      user: req.user
    });
  }
);


module.exports = router;
