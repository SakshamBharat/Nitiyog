const express = require("express");

const {
  requireUser,
  requireAdmin
} = require("../middleware/auth");

const router = express.Router();


router.get("/", (req, res) => {
  res.render("user/index", {
    user: req.user || null
  });
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
