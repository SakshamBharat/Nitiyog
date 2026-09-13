const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const { Otp } = require("../models");
const { sendOtpEmail } = require("./brevo.service");

function generateOtp() {
  return crypto
    .randomInt(100000, 999999)
    .toString();
}

async function createAndSendOtp(user) {
  const otp = generateOtp();

  const otpHash = await bcrypt.hash(otp, 10);

  const expiryMinutes =
    Number(process.env.OTP_EXPIRY_MINUTES || 10);

  await Otp.update(
    {
      verifiedAt: new Date()
    },
    {
      where: {
        userId: user.id,
        verifiedAt: null
      }
    }
  );

  await Otp.create({
    userId: user.id,
    email: user.email,
    otpHash,
    expiresAt: new Date(
      Date.now() + expiryMinutes * 60 * 1000
    )
  });

  await sendOtpEmail({
    email: user.email,
    firstName: user.firstName,
    otp
  });
}

async function verifyOtp(user, enteredOtp) {
  const otpRecord = await Otp.findOne({
    where: {
      userId: user.id,
      email: user.email,
      verifiedAt: null
    },
    order: [["createdAt", "DESC"]]
  });

  if (!otpRecord) {
    return {
      success: false,
      error: "No active verification code found."
    };
  }

  if (new Date() > otpRecord.expiresAt) {
    return {
      success: false,
      error: "Verification code has expired."
    };
  }

  if (otpRecord.attempts >= 5) {
    return {
      success: false,
      error: "Too many incorrect attempts."
    };
  }

  const valid = await bcrypt.compare(
    enteredOtp,
    otpRecord.otpHash
  );

  if (!valid) {
    await otpRecord.increment("attempts");

    return {
      success: false,
      error: "Invalid verification code."
    };
  }

  otpRecord.verifiedAt = new Date();
  await otpRecord.save();

  user.isEmailVerified = true;
  await user.save();

  return {
    success: true
  };
}

module.exports = {
  createAndSendOtp,
  verifyOtp
};