const sequelize = require("../config/database");

const User = require("./User");
const Otp = require("./Otp");
const Scheme = require("./Scheme");
const SchemeCategory = require("./SchemeCategory");
const SchemeEligibility = require("./SchemeEligibility");
const Application = require("./Application");

/*
|--------------------------------------------------------------------------
| USER -> OTP
|--------------------------------------------------------------------------
*/

User.hasMany(Otp, {
  foreignKey: {
    name: "userId",
    allowNull: false
  },
  onDelete: "CASCADE"
});

Otp.belongsTo(User, {
  foreignKey: "userId"
});


/*
|--------------------------------------------------------------------------
| CATEGORY -> SCHEMES
|--------------------------------------------------------------------------
*/

SchemeCategory.hasMany(Scheme, {
  foreignKey: "categoryId",
  onDelete: "SET NULL"
});

Scheme.belongsTo(SchemeCategory, {
  foreignKey: "categoryId"
});


/*
|--------------------------------------------------------------------------
| SCHEME -> ELIGIBILITY RULES
|--------------------------------------------------------------------------
*/

Scheme.hasMany(SchemeEligibility, {
  foreignKey: "schemeId",
  onDelete: "CASCADE"
});

SchemeEligibility.belongsTo(Scheme, {
  foreignKey: "schemeId"
});


/*
|--------------------------------------------------------------------------
| USER -> APPLICATIONS
|--------------------------------------------------------------------------
*/

User.hasMany(Application, {
  foreignKey: "userId",
  onDelete: "CASCADE"
});

Application.belongsTo(User, {
  foreignKey: "userId"
});


/*
|--------------------------------------------------------------------------
| SCHEME -> APPLICATIONS
|--------------------------------------------------------------------------
*/

Scheme.hasMany(Application, {
  foreignKey: "schemeId",
  onDelete: "RESTRICT"
});

Application.belongsTo(Scheme, {
  foreignKey: "schemeId"
});


module.exports = {
  sequelize,
  User,
  Otp,
  Scheme,
  SchemeCategory,
  SchemeEligibility,
  Application
};