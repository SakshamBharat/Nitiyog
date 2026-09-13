const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SchemeEligibility = sequelize.define(
  "SchemeEligibility",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    schemeId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    gender: {
      type: DataTypes.STRING(30),
      allowNull: true
    },

    minAge: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    maxAge: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    minIncome: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },

    maxIncome: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    }
  },
  {
    tableName: "scheme_eligibilities",
    timestamps: true,
    underscored: true
  }
);

module.exports = SchemeEligibility;