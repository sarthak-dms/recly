const pool = require('./db/createconnection');
const recruiterDAO = require('./dao/Recruiter');

async function testConnection() {
    try {
        // Test direct pool query
        const [rows] = await pool.query('SELECT 1 as result');
        console.log('Database connection pool check successful:', rows[0].result === 1);

        // Test DAO
        const recruiter = await recruiterDAO.getById(1);
        if (recruiter) {
            console.log('DAO getById(1) check successful. Recruiter name:', recruiter.recname || recruiter.name);
        } else {
            console.log('DAO getById(1) successful: No recruiter found with ID 1');
        }

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testConnection();
