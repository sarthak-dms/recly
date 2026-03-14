require('dotenv').config();
const path = require('path');

const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    debug: process.env.DB_DEBUG === 'true',
  },
  recruiter: {
    dataSource: process.env.RECRUITER_DATA_SOURCE || 'mysql',
    snapshotPath: path.resolve(
      process.cwd(),
      process.env.RECRUITER_SNAPSHOT_PATH || './data/recruiter-profile.snapshot'
    ),
    snapshotStartId: parseInt(process.env.RECRUITER_SNAPSHOT_START_ID, 10) || 200000,
    snapshotEndId: parseInt(process.env.RECRUITER_SNAPSHOT_END_ID, 10) || 300000,
    snapshotChunkRowLimit: parseInt(process.env.RECRUITER_SNAPSHOT_CHUNK_ROW_LIMIT, 10) || 7500,
  },
  port: process.env.PORT || 3000,
};

module.exports = config;
