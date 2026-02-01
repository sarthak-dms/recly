const express = require('express');
const router = express.Router();
const RecruiterController = require('../controllers/Recruiter');

// Home route
router.get('/recruiter/:recruiterid', RecruiterController.getRecruiter);
router.get('/recruiter/domain/:domain', RecruiterController.getRecruiterByDomain);
module.exports = router;
