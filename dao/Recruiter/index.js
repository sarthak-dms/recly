const pool = require('../../db/createconnection');

const getById = async (id) => {
    try {
        const [rows] = await pool.query('SELECT id, recname, email, phone FROM recruiter_profile  as rp WHERE rp.id = ?', [id]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error in RecruiterDAO.getById:', error);
        throw error;
    }
};

const getByDomain = async (domain, limit = 10) => {
    try {
        const [rows] = await pool.query('SELECT id, recname, email, phone, designation FROM recruiter_profile WHERE domain = ?  order by id desc LIMIT ?', [domain, limit]);
        return rows;
    } catch (error) {
        console.error('Error in RecruiterDAO.getByDomain:', error);
        throw error;
    }
};

module.exports = {
    getById,
    getByDomain
};
