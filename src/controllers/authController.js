const { User, Profile, sequelize } = require('../models');
const { sendOTPEmail } = require('../services/mailService');


// =========================
// GENERATE OTP
// =========================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// =========================
// REGISTER USER
// =========================
exports.registerUser = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      fname,
      lname,
      name,
      email,
      password,
      profile
    } = req.body;

    const finalName =
      `${fname || ''} ${lname || ''}`.trim() || name;

    if (!finalName || !email || !password) {
      await transaction.rollback();

      return res.status(400).json({
        error: 'Name, email and password are required'
      });
    }

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      await transaction.rollback();

      return res.status(400).json({
        error: 'Email already registered'
      });
    }

    const otp = generateOTP();

    const otpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // IMPORTANT:
    // Registration can ONLY create USER accounts.
    const newUser = await User.create({
      name: finalName,
      email,
      password,
      role: 'USER',
      otp,
      otpExpiresAt,
      isVerified: false
    }, {
      transaction
    });


    // Create profile
    if (profile) {
      await Profile.create({
        UserId: newUser.id,

        category: profile.category,

        gender: profile.gender,

        age: profile.age
          ? parseInt(profile.age, 10)
          : null,

        state: profile.state,

        annualIncome: profile.annualIncome
          ? parseFloat(profile.annualIncome)
          : null,

        enterpriseType: profile.enterpriseType,

        turnover: profile.turnover
          ? parseFloat(profile.turnover)
          : null,

        isHandicapped:
          profile.isHandicapped === true
      }, {
        transaction
      });
    }

    await transaction.commit();


    // Send OTP after DB commit
    try {
      await sendOTPEmail(email, otp);
    } catch (mailError) {
      console.warn(
        'OTP email failed:',
        mailError.message
      );

      console.warn(
        'Development OTP:',
        otp
      );
    }


    return res.status(201).json({
      message:
        'Registration successful! Verification OTP sent to your email.',

      userId: newUser.id,

      email: newUser.email
    });

  } catch (error) {

    try {
      await transaction.rollback();
    } catch (_) {}

    console.error(
      'Registration Error:',
      error
    );

    return res.status(500).json({
      error: 'Server error during registration'
    });
  }
};


// =========================
// VERIFY OTP
// =========================
exports.verifyOTP = async (req, res) => {
  try {
    const {
      email,
      otp
    } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and OTP are required'
      });
    }

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: 'User is already verified'
      });
    }

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        error: 'OTP not available. Please register again.'
      });
    }

    const expired =
      new Date() > new Date(user.otpExpiresAt);

    if (user.otp !== otp || expired) {
      return res.status(400).json({
        error: 'Invalid or expired OTP code'
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();

    return res.status(200).json({
      message:
        'Email verified successfully! You can now log in.'
    });

  } catch (error) {

    console.error(
      'Verification Error:',
      error
    );

    return res.status(500).json({
      error:
        'Server error during OTP verification'
    });
  }
};


// =========================
// LOGIN USER
// =========================
exports.loginUser = async (req, res) => {
  try {

    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid email or password'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error:
          'Please verify your email via OTP before logging in.',

        needVerification: true
      });
    }

    // Current project uses plain password.
    // Replace with bcrypt before production.
    if (user.password !== password) {
      return res.status(400).json({
        error: 'Invalid email or password'
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return res.status(200).json({
      message: 'Login successful',

      user: req.session.user
    });

  } catch (error) {

    console.error(
      'Login Error:',
      error
    );

    return res.status(500).json({
      error:
        'Server error during authentication'
    });
  }
};
