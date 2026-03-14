const pool = require('../../../db/createconnection');

function createMySqlRecruiterProvider(options = {}) {
    const providerPool = options.pool || pool;

    return {
        async getById(id) {
            try {
                const [rows] = await providerPool.query(
                    'SELECT id, recname, email, phone, designation, domain FROM recruiter_profile as rp WHERE rp.id = ?',
                    [id]
                );
                return rows[0] || null;
            } catch (error) {
                console.error('Error in RecruiterDAO.getById:', error);
                throw error;
            }
        },

        async getAll(limit = 10) {
            try {
                const [rows] = await providerPool.query('SELECT * FROM recruiter_profile LIMIT ?', [limit]);
                return rows;
            } catch (error) {
                console.error('Error in RecruiterDAO.getAll:', error);
                throw error;
            }
        },

        async searchCompanies(search) {
            try {
                const wildcardSearch = `%${search}%`;
                const [rows] = await providerPool.query(
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
        },

        async getRecruitersByDomain(domain, limit) {
            try {
                const [rows] = await providerPool.query(
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
        },

        async getRecruitersByDomainCount(domain) {
            try {
                const [rows] = await providerPool.query(
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
        },

        async getRecruitersByCompanyId(companyId) {
            try {
                const [rows] = await providerPool.query(
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
        },
    };
}

module.exports = {
    createMySqlRecruiterProvider,
};
