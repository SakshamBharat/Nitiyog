const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");

const {
  User,
  Scheme,
  Application
} = require("../models");

const {
  requireAdmin
} = require("../middleware/auth");

const router = express.Router();


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


module.exports = router;
