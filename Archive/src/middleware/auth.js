// =============================================
// NITIYOG — Auth Middleware
// =============================================

function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) return next();
  res.status(403).send('Access denied. Admin only.');
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.user) return res.redirect('/home');
  next();
}

module.exports = { requireLogin, requireAdmin, redirectIfLoggedIn };
