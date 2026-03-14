const RecruiterDAO = require('../../dao/Recruiter');

async function searchCompanies(params) {
    const { search } = params;

    try {
        const companies = await RecruiterDAO.searchCompanies(search);

        return {
            search,
            companies: companies.map((company) => ({
                companyId: company.companyId,
                companyName: company.companyName,
                domain: company.domain,
                recruiterCount: company.recruiterCount,
            })),
        };
    } catch (error) {
        console.error('Error in searchCompanies:', error);
        throw error;
    }
}

module.exports = searchCompanies;
