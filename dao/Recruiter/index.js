const pool = require('../../db/createconnection');

/**
 * Fetch a recruiter by ID
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const getById = async (id) => {
    try {
        const [rows] = await pool.query('SELECT id, recname, email, phone, designation, domain FROM recruiter_profile  as rp WHERE rp.id = ?', [id]);
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

/**
 * Search distinct companies for autocomplete
 * @param {string} search
 * @returns {Promise<Array>}
 */
const searchCompanies = async (search) => {
    try {
        const wildcardSearch = `%${search}%`;
        const [rows] = await pool.query(
            `SELECT
                rp.company_id AS companyId,
                MAX(rp.organisation) AS companyName,
                MIN(LOWER(rp.domain)) AS domain,
                COUNT(DISTINCT rp.id) AS recruiterCount
            FROM recruiter_profile AS rp
            WHERE LOWER(rp.domain) LIKE LOWER(?)
                AND rp.status = 1
                AND rp.company_id IS NOT NULL
                AND rp.domain IS NOT NULL
                AND TRIM(rp.domain) <> ''
                AND rp.organisation IS NOT NULL
                AND TRIM(rp.organisation) <> ''
            GROUP BY rp.company_id
            ORDER BY companyName ASC, domain ASC
            LIMIT 20`,
            [wildcardSearch]
        );

        return rows;
    } catch (error) {
        console.error('Error in RecruiterDAO.searchCompanies:', error);
        throw error;
    }
};

/**
 * Fetch recruiters for a domain
 * @param {string} domain
 * @param {number} limit
 * @returns {Promise<Array>}
 */
const getRecruitersByDomain = async (domain, limit) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                rp.id,
                rp.recname,
                rp.email,
                rp.phone,
                rp.designation,
                LOWER(rp.domain) AS domain,
                rp.company_id AS companyId,
                rp.organisation AS companyName
            FROM recruiter_profile AS rp
            WHERE LOWER(rp.domain) = LOWER(?)
                AND rp.status = 1
            ORDER BY rp.recname ASC
            LIMIT ?`,
            [domain, limit]
        );

        return rows;
    } catch (error) {
        console.error('Error in RecruiterDAO.getRecruitersByDomain:', error);
        throw error;
    }
};

/**
 * Fetch recruiter count for a domain
 * @param {string} domain
 * @returns {Promise<number>}
 */
const getRecruitersByDomainCount = async (domain) => {
    try {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count
            FROM recruiter_profile AS rp
            WHERE LOWER(rp.domain) = LOWER(?)
                AND rp.status = 1`,
            [domain]
        );

        return rows[0]?.count || 0;
    } catch (error) {
        console.error('Error in RecruiterDAO.getRecruitersByDomainCount:', error);
        throw error;
    }
};

/**
 * Fetch recruiters for a company
 * @param {number|string} companyId
 * @returns {Promise<Array>}
 */
const getRecruitersByCompanyId = async (companyId) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                rp.id,
                rp.recname,
                rp.email,
                rp.phone,
                rp.designation,
                LOWER(rp.domain) AS domain,
                rp.company_id AS companyId,
                rp.organisation AS companyName
            FROM recruiter_profile AS rp
            WHERE rp.company_id = ?
                AND rp.status = 1
            ORDER BY rp.recname ASC 
            LIMIT 20`,
            [companyId]
        );

        return rows;
    } catch (error) {
        console.error('Error in RecruiterDAO.getRecruitersByCompanyId:', error);
        throw error;
    }
};

module.exports = {
    getById,
    getAll,
    searchCompanies,
    getRecruitersByDomain,
    getRecruitersByDomainCount,
    getRecruitersByCompanyId,
};
