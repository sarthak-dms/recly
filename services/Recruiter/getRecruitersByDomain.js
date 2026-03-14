const RecruiterDAO = require('../../dao/Recruiter');

async function getRecruitersByDomain(params) {
    const { domain } = params;
    const parsedLimit = Number.parseInt(params.limit, 10);
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;

    try {
        const recruiters = await RecruiterDAO.getRecruitersByDomain(domain, limit);

        return {
            domain: domain.toLowerCase(),
            limit,
            recruiters: recruiters.map((recruiter) => ({
                id: recruiter.id,
                name: recruiter.recname,
                email: recruiter.email,
                phone: recruiter.phone,
                designation: recruiter.designation,
                domain: recruiter.domain,
                companyId: recruiter.companyId,
                companyName: recruiter.companyName,
            })),
        };
    } catch (error) {
        console.error('Error in getRecruitersByDomain:', error);
        throw error;
    }
}

module.exports = getRecruitersByDomain;
