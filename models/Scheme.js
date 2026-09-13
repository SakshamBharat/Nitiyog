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

    category: {
      type: DataTypes.STRING(100),
      defaultValue: "General"
    },

    applicationUrl: {
      type: DataTypes.TEXT
    },

    sourceUrl: {
      type: DataTypes.TEXT
    },

    pdfSourceUrl: {
      type: DataTypes.TEXT
    },

    sourceName: {
      type: DataTypes.STRING(255),
      defaultValue: "myScheme.gov.in"
    },

    eligibility: {
      type: DataTypes.JSONB,
      defaultValue: []
    },

    benefits: {
      type: DataTypes.JSONB,
      defaultValue: []
    },

    requiredDocuments: {
      type: DataTypes.JSONB,
      defaultValue: []
    },

    applicationProcess: {
      type: DataTypes.JSONB,
      defaultValue: []
    },

    deadline: {
      type: DataTypes.STRING(200)
    },

    currentStatus: {
      type: DataTypes.TEXT
    },

    searchableText: {
      type: DataTypes.TEXT
    },

    extractedKeywords: {
      type: DataTypes.JSONB,
      defaultValue: []
    },

    aiDefinition: {
      type: DataTypes.TEXT
    },

    aiKeywords: {
      type: DataTypes.JSONB,
      defaultValue: []
    },

    lastSyncedAt: {
      type: DataTypes.DATE
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