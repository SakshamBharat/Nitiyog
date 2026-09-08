// =============================================
// NITIYOG — Admin Panel Routes
// =============================================
const express = require('express');
const router  = express.Router();
const pool    = require('../db/index');
const { requireAdmin } = require('../middleware/auth');

// All admin routes protected
router.use(requireAdmin);

// ── GET /admin ─── Dashboard ────────────────
router.get('/', async (req, res) => {
  try {
    const [schemesRes, usersRes, appsRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM schemes WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM users WHERE is_admin = FALSE'),
      pool.query('SELECT COUNT(*) FROM applications'),
    ]);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard - Nitiyog',
      admin: req.session.user,
      stats: {
        schemes:  schemesRes.rows[0].count,
        users:    usersRes.rows[0].count,
        apps:     appsRes.rows[0].count,
      }
    });
  } catch (err) {
    res.render('admin/dashboard', { title: 'Admin Dashboard', admin: req.session.user, stats: { schemes:0, users:0, apps:0 }, error: err.message });
  }
});

// ── GET /admin/schemes ─── List all schemes ──
router.get('/schemes', async (req, res) => {
  try {
    const search   = req.query.search || '';
    const category = req.query.category || '';
    const page     = parseInt(req.query.page) || 1;
    const limit    = 12;
    const offset   = (page - 1) * limit;

    let query  = 'SELECT * FROM schemes WHERE 1=1';
    let params = [];
    let pCount = 0;

    if (search) {
      pCount++;
      query  += ` AND (title ILIKE $${pCount} OR ministry ILIKE $${pCount} OR description ILIKE $${pCount})`;
      params.push('%' + search + '%');
    }
    if (category) {
      pCount++;
      query  += ` AND $${pCount} = ANY(category)`;
      params.push(category);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const [schemesRes, countRes] = await Promise.all([
      pool.query(query + ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, params),
      pool.query(countQuery, params)
    ]);

    const totalPages = Math.ceil(parseInt(countRes.rows[0].count) / limit);

    res.render('admin/schemes', {
      title: 'Manage Schemes - Nitiyog',
      admin: req.session.user,
      schemes: schemesRes.rows,
      search, category, page, totalPages,
      error: null, success: req.query.success || null
    });
  } catch (err) {
    res.render('admin/schemes', { title: 'Manage Schemes', admin: req.session.user, schemes: [], search:'', category:'', page:1, totalPages:1, error: err.message, success: null });
  }
});

// ── GET /admin/schemes/new ─── Add form ──────
router.get('/schemes/new', (req, res) => {
  res.render('admin/scheme-form', {
    title: 'Add Scheme - Nitiyog',
    admin: req.session.user,
    scheme: null,
    error: null
  });
});

// ── POST /admin/schemes/new ─── Save new ─────
router.post('/schemes/new', async (req, res) => {
  try {
    const f = req.body;
    // Parse comma-separated array fields
    const toArray = v => v ? v.split(',').map(x => x.trim()).filter(Boolean) : [];

    await pool.query(`
      INSERT INTO schemes (
        scheme_code, title, ministry, department,
        category, state, gender, min_age, max_age,
        business_type, max_income, benefit_type, benefit_amount,
        description, eligibility, how_to_apply, documents,
        deadline, scheme_url, is_active, source
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'admin')
    `, [
      f.scheme_code || 'SCH-' + Date.now(),
      f.title, f.ministry, f.department,
      toArray(f.category), toArray(f.state), toArray(f.gender),
      f.min_age || null, f.max_age || null,
      toArray(f.business_type),
      f.max_income || null,
      f.benefit_type, f.benefit_amount,
      f.description, f.eligibility, f.how_to_apply,
      toArray(f.documents),
      f.deadline || null, f.scheme_url,
      f.is_active === 'on' ? true : false
    ]);
    res.redirect('/admin/schemes?success=Scheme+added+successfully');
  } catch (err) {
    res.render('admin/scheme-form', { title: 'Add Scheme', admin: req.session.user, scheme: req.body, error: err.message });
  }
});

// ── GET /admin/schemes/:id/edit ─── Edit form ─
router.get('/schemes/:id/edit', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM schemes WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.redirect('/admin/schemes');
    res.render('admin/scheme-form', {
      title: 'Edit Scheme - Nitiyog',
      admin: req.session.user,
      scheme: result.rows[0],
      error: null
    });
  } catch (err) {
    res.redirect('/admin/schemes');
  }
});

