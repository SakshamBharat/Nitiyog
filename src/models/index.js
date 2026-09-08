const { DataTypes } = require('sequelize');
const sequelize = require('../services/db');

// ==============================
// USER MODEL
// ==============================
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  role: {
    type: DataTypes.ENUM('USER', 'ADMIN'),
    defaultValue: 'USER',
  },

  otp: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  otpExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// ==============================
// PROFILE MODEL
// ==============================
const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  category: {
    type: DataTypes.ENUM(
      'GENERAL',
      'OBC',
      'SC',
      'ST',
      'MINORITY'
    ),
    allowNull: false,
  },

  gender: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  annualIncome: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  enterpriseType: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  turnover: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  isHandicapped: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// ==============================
// SCHEME MODEL
// ==============================
const Scheme = sequelize.define('Scheme', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  ministry: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  minAge: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  maxAge: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  maxIncome: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  maxTurnover: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  maxFunding: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  targetCategory: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['ALL'],
  },

  targetGender: {
    type: DataTypes.STRING,
    defaultValue: 'ALL',
  },

  targetState: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['ALL'],
  },

  targetEnterpriseType: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['ALL'],
  },

  eligibilityCriteria: {
    type: DataTypes.JSONB,
    allowNull: true,
  },

  requiredDocuments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },

  officialPortalUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  pdfSourceUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// ==============================
// APPLICATION MODEL
// ==============================
const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  status: {
    type: DataTypes.STRING,
    defaultValue: 'DRAFT',
  },

  prefilledDocPath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// ==============================
// RELATIONSHIPS
// ==============================

User.hasOne(Profile, {
  onDelete: 'CASCADE',
});

Profile.belongsTo(User);

User.hasMany(Application, {
  onDelete: 'CASCADE',
});

Application.belongsTo(User);

Scheme.hasMany(Application, {
  onDelete: 'CASCADE',
});

Application.belongsTo(Scheme);

// ==============================
// EXPORT
// ==============================

module.exports = {
  sequelize,
  User,
  Profile,
  Scheme,
  Application,
};
