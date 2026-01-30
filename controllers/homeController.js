/**
 * Home Controller
 * Handles requests for the root endpoint.
 */
exports.getHome = (req, res) => {
  res.json({
    message: "Hello from the Controller!",
    timestamp: new Date().toISOString()
  });
};
