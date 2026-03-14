const express = require('express');
const router = express.Router();

const RecruiterController = require('./Recruiter');

router.get('/healthz', (req, res) => {
  res.json({
    ok: true,
  });
});

router.get('/recruiter/company/search/:search', RecruiterController.searchCompanies);
router.get('/recruiter/company/:companyId/recruiters', RecruiterController.getRecruitersByCompanyId);
router.get('/recruiter/domain/:domain/count', RecruiterController.getRecruitersByDomainCount);
router.get('/recruiter/domain/:domain', RecruiterController.getRecruitersByDomain);
router.get('/recruiter/:recruiterid', RecruiterController.getRecruiter);

module.exports = router;
