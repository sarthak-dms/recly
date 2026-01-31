const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Home route
router.get('/recruiter/:recruiterid', homeController.getRecruiter);

module.exports = router;
