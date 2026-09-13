const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Scheme = sequelize.define(
  "Scheme",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },

    shortDescription: {
      type: DataTypes.TEXT
    },

    description: {
      type: DataTypes.TEXT
    },

    department: {
      type: DataTypes.STRING(255)
    },

    ministry: {
      type: DataTypes.STRING(255)
    },

    state: {
      type: DataTypes.STRING(100)
    },

    applicationUrl: {
      type: DataTypes.TEXT
    },

    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "PUBLISHED",
        "ARCHIVED"
      ),
      defaultValue: "DRAFT"
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    categoryId: {
  type: DataTypes.UUID,
  allowNull: true
},
  },
  
  {
    tableName: "schemes",
    timestamps: true,
    underscored: true
  }
);

module.exports = Scheme;