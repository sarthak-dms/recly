const RecruiterService = require('../../services/Recruiter');

async function getRecruitersByDomain(req, res) {
  const domain = req.params.domain;
  const { limit } = req.query;

  try {
    const resp = await RecruiterService.getRecruitersByDomain({ domain, limit });

    if (resp.recruiters.length > 0) {
      res.json({
        resp,
      });
    } else {
      res.status(404).json({
        message: 'No recruiters found for the provided domain',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

module.exports = getRecruitersByDomain;
