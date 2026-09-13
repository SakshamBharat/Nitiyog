const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const multer = require("multer");

const {
  User,
  Scheme,
  Application
} = require("../models");

const {
  requireAdmin
} = require("../middleware/auth");
const {
  governmentUrl,
  officialGovernmentUrl,
  validateEnrichment,
  validateExtractedScheme
} = require("../services/scheme-payload");

const router = express.Router();

const pythonApiUrl =
  process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    callback(null, file.mimetype === "application/pdf");
  }
});

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function enrichScheme(scheme) {
  const response = await fetch(`${pythonApiUrl}/ai/enrich-scheme`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheme })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || "AI scheme enrichment failed.");
  }
  return payload;
}

async function scanSchemePdf(file, sourceUrl, applicationUrl) {
  const form = new FormData();
  form.append("file", new Blob([file.buffer], { type: "application/pdf" }), file.originalname);
  const response = await fetch(`${pythonApiUrl}/ai/scan-scheme-pdf`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || "AI PDF scan failed.");
  }
  return { ...payload, sourceUrl, applicationUrl };
}

async function scanSchemeText(sourceUrl, text) {
  const response = await fetch(`${pythonApiUrl}/ai/scan-scheme-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_url: sourceUrl, text })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || "AI page scan failed.");
  return payload;
}

async function discoverOfficialSchemeUrls() {
  const sitemapUrls = [
    "https://www.myscheme.gov.in/sitemap-0.xml",
    "https://www.india.gov.in/sitemap.xml"
  ];
  const discovered = new Set();
  for (const sitemapUrl of sitemapUrls) {
    const response = await fetch(sitemapUrl);
    if (!response.ok) continue;
    const xml = await response.text();
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
      const url = match[1].trim();
      if (url.includes("myscheme.gov.in/schemes/") || url.includes("india.gov.in/my-government/schemes/")) {
        discovered.add(url);
      }
    }
  }
  return [...discovered];
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100_000);
}

async function fetchOfficialPdf(pdfUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(pdfUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`Official PDF returned HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type") || "";
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 10 * 1024 * 1024) throw new Error("Official PDF must be 10 MB or smaller.");
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > 10 * 1024 * 1024 || !buffer.subarray(0, 5).toString().startsWith("%PDF-")) {
      throw new Error("The official URL did not return a valid PDF.");
    }
    if (contentType && !contentType.includes("application/pdf")) {
      throw new Error("The official URL did not return a PDF content type.");
    }
    return { buffer, originalname: "official-scheme.pdf", mimetype: "application/pdf" };
  } finally {
    clearTimeout(timeout);
  }
}


const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});


/*
|--------------------------------------------------------------------------
| ADMIN LOGIN PAGE
|--------------------------------------------------------------------------
*/

router.get("/login", (req, res) => {
  if (req.user?.role === "ADMIN") {
    return res.redirect("/admin/dashboard");
  }

  res.render("admin/login");
});


/*
|--------------------------------------------------------------------------
| ADMIN LOGIN API
|--------------------------------------------------------------------------
*/

