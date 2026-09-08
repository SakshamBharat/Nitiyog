const { Scheme } = require('../models');

exports.createScheme = async (req, res) => {
  try {
    // Basic Admin Role Validation Check
    if (!req.session.user || req.session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }

    const {
      title,
      ministry,
      description,
      maxFunding,
      minAge,
      maxAge,
      maxIncome,
      maxTurnover,
      targetCategory,
      targetState,
      targetEnterpriseType
    } = req.body;

    const newScheme = await Scheme.create({
      title,
      ministry,
      description,
      maxFunding,
      minAge,
      maxAge,
      maxIncome,
      maxTurnover,
      targetCategory,
      targetState,
      targetEnterpriseType
    });

    res.status(201).json({
      message: 'Scheme created successfully',
      scheme: newScheme
    });
  } catch (error) {
    console.error('Create Scheme Error:', error);
    res.status(500).json({ error: 'Server error while creating scheme' });
  }
};