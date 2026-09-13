require("dotenv").config();

const bcrypt = require("bcryptjs");

const {
  sequelize,
  User
} = require("../models");

async function ensureAdminSeeded() {
  try {
    await sequelize.authenticate();

    const email =
      process.env.ADMIN_EMAIL ||
      "admin@gov.in";

    const password =
      process.env.ADMIN_PASSWORD ||
      "admin@gov";

    const existing =
      await User.findOne({
        where: {
          email
        }
      });

    if (existing) {
      const matchesCurrentPassword =
        await bcrypt.compare(
          password,
          existing.passwordHash
        );

      if (
        !matchesCurrentPassword ||
        existing.role !== "ADMIN" ||
        !existing.isActive ||
        !existing.isEmailVerified
      ) {
        const passwordHash =
          await bcrypt.hash(password, 12);

        existing.passwordHash = passwordHash;
        existing.role = "ADMIN";
        existing.isActive = true;
        existing.isEmailVerified = true;
        existing.firstName = existing.firstName || "NitiYog";
        existing.lastName = existing.lastName || "Administrator";

        await existing.save();

        console.log(
          `Admin ${email} was refreshed with the current environment credentials.`
        );
      } else {
        console.log(
          `Admin ${email} already exists.`
        );
      }

      return existing;
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const admin = await User.create({
      firstName: "NitiYog",
      lastName: "Administrator",
      email,
      passwordHash,
      role: "ADMIN",
      isEmailVerified: true,
      isActive: true
    });

    console.log(
      "Admin account created successfully."
    );

    console.log(`Email: ${email}`);
    console.log(
      "Password: value from ADMIN_PASSWORD"
    );

    return admin;

  } catch (error) {
    console.error(error);
    throw error;
  }
}

if (require.main === module) {
  ensureAdminSeeded()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  ensureAdminSeeded
};