router.post(
  "/login",
  adminLoginLimiter,
  async (req, res) => {
    try {
      const email =
        String(req.body.email || "")
          .trim()
          .toLowerCase();

      const password =
        String(req.body.password || "");

      const admin =
        await User.findOne({
          where: {
            email,
            role: "ADMIN"
          }
        });

      if (!admin) {
        return res.status(401).json({
          error: "Invalid administrator credentials."
        });
      }

      const valid =
        await bcrypt.compare(
          password,
          admin.passwordHash
        );

      if (!valid) {
        return res.status(401).json({
          error: "Invalid administrator credentials."
        });
      }

      if (!admin.isActive) {
        return res.status(403).json({
          error: "Administrator account disabled."
        });
      }

      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({
            error: "Unable to create session."
          });
        }

        req.session.userId = admin.id;

        res.json({
          message: "Administrator login successful.",

          user: {
            id: admin.id,
            email: admin.email,
            role: admin.role
          }
        });
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Admin login failed."
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  requireAdmin,
  async (req, res) => {
    const [
      users,
      schemes,
      applications
    ] = await Promise.all([
      User.count({
        where: {
          role: "USER"
        }
      }),

      Scheme.count(),

      Application.count()
    ]);

    res.render("admin/index", {
      user: req.user,
      stats: {
        users,
        schemes,
        applications
      }
    });
  }
);


router.post("/schemes/upload-pdf", requireAdmin, (req, res) => {
  pdfUpload.single("schemePdf")(req, res, async (uploadError) => {
    try {
      if (uploadError) {
        return res.status(400).json({ error: "Upload a PDF smaller than 10 MB." });
      }
      const pdfUrl = req.body.pdfUrl
        ? officialGovernmentUrl(req.body.pdfUrl, "pdfUrl")
        : null;
      if (!req.file && !pdfUrl) {
        return res.status(400).json({ error: "Select a PDF or provide an official government PDF URL." });
      }

      const sourceUrl = officialGovernmentUrl(
        req.body.sourceUrl || pdfUrl || "https://www.myscheme.gov.in/",
        "sourceUrl"
      );
      const applicationUrl = governmentUrl(req.body.applicationUrl || sourceUrl, "applicationUrl");
      const pdfFile = req.file || await fetchOfficialPdf(pdfUrl);
      const scanPayload = await scanSchemePdf(pdfFile, sourceUrl, applicationUrl);
      const scanned = validateExtractedScheme(scanPayload.scheme);
      const enrichmentPayload = await enrichScheme({
        name: scanned.name,
        short_description: scanned.shortDescription,
        description: scanned.description,
        category: scanned.category,
        ministry: scanned.ministry,
        department: scanned.department,
        state: scanned.state,
        application_url: applicationUrl,
        source_url: sourceUrl,
        eligibility: scanned.eligibility,
        benefits: scanned.benefits,
        documents: scanned.requiredDocuments,
        application_process: scanned.applicationProcess,
        deadline: scanned.deadline,
        current_status: scanned.currentStatus,
        searchable_text: scanned.searchableText,
        keywords: scanned.keywords,
        ai_definition: "",
        ai_keywords: []
      });
      const enrichment = validateEnrichment(enrichmentPayload.enrichment);
      const scheme = await Scheme.create({
        name: scanned.name,
        slug: `${slugify(scanned.name)}-${Date.now()}`,
        shortDescription: scanned.shortDescription,
        description: scanned.description,
        category: scanned.category,
        ministry: scanned.ministry,
        department: scanned.department,
        state: scanned.state,
        applicationUrl,
        sourceUrl,
          pdfSourceUrl: pdfUrl || sourceUrl,
        sourceName: "Government PDF / myScheme.gov.in",
        eligibility: scanned.eligibility,
        benefits: scanned.benefits,
        requiredDocuments: scanned.requiredDocuments,
        applicationProcess: scanned.applicationProcess,
        deadline: scanned.deadline,
        currentStatus: scanned.currentStatus,
        searchableText: scanned.searchableText,
        extractedKeywords: scanned.keywords,
        aiDefinition: enrichment.aiDefinition,
        aiKeywords: enrichment.aiKeywords,
        lastSyncedAt: new Date(),
        status: req.body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        createdBy: req.user.id
      });
      return res.status(201).json({ success: true, scheme });
    } catch (error) {
      console.error("Scheme PDF upload failed:", error);
      return res.status(502).json({ error: error.message || "Scheme PDF upload failed." });
    }
  });
});


router.post("/schemes/sync-official", requireAdmin, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.body?.limit) || 5, 1), 25);
  try {
    const urls = (await discoverOfficialSchemeUrls()).slice(0, limit);
    let imported = 0;
    const errors = [];
    for (const sourceUrl of urls) {
      try {
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const extractedPayload = await scanSchemeText(sourceUrl, htmlToText(await response.text()));
        const scanned = validateExtractedScheme(extractedPayload.scheme);
        const enrichmentPayload = await enrichScheme({
          name: scanned.name,
          short_description: scanned.shortDescription,
          description: scanned.description,
          category: scanned.category,
          ministry: scanned.ministry,
          department: scanned.department,
          state: scanned.state,
          application_url: sourceUrl,
          source_url: sourceUrl,
          eligibility: scanned.eligibility,
          benefits: scanned.benefits,
          documents: scanned.requiredDocuments,
          application_process: scanned.applicationProcess,
          deadline: scanned.deadline,
          current_status: scanned.currentStatus,
          searchable_text: scanned.searchableText,
          keywords: scanned.keywords,
          ai_definition: "",
          ai_keywords: []
        });
        const enrichment = validateEnrichment(enrichmentPayload.enrichment);
        const existing = await Scheme.findOne({ where: { sourceUrl } });
        const values = {
          name: scanned.name,
          slug: existing?.slug || `${slugify(scanned.name)}-${Date.now()}`,
          shortDescription: scanned.shortDescription,
          description: scanned.description,
          category: scanned.category,
          ministry: scanned.ministry,
          department: scanned.department,
          state: scanned.state,
          applicationUrl: sourceUrl,
          sourceUrl,
          sourceName: sourceUrl.includes("myscheme.gov.in") ? "myScheme.gov.in" : "India.gov.in",
          eligibility: scanned.eligibility,
          benefits: scanned.benefits,
          requiredDocuments: scanned.requiredDocuments,
          applicationProcess: scanned.applicationProcess,
          deadline: scanned.deadline,
          currentStatus: scanned.currentStatus,
          searchableText: scanned.searchableText,
          extractedKeywords: scanned.keywords,
          aiDefinition: enrichment.aiDefinition,
          aiKeywords: enrichment.aiKeywords,
          lastSyncedAt: new Date(),
          status: "PUBLISHED",
          createdBy: req.user.id
        };
        if (existing) await existing.update(values);
        else await Scheme.create(values);
        imported += 1;
      } catch (error) {
        console.error("Official scheme sync failed:", sourceUrl, error);
        errors.push({ sourceUrl, error: error.message });
      }
    }
    return res.json({ success: true, discovered: urls.length, imported, errors });
  } catch (error) {
    console.error("Official scheme discovery failed:", error);
    return res.status(502).json({ error: error.message || "Official scheme sync failed." });
  }
});


