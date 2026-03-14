const RecruiterDAO = require('../../dao/Recruiter');

async function getRecruitersByDomainCount(params) {
    const { domain } = params;

    try {
        const count = await RecruiterDAO.getRecruitersByDomainCount(domain);

        return {
            domain: domain.toLowerCase(),
            count,
        };
    } catch (error) {
        console.error('Error in getRecruitersByDomainCount:', error);
        throw error;
    }
}

module.exports = getRecruitersByDomainCount;
