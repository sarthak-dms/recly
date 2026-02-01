const RecruiterDAO = require('../../dao/Recruiter');

async function getRecruiterByDomain(domain) {
    try {
        const recruiter = await RecruiterDAO.getByDomain(domain);
        return recruiter;
    } catch (error) {
        console.error('Error in RecruiterService.getRecruiterByDomain:', error);
        throw error;
    }
}

module.exports = getRecruiterByDomain;
