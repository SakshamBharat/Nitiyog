const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    firstName: {
      type: DataTypes.STRING(80),
      allowNull: false
    },

    lastName: {
      type: DataTypes.STRING(80),
      allowNull: false
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },

    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    role: {
      type: DataTypes.ENUM("USER", "ADMIN"),
      allowNull: false,
      defaultValue: "USER"
    },

    category: {
      type: DataTypes.ENUM(
        "GENERAL",
        "OBC",
        "SC",
        "ST",
        "EWS",
        "MINORITY"
      ),
      allowNull: true
    },

    gender: {
      type: DataTypes.ENUM(
        "MALE",
        "FEMALE",
        "OTHER"
      ),
      allowNull: true
    },

    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    mobile: {
      type: DataTypes.STRING(10),
      allowNull: true
    },

    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    pincode: {
      type: DataTypes.STRING(6),
      allowNull: true
    },

    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },

    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true
  }
);

module.exports = User;