// ── POST /admin/schemes/:id/edit ─── Update ──
router.post('/schemes/:id/edit', async (req, res) => {
  try {
    const f = req.body;
    const toArray = v => v ? v.split(',').map(x => x.trim()).filter(Boolean) : [];

    await pool.query(`
      UPDATE schemes SET
        title=$1, ministry=$2, department=$3,
        category=$4, state=$5, gender=$6,
        min_age=$7, max_age=$8, business_type=$9,
        max_income=$10, benefit_type=$11, benefit_amount=$12,
        description=$13, eligibility=$14, how_to_apply=$15,
        documents=$16, deadline=$17, scheme_url=$18,
        is_active=$19, updated_at=NOW()
      WHERE id=$20
    `, [
      f.title, f.ministry, f.department,
      toArray(f.category), toArray(f.state), toArray(f.gender),
      f.min_age || null, f.max_age || null,
      toArray(f.business_type),
      f.max_income || null,
      f.benefit_type, f.benefit_amount,
      f.description, f.eligibility, f.how_to_apply,
      toArray(f.documents),
      f.deadline || null, f.scheme_url,
      f.is_active === 'on' ? true : false,
      req.params.id
    ]);
    res.redirect('/admin/schemes?success=Scheme+updated+successfully');
  } catch (err) {
    const result = await pool.query('SELECT * FROM schemes WHERE id = $1', [req.params.id]).catch(() => ({ rows: [req.body] }));
    res.render('admin/scheme-form', { title: 'Edit Scheme', admin: req.session.user, scheme: result.rows[0], error: err.message });
  }
});

// ── POST /admin/schemes/:id/toggle ─── Active toggle ─
router.post('/schemes/:id/toggle', async (req, res) => {
  try {
    await pool.query('UPDATE schemes SET is_active = NOT is_active, updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.redirect('/admin/schemes?success=Status+updated');
  } catch (err) {
    res.redirect('/admin/schemes');
  }
});

// ── POST /admin/schemes/:id/delete ─── Delete ─
router.post('/schemes/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM schemes WHERE id=$1', [req.params.id]);
    res.redirect('/admin/schemes?success=Scheme+deleted');
  } catch (err) {
    res.redirect('/admin/schemes');
  }
});

// ── GET /admin/users ─── List users ──────────
router.get('/users', async (req, res) => {
  try {
    const users = await pool.query(
      'SELECT id, fname, lname, phone, email, state, category, business, created_at FROM users WHERE is_admin=FALSE ORDER BY created_at DESC LIMIT 100'
    );
    res.render('admin/users', { title: 'Users - Nitiyog', admin: req.session.user, users: users.rows, error: null });
  } catch (err) {
    res.render('admin/users', { title: 'Users', admin: req.session.user, users: [], error: err.message });
  }
});

// ── POST /admin/fetch-api ─── Fetch from MyScheme API ─
router.post('/fetch-api', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.redirect('/admin/schemes?success=Enter+a+keyword');

    // MyScheme.gov.in public search API
    const apiUrl = `https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=${encodeURIComponent(keyword)}&rows=10`;
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      timeout: 8000
    });

    if (!response.ok) throw new Error('MyScheme API returned ' + response.status);

    const data = await response.json();
    const apiSchemes = data?.data?.schemes || data?.schemes || [];

    let added = 0;
    for (const s of apiSchemes) {
      try {
        await pool.query(`
          INSERT INTO schemes (
            scheme_code, title, ministry, department,
            category, state, benefit_type, benefit_amount,
            description, eligibility, how_to_apply,
            scheme_url, source
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'myscheme-api')
          ON CONFLICT (scheme_code) DO NOTHING
        `, [
          'API-' + (s.schemeId || s.id || Date.now()),
          s.schemeName || s.title || 'Unknown Scheme',
          s.nodeName   || s.ministry || '',
          s.department || '',
          s.beneficiaries ? [s.beneficiaries] : [],
          s.state      ? [s.state] : ['All India'],
          s.schemeType || '',
          s.benefits   || '',
          s.briefDescription || s.description || '',
          s.eligibilityCriteria || '',
          s.applicationProcess || '',
          s.schemeUrl || s.url || ''
        ]);
        added++;
      } catch (insertErr) { /* skip duplicates */ }
    }

    res.redirect(`/admin/schemes?success=Fetched+${apiSchemes.length}+from+API,+added+${added}+new`);
  } catch (err) {
    res.redirect('/admin/schemes?error=API+fetch+failed:+' + encodeURIComponent(err.message));
  }
});

module.exports = router;
