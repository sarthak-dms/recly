const RecruiterService = require('../../services/Recruiter');

async function getRecruiterByDomain(req, res) {
    try {
        const { domain } = req.params;
        const recruiter = await RecruiterService.getRecruiterByDomain(domain);
        res.json({
            recruiter
        });
    } catch (error) {
        console.error('Error in RecruiterController.getRecruiterByDomain:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = getRecruiterByDomain;