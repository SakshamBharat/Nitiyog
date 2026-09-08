// =============================================
// NITIYOG — Main Server (Node.js + Express)
// =============================================
require('dotenv').config();
const express        = require('express');
const path           = require('path');
const session        = require('express-session');
const pgSession      = require('connect-pg-simple')(session);
const bcrypt         = require('bcryptjs');
const pool           = require('./db/index');
const adminRoutes    = require('./routes/admin');
const { requireLogin, redirectIfLoggedIn } = require('./middleware/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  store: new pgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'nitiyog_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ROOT
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/home');
  res.redirect('/register');
});

// REGISTER
app.get('/register', redirectIfLoggedIn, (req, res) => {
  res.render('register', { title: 'Register - Nitiyog', error: null });
});
app.post('/register', async (req, res) => {
  try {
    const { fname, lname, phone, email, password, state, category, business } = req.body;
    if (!fname || !phone || !password) return res.render('register', { title: 'Register - Nitiyog', error: 'Please fill all required fields.' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (fname,lname,phone,email,password,state,category,business) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,fname,lname,phone,email,state,category,business,is_admin',
      [fname, lname, phone, email||null, hash, state, category, business]
    );
    req.session.user = result.rows[0];
    req.session.save(() => res.redirect('/otp'));
  } catch (err) {
    const msg = err.code === '23505' ? 'Mobile/email already registered. Please login.' : 'Registration failed. Try again.';
    res.render('register', { title: 'Register - Nitiyog', error: msg });
  }
});

// OTP
app.get('/otp', (req, res) => {
  if (!req.session.user) return res.redirect('/register');
  res.render('otp', { title: 'Verify OTP - Nitiyog', phone: req.session.user.phone || '' });
});
app.post('/otp', (req, res) => {
  const otp = req.body.otp || '';
  if (otp.length === 6) return res.redirect('/home');
  res.render('otp', { title: 'Verify OTP - Nitiyog', phone: req.session.user?.phone || '' });
});

// LOGIN
app.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('login', { title: 'Login - Nitiyog', error: null });
});
app.post('/login', async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    const identifier = phone || email;
    if (!identifier || !password) return res.render('login', { title: 'Login - Nitiyog', error: 'Please enter mobile/email and password.' });
    const result = await pool.query('SELECT * FROM users WHERE phone=$1 OR email=$1', [identifier]);
    if (!result.rows.length) return res.render('login', { title: 'Login - Nitiyog', error: 'Account not found. Please register first.' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { title: 'Login - Nitiyog', error: 'Wrong password. Please try again.' });
    req.session.user = { id:user.id, fname:user.fname, lname:user.lname, phone:user.phone, email:user.email, state:user.state, category:user.category, business:user.business, is_admin:user.is_admin };
    req.session.save(() => { if (user.is_admin) return res.redirect('/admin'); res.redirect('/home'); });
  } catch (err) {
    res.render('login', { title: 'Login - Nitiyog', error: 'Login failed. Try again.' });
  }
});

// LOGOUT
app.get('/logout', (req, res) => { req.session.destroy(() => res.redirect('/login')); });

// HOME DASHBOARD
app.get('/home', requireLogin, async (req, res) => {
  try {
    const user = req.session.user;
    const matchedSchemes = await pool.query(`
      SELECT * FROM schemes WHERE is_active=TRUE
        AND (category && $1::text[] OR 'All India'=ANY(state) OR $2=ANY(state))
      ORDER BY id LIMIT 6
    `, [user.category ? [user.category,'General'] : ['General'], user.state||'']);

    const applications = await pool.query(`
      SELECT a.*, s.title, s.ministry, s.benefit_amount
      FROM applications a JOIN schemes s ON s.id=a.scheme_id
      WHERE a.user_id=$1 ORDER BY a.applied_at DESC LIMIT 5
    `, [user.id]);

    res.render('home', {
      title: 'Dashboard - Nitiyog', user,
      schemes: matchedSchemes.rows,
      applications: applications.rows,
      stats: {
        matched: matchedSchemes.rows.length,
        applied: applications.rows.length,
        approved: applications.rows.filter(a=>a.status==='Approved').length,
        potential: '₹18L+'
      }
    });
  } catch (err) {
    res.render('home', { title:'Dashboard - Nitiyog', user:req.session.user, schemes:[], applications:[], stats:{matched:0,applied:0,approved:0,potential:'₹0'} });
  }
});

// APPLY
app.post('/apply/:schemeId', requireLogin, async (req, res) => {
  try {
    await pool.query("INSERT INTO applications (user_id,scheme_id,status) VALUES ($1,$2,'In Progress') ON CONFLICT (user_id,scheme_id) DO NOTHING", [req.session.user.id, req.params.schemeId]);
  } catch(e){}
  res.redirect('/home');
});

// SCHEME DETAIL
app.get('/scheme/:id', requireLogin, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM schemes WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.redirect('/home');
    const a = await pool.query('SELECT * FROM applications WHERE user_id=$1 AND scheme_id=$2', [req.session.user.id, req.params.id]);
    res.render('scheme-detail', { title: r.rows[0].title+' - Nitiyog', user:req.session.user, scheme:r.rows[0], application:a.rows[0]||null });
  } catch(e){ res.redirect('/home'); }
});

// ADMIN
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n' + '━'.repeat(50));
  console.log('  🚀 Nitiyog: http://localhost:' + PORT);
  console.log('  🔧 Admin:   http://localhost:' + PORT + '/admin');
  console.log('━'.repeat(50) + '\n');
});
