const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");

const {
  User
} = require("../models");

const {
  createAndSendOtp,
  verifyOtp
} = require("../services/otp.service");

const router = express.Router();


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  message: {
    error: "Too many login attempts. Please try again later."
  }
});


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      category,
      gender,
      age,
      mobile,
      state,
      city,
      pincode
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        error: "Required fields are missing."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error:
          "Password must contain at least 8 characters."
      });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        error: "Enter a valid Indian mobile number."
      });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        error: "Enter a valid PIN code."
      });
    }

    if (Number(age) < 18 || Number(age) > 100) {
      return res.status(400).json({
        error: "Age must be between 18 and 100."
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        where: {
          email: normalizedEmail
        }
      });

    if (existingUser) {
      return res.status(409).json({
        error:
          "An account with this email already exists."
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "USER",
      category,
      gender,
      age: Number(age),
      mobile,
      state,
      city: city.trim(),
      pincode,
      isEmailVerified: false,
      isActive: true
    });

    await createAndSendOtp(user);

    return res.status(201).json({
      message:
        "Account created. A verification code has been sent to your email.",
      needVerification: true
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      error: "Unable to create account."
    });
  }
});


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
  "/login",
  loginLimiter,
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      const normalizedEmail =
        String(email || "")
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          where: {
            email: normalizedEmail
          }
        });

      if (!user) {
        return res.status(401).json({
          error:
            "The email or password is incorrect."
        });
      }

      const passwordValid =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!passwordValid) {
        return res.status(401).json({
          error:
            "The email or password is incorrect."
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          error:
            "This account has been disabled."
        });
      }

      if (
        user.role === "USER" &&
        !user.isEmailVerified
      ) {
        return res.status(403).json({
          error:
            "Please verify your email address first.",
          needVerification: true
        });
      }

      user.lastLoginAt = new Date();
      await user.save();

      req.session.regenerate((err) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            error: "Unable to create session."
          });
        }

        req.session.userId = user.id;

        return res.json({
          message: "Login successful.",

          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName
          }
        });
      });

    } catch (error) {
      console.error("Login error:", error);

      res.status(500).json({
        error: "Unable to login."
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| VERIFY OTP
|--------------------------------------------------------------------------
*/

router.post("/verify-otp", async (req, res) => {
  try {
    const {
      email,
      otp
    } = req.body;

    const normalizedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        where: {
          email: normalizedEmail
        }
      });

    if (!user) {
      return res.status(404).json({
        error: "Account not found."
      });
    }

    const result =
      await verifyOtp(user, String(otp || ""));

    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }

    return res.json({
      message:
        "Email verified successfully.",
      redirect: "/login"
    });

  } catch (error) {
    console.error("OTP verification error:", error);

    res.status(500).json({
      error: "Unable to verify OTP."
    });
  }
});


/*
|--------------------------------------------------------------------------
| RESEND OTP
|--------------------------------------------------------------------------
*/

router.post("/resend-otp", async (req, res) => {
  try {
    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        where: { email }
      });

    if (!user) {
      return res.status(404).json({
        error: "Account not found."
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        error: "Email is already verified."
      });
    }

    await createAndSendOtp(user);

    res.json({
      message: "A new OTP has been sent."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to resend OTP."
    });
  }
});


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        error: "Unable to logout."
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      message: "Logged out successfully."
    });
  });
});


module.exports = router;
