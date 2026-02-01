const pool = require('../../db/createconnection');

/**
 * Fetch a recruiter by ID
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const getById = async (id) => {
    try {
        const [rows] = await pool.query('SELECT id, recname, email, phone FROM recruiter_profile WHERE id = ?', [id]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error in RecruiterDAO.getById:', error);
        throw error;
    }
};

/**
 * Fetch all recruiters (with optional limit)
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
const getAll = async (limit = 10) => {
    try {
        const [rows] = await pool.query('SELECT * FROM recruiter_profile LIMIT ?', [limit]);
        return rows;
    } catch (error) {
        console.error('Error in RecruiterDAO.getAll:', error);
        throw error;
    }
};

module.exports = {
    getById,
    getAll,
};
