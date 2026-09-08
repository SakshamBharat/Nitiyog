const express = require('express');

const router = express.Router();

const applicationController =
  require('../controllers/applicationController');


// Submit application
router.post(
  '/apply',
  applicationController.submitApplication
);


module.exports = router;