router.post("/schemes", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    const sourceUrl = governmentUrl(body.sourceUrl || "https://www.myscheme.gov.in/", "sourceUrl");
    const applicationUrl = governmentUrl(body.applicationUrl || sourceUrl, "applicationUrl");
    if (!name) {
      return res.status(400).json({ error: "Scheme name is required." });
    }

    const schemeInput = {
      name,
      short_description: String(body.shortDescription || ""),
      description: String(body.description || ""),
      category: String(body.category || "General"),
      ministry: String(body.ministry || ""),
      department: String(body.department || ""),
      state: String(body.state || ""),
      application_url: applicationUrl,
      source_url: sourceUrl,
      eligibility: Array.isArray(body.eligibility) ? body.eligibility : [],
      benefits: Array.isArray(body.benefits) ? body.benefits : [],
      documents: Array.isArray(body.requiredDocuments) ? body.requiredDocuments : [],
      ai_definition: "",
      ai_keywords: []
    };
    const enrichmentPayload = await enrichScheme(schemeInput);
    const enrichment = validateEnrichment(enrichmentPayload.enrichment);
    const scheme = await Scheme.create({
      name,
      slug: `${slugify(name)}-${Date.now()}`,
      shortDescription: body.shortDescription,
      description: body.description,
      category: schemeInput.category,
      department: body.department,
      ministry: body.ministry,
      state: body.state,
      applicationUrl,
      sourceUrl,
      sourceName: sourceUrl.includes("myscheme.gov.in") ? "myScheme.gov.in" : "Admin panel",
      eligibility: schemeInput.eligibility,
      benefits: schemeInput.benefits,
      requiredDocuments: schemeInput.documents,
      aiDefinition: enrichment.aiDefinition,
      aiKeywords: enrichment.aiKeywords,
      lastSyncedAt: new Date(),
      status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      createdBy: req.user.id
    });
    return res.status(201).json({ success: true, scheme });
  } catch (error) {
    console.error("Scheme creation failed:", error);
    return res.status(502).json({ error: error.message || "Scheme creation failed." });
  }
});


module.exports = router;
