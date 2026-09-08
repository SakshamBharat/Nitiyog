const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const { sequelize, User, Profile, Scheme, Application } = require('./models');

// Seeders & Routes
const seedAdmin = require('./seeders/adminSeeder');
const authRoutes = require('./routes/authRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'nitiyog_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 Hours Session
}));

// View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Pass User Session to Express Views globally
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);

// Admin Module Protected Routes
app.use('/admin', adminRoutes);

// Frontend Views Renders
app.get('/', (req, res) => {
  res.render('index', { title: 'NitiYog - Scheme Matching Platform' });
});

app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('register');
});

app.get('/verify-otp', (req, res) => {
  const email = req.query.email || '';
  res.render('verify-otp', { email });
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return req.session.user.role === 'ADMIN' 
      ? res.redirect('/admin/dashboard') 
      : res.redirect('/dashboard');
  }
  res.render('login');
});

// Entrepreneur User Dashboard
// User Dashboard Route
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role === 'ADMIN') return res.redirect('/admin/dashboard');

  try {
    const userData = await User.findByPk(req.session.user.id, { include: [Profile] });
    const allSchemes = await Scheme.findAll({ where: { isActive: true } });
    const applications = await Application.findAll({
      where: { UserId: req.session.user.id },
      include: [Scheme]
    });

    // Run Matching Algorithm
    const { matchSchemesForUser } = require('./services/matchingService');
    const matchedSchemes = userData.Profile 
      ? matchSchemesForUser(userData.Profile, allSchemes) 
      : [];

    res.render('dashboard', {
      user: userData,
      allSchemes,
      matchedSchemes, // Dynamic matched schemes array
      applications
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).send('Server error loading dashboard');
  }
});

// Logout Endpoint
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Database Connection & Sync
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('✅ PostgreSQL Database synchronized.');
    
    // Auto-create Admin Account on server startup
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database Sync Error:', err);
  });