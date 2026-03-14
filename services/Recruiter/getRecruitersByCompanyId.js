const RecruiterDAO = require('../../dao/Recruiter');

async function getRecruitersByCompanyId(params) {
    const { companyId } = params;

    try {
        const recruiters = await RecruiterDAO.getRecruitersByCompanyId(companyId);

        return {
            companyId: Number(companyId),
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
        console.error('Error in getRecruitersByCompanyId:', error);
        throw error;
    }
}

module.exports = getRecruitersByCompanyId;
