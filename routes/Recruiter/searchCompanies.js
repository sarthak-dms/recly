const RecruiterService = require('../../services/Recruiter');

async function searchCompanies(req, res) {
  const search = req.params.search;

  try {
    const resp = await RecruiterService.searchCompanies({ search });

    res.json({
      resp,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
}

module.exports = searchCompanies;
