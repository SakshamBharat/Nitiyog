const express = require('express');

const router = express.Router();

const adminController =
  require('../controllers/adminController');


// =========================
// ADMIN AUTHORIZATION
// =========================
const verifyAdmin = (
  req,
  res,
  next
) => {

  if (
    req.session.user &&
    req.session.user.role === 'ADMIN'
  ) {
    return next();
  }

  return res.status(403).send(
    'Access Denied: You must be an Admin to view this page.'
  );
};


router.use(verifyAdmin);


// Dashboard
router.get(
  '/dashboard',
  adminController.getAdminDashboard
);


// Add scheme page
router.get(
  '/add-scheme',
  adminController.getAddSchemePage
);


// Create scheme
router.post(
  '/add-scheme',
  adminController.createScheme
);


// Delete scheme
router.get(
  '/delete-scheme/:id',
  adminController.deleteScheme
);


module.exports = router;
