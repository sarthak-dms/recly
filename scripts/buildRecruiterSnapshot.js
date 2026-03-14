const fs = require('fs');
const path = require('path');

const pool = require('../db/createconnection');
const config = require('../config/config');

const DEFAULT_BATCH_SIZE = 250;
const DEFAULT_BATCH_DELAY_MS = 2000;
const MANIFEST_FILE_NAME = 'manifest.json';
const SNAPSHOT_QUERY = `SELECT
    rp.id,
    rp.recname,
    rp.email,
    rp.phone,
    rp.designation,
    rp.domain,
    rp.company_id,
    rp.organisation,
    rp.status
FROM recruiter_profile AS rp
WHERE rp.id > ?
    AND (? IS NULL OR rp.id <= ?)
ORDER BY rp.id ASC
LIMIT ?`;

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function readJsonFile(snapshotFs, filePath) {
    const raw = await snapshotFs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
}

async function loadManifest(snapshotFs, snapshotPath) {
    try {
        return await readJsonFile(snapshotFs, path.join(snapshotPath, MANIFEST_FILE_NAME));
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }

        throw error;
    }
}

async function writeJsonAtomically(snapshotFs, targetPath, payload) {
    const tempPath = `${targetPath}.tmp`;
    await snapshotFs.writeFile(tempPath, JSON.stringify(payload, null, 2));
    await snapshotFs.rename(tempPath, targetPath);
}

async function buildRecruiterSnapshot(options = {}) {
    const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
    const batchDelayMs = options.batchDelayMs || DEFAULT_BATCH_DELAY_MS;
    const snapshotPool = options.pool || pool;
    const snapshotFs = options.fs || fs.promises;
    const logger = options.logger || console;
    const sleepFn = options.sleepFn || sleep;
    const nowFn = options.nowFn || (() => new Date());
    const snapshotPath = options.snapshotPath || config.recruiter.snapshotPath;
    const manifest = await loadManifest(snapshotFs, snapshotPath);
    const startId = options.startId !== undefined
        ? options.startId
        : (manifest?.nextStartId ?? config.recruiter.snapshotStartId);
    const endId = options.endId !== undefined
        ? options.endId
        : config.recruiter.snapshotEndId;
    const maxRows = options.maxRows !== undefined
        ? options.maxRows
        : config.recruiter.snapshotChunkRowLimit;

    if (endId !== null && endId < startId) {
        throw new Error(`Invalid recruiter snapshot range: endId ${endId} is smaller than startId ${startId}`);
    }

    if (maxRows <= 0) {
        throw new Error(`Invalid recruiter snapshot row limit: ${maxRows}`);
    }

    const startedAt = nowFn();
    const rows = [];
    let lastId = startId - 1;
    let batchNumber = 0;

    while (rows.length < maxRows) {
        const limit = Math.min(batchSize, maxRows - rows.length);
        const [batchRows] = await snapshotPool.query(SNAPSHOT_QUERY, [lastId, endId, endId, limit]);
        batchNumber += 1;

        if (batchRows.length === 0) {
            break;
        }

        rows.push(...batchRows);
        lastId = batchRows[batchRows.length - 1].id;

        logger.info(`Fetched recruiter snapshot batch ${batchNumber}: ${batchRows.length} rows (last id ${lastId})`);

        if (batchRows.length < limit || rows.length >= maxRows || (endId !== null && lastId >= endId)) {
            break;
        }

        await sleepFn(batchDelayMs);
    }

    const generatedAt = nowFn().toISOString();
    const chunkEndId = rows[rows.length - 1]?.id ?? startId - 1;
    const chunkFileName = `chunk-${startId}-${chunkEndId}.json`;
    const chunkPayload = {
        generatedAt,
        sourceTable: 'recruiter_profile',
        rowCount: rows.length,
        startId,
        endId: chunkEndId,
        requestedEndId: endId,
        maxRows,
        rows,
    };
    const chunkEntries = manifest?.chunks ? [...manifest.chunks] : [];

    await snapshotFs.mkdir(snapshotPath, { recursive: true });

    if (rows.length > 0) {
        await writeJsonAtomically(snapshotFs, path.join(snapshotPath, chunkFileName), chunkPayload);
        chunkEntries.push({
            fileName: chunkFileName,
            generatedAt,
            rowCount: rows.length,
            startId,
            endId: chunkEndId,
        });
    }

    const manifestPayload = {
        updatedAt: generatedAt,
        sourceTable: 'recruiter_profile',
        chunkCount: chunkEntries.length,
        rowCount: chunkEntries.reduce((total, chunk) => total + chunk.rowCount, 0),
        nextStartId: rows.length > 0 ? chunkEndId + 1 : startId,
        chunks: chunkEntries,
    };
    await writeJsonAtomically(snapshotFs, path.join(snapshotPath, MANIFEST_FILE_NAME), manifestPayload);

    const elapsedMs = nowFn().getTime() - startedAt.getTime();
    logger.info(
        `Recruiter snapshot complete: ${rows.length} rows written to ${path.join(snapshotPath, chunkFileName)} in ${elapsedMs}ms (range ${startId} to ${chunkEndId}, next start ${manifestPayload.nextStartId})`
    );

    return {
        chunk: chunkPayload,
        manifest: manifestPayload,
    };
}

async function run() {
    try {
        await buildRecruiterSnapshot();
        await pool.end();
    } catch (error) {
        console.error(`Recruiter snapshot build failed: ${error.message}`);
        await pool.end();
        process.exitCode = 1;
    }
}

if (require.main === module) {
    run();
}

module.exports = {
    MANIFEST_FILE_NAME,
    SNAPSHOT_QUERY,
    buildRecruiterSnapshot,
    sleep,
};
