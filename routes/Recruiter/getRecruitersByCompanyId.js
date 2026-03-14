const RecruiterService = require('../../services/Recruiter');

async function getRecruitersByCompanyId(req, res) {
  const companyId = req.params.companyId;

  try {
    const resp = await RecruiterService.getRecruitersByCompanyId({ companyId });

    if (resp.recruiters.length > 0) {
      res.json({
        resp,
      });
    } else {
      res.status(404).json({
        message: 'No recruiters found for the provided company',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

module.exports = getRecruitersByCompanyId;
