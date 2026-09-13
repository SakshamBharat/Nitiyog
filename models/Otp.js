const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Otp = sequelize.define(
  "Otp",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    otpHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },

    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "otps",
    timestamps: true,
    underscored: true
  }
);

module.exports = Otp;