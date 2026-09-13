const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SchemeCategory = sequelize.define(
  "SchemeCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },

    description: {
      type: DataTypes.TEXT
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: "scheme_categories",
    timestamps: true,
    underscored: true
  }
);

module.exports = SchemeCategory;