// /**
//  * Home Controller
//  * Handles requests for the root endpoint.
//  */
// exports.getHome = (req, res) => {
//   res.json({
//     message: "Hello from the Controller!",
//     timestamp: new Date().toISOString()
//   });
// };


async function getHome(req, res) {

  const number = req.params.id;
  res.json({
    message: `${number}Hello from the Controller!`,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  getHome
};