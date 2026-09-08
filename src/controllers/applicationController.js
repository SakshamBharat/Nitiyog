const {
  Application,
  Scheme
} = require('../models');


// =========================
// SUBMIT APPLICATION
// =========================
exports.submitApplication = async (req, res) => {

  try {

    if (!req.session.user) {
      return res.status(401).json({
        error: 'Please login first'
      });
    }


    const userId =
      req.session.user.id;

    const {
      schemeId
    } = req.body;


    if (!schemeId) {
      return res.status(400).json({
        error: 'Scheme ID is required'
      });
    }


    const scheme =
      await Scheme.findByPk(
        schemeId
      );


    if (!scheme) {
      return res.status(404).json({
        error: 'Scheme not found'
      });
    }


    const existingApp =
      await Application.findOne({
        where: {
          UserId: userId,
          SchemeId: schemeId
        }
      });


    if (existingApp) {
      return res.status(400).json({
        error:
          'Application already submitted for this scheme.'
      });
    }


    const application =
      await Application.create({

        UserId: userId,

        SchemeId: schemeId,

        status: 'SUBMITTED',

        prefilledDocPath:
          `/downloads/application_${userId}_${schemeId}.pdf`
      });


    return res.status(201).json({

      message:
        'Application submitted successfully',

      application
    });


  } catch (error) {

    console.error(
      'Application Error:',
      error
    );

    res.status(500).json({
      error:
        'Failed to process application'
    });
  }
};
