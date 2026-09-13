const { User } = require("../models");

async function loadUser(req, res, next) {
  try {
    if (!req.session.userId) {
      return next();
    }

    const user = await User.findByPk(
      req.session.userId
    );

    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return next();
    }

    req.user = user;

    next();

  } catch (error) {
    next(error);
  }
}


function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect("/login");
  }

  next();
}


function requireUser(req, res, next) {
  if (!req.user) {
    return res.redirect("/login");
  }

  if (req.user.role !== "USER") {
    return res.status(403).send("Forbidden");
  }

  next();
}


function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.redirect("/admin/login");
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).send("Forbidden");
  }

  next();
}


module.exports = {
  loadUser,
  requireAuth,
  requireUser,
  requireAdmin
};