const {
  User,
  Scheme,
  Application
} = require('../models');


// =========================
// ADMIN DASHBOARD
// =========================
exports.getAdminDashboard = async (req, res) => {
  try {

    const totalUsers = await User.count({
      where: {
        role: 'USER'
      }
    });

    const totalSchemes = await Scheme.count({
      where: {
        isActive: true
      }
    });

    const totalApplications =
      await Application.count();

    const schemes = await Scheme.findAll({
      where: {
        isActive: true
      },
      order: [
        ['createdAt', 'DESC']
      ]
    });

    res.render('admin-dashboard', {
      totalUsers,
      totalSchemes,
      totalApplications,
      schemes
    });

  } catch (error) {

    console.error(
      'Admin Dashboard Error:',
      error
    );

    res.status(500).send(
      'Server Error Loading Admin Dashboard'
    );
  }
};


// =========================
// ADD SCHEME PAGE
// =========================
exports.getAddSchemePage = (req, res) => {
  res.render('admin-add-scheme');
};


// =========================
// CREATE SCHEME
// =========================
exports.createScheme = async (req, res) => {
  try {

    const {
      title,
      ministry,
      description,
      minAge,
      maxAge,
      maxIncome,
      maxTurnover,
      maxFunding,
      targetCategory,
      targetGender,
      targetState,
      targetEnterpriseType
    } = req.body;


    if (!title || !ministry || !description) {
      return res.status(400).send(
        'Title, ministry and description are required'
      );
    }


    const categories =
      Array.isArray(targetCategory)
        ? targetCategory
        : targetCategory
          ? [targetCategory]
          : ['ALL'];


    const states =
      Array.isArray(targetState)
        ? targetState
        : targetState
          ? [targetState]
          : ['ALL'];


    const enterpriseTypes =
      Array.isArray(targetEnterpriseType)
        ? targetEnterpriseType
        : targetEnterpriseType
          ? [targetEnterpriseType]
          : ['ALL'];


    const scheme = await Scheme.create({

      title,

      ministry,

      description,

      minAge: minAge
        ? parseInt(minAge, 10)
        : null,

      maxAge: maxAge
        ? parseInt(maxAge, 10)
        : null,

      maxIncome: maxIncome
        ? parseFloat(maxIncome)
        : null,

      maxTurnover: maxTurnover
        ? parseFloat(maxTurnover)
        : null,

      maxFunding: maxFunding
        ? parseFloat(maxFunding)
        : null,

      targetCategory: categories,

      targetGender:
        targetGender || 'ALL',

      targetState: states,

      targetEnterpriseType:
        enterpriseTypes,

      isActive: true
    });


    console.log(
      'Scheme created:',
      scheme.id
    );

    res.redirect('/admin/dashboard');

  } catch (error) {

    console.error(
      'Create Scheme Error:',
      error
    );

    res.status(500).send(
      'Error creating new scheme'
    );
  }
};


// =========================
// DELETE SCHEME
// =========================
exports.deleteScheme = async (req, res) => {
  try {

    const {
      id
    } = req.params;

    await Scheme.destroy({
      where: { id }
    });

    res.redirect('/admin/dashboard');

  } catch (error) {

    console.error(
      'Delete Scheme Error:',
      error
    );

    res.status(500).send(
      'Error deleting scheme'
    );
  }
};
