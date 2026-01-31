
async function getRecruiter(req, res) {

  const recruiterid = req.params.recruiterid;
  res.json({
    message: `${recruiterid}Hello from the Controller!`,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  getRecruiter
};