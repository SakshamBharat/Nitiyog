const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Application = sequelize.define(
  "Application",
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

    schemeId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    applicationNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },

    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "COMPLETED"
      ),
      defaultValue: "DRAFT"
    },

    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "applications",
    timestamps: true,
    underscored: true
  }
);

module.exports = Application;