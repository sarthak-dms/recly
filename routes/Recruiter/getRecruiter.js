const RecruiterService = require('../../services/Recruiter');

async function getRecruiter(req, res) {
  const recruiterid = req.params.recruiterid;

  try {
    const resp = await RecruiterService.getRecruiter({ recruiterid });

    if (resp) {
      res.json({
        resp
      });
    } else {
      res.status(404).json({
        message: 'Recruiter not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
}

module.exports = getRecruiter;