const RecruiterService = require('../../services/Recruiter');

async function getRecruitersByDomainCount(req, res) {
  const domain = req.params.domain;

  try {
    const resp = await RecruiterService.getRecruitersByDomainCount({ domain });

    res.json({
      resp,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

module.exports = getRecruitersByDomainCount;
