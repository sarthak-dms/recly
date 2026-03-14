const config = require('../../config/config');
const { createMySqlRecruiterProvider } = require('./providers/mysql');
const { createJsonSnapshotRecruiterProvider } = require('./providers/jsonSnapshot');

function createRecruiterDAO(options = {}) {
    const dataSource = options.dataSource || config.recruiter.dataSource;

    if (dataSource === 'mysql') {
        const createProvider = options.createMySqlRecruiterProvider || createMySqlRecruiterProvider;
        return createProvider(options);
    }

    if (dataSource === 'json') {
        const createProvider = options.createJsonSnapshotRecruiterProvider || createJsonSnapshotRecruiterProvider;
        return createProvider({
            ...options,
            snapshotPath: options.snapshotPath || config.recruiter.snapshotPath,
        });
    }

    throw new Error(`Unsupported recruiter data source: ${dataSource}`);
}

const recruiterDAO = createRecruiterDAO();

module.exports = {
    ...recruiterDAO,
    createRecruiterDAO,
};
