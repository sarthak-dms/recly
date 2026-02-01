const RecruiterDAO = require('../../dao/Recruiter');
async function getRecruiter(params) {
    const { recruiterid } = params;
    try {
        const rec = await RecruiterDAO.getById(recruiterid);
        const resp = {
            id: rec.id,
            name: rec.recname,
            email: rec.email,
            phone: rec.phone,
            designation: rec.designation,
            domain: rec.domain,
        }
        return resp;
    } catch (error) {
        console.error('Error in getRecruiter:', error);
        throw error;
    }
}

module.exports = getRecruiter;