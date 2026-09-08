const express = require('express');

const router = express.Router();

const {
  Scheme,
  Profile
} = require('../models');

const {
  matchSchemesForUser
} = require('../services/matchingService');


// =========================
// GET ALL ACTIVE SCHEMES
// =========================
router.get('/', async (req, res) => {

  try {

    const schemes =
      await Scheme.findAll({
        where: {
          isActive: true
        },
        order: [
          ['createdAt', 'DESC']
        ]
      });

    res.json(schemes);

  } catch (error) {

    console.error(
      'Fetch Schemes Error:',
      error
    );

    res.status(500).json({
      error: 'Failed to fetch schemes'
    });
  }
});


// =========================
// GET MATCHED SCHEMES
// =========================
router.get('/matched', async (req, res) => {

  if (!req.session.user) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }


  try {

    const profile =
      await Profile.findOne({
        where: {
          UserId:
            req.session.user.id
        }
      });


    if (!profile) {
      return res.status(400).json({
        error:
          'Please complete your profile first'
      });
    }


    const allSchemes =
      await Scheme.findAll({
        where: {
          isActive: true
        }
      });


    const matchedResults =
      matchSchemesForUser(
        profile,
        allSchemes
      );


    res.json({
      totalMatched:
        matchedResults.length,

      schemes:
        matchedResults
    });

  } catch (error) {

    console.error(
      'Matching API Error:',
      error
    );

    res.status(500).json({
      error:
        'Failed to calculate matched schemes'
    });
  }
});


module.exports = router;
