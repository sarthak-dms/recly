const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const { buildRecruiterSnapshot, SNAPSHOT_QUERY } = require('../scripts/buildRecruiterSnapshot');

test('snapshot builder writes chunk files, updates the manifest, and resumes from the configured range', async () => {
    const firstBatch = Array.from({ length: 250 }, (_, index) => ({
        id: 200000 + index,
        recname: `Recruiter ${200000 + index}`,
        email: `recruiter${200000 + index}@example.com`,
        phone: `${200000 + index}`,
        designation: 'Recruiter',
        domain: 'example.com',
        company_id: 5,
        organisation: 'Example Inc',
        status: 1,
    }));
    const secondBatch = [
        {
            id: 200250,
            recname: 'Recruiter 200250',
            email: 'recruiter200250@example.com',
            phone: '200250',
            designation: 'Recruiter',
            domain: 'example.com',
            company_id: 5,
            organisation: 'Example Inc',
            status: 1,
        },
        {
            id: 200251,
            recname: 'Recruiter 200251',
            email: 'recruiter200251@example.com',
            phone: '200251',
            designation: 'Recruiter',
            domain: 'example.com',
            company_id: 5,
            organisation: 'Example Inc',
            status: 1,
        },
        {
            id: 200252,
            recname: 'Recruiter 200252',
            email: 'recruiter200252@example.com',
            phone: '200252',
            designation: 'Recruiter',
            domain: 'example.com',
            company_id: 5,
            organisation: 'Example Inc',
            status: 1,
        },
    ];
    const queryCalls = [];
    const sleepCalls = [];
    const logLines = [];
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'recly-snapshot-test-'));
    const snapshotPath = path.join(tempDirectory, 'recruiter-profile.snapshot');

    const result = await buildRecruiterSnapshot({
        snapshotPath,
        startId: 200000,
        endId: null,
        maxRows: 253,
        pool: {
            async query(query, params) {
                queryCalls.push({ query, params });

                if (params[0] === 199999) {
                    return [firstBatch];
                }

                if (params[0] === 200249) {
                    return [secondBatch];
                }

                return [[]];
            },
        },
        sleepFn(ms) {
            sleepCalls.push(ms);
            return Promise.resolve();
        },
        logger: {
            info(message) {
                logLines.push(message);
            },
        },
        nowFn: (() => {
            const timestamps = [
                new Date('2026-03-15T00:00:00.000Z'),
                new Date('2026-03-15T00:00:01.000Z'),
            ];
            let index = 0;
            return () => timestamps[Math.min(index++, timestamps.length - 1)];
        })(),
    });

    const chunkPath = path.join(snapshotPath, 'chunk-200000-200252.json');
    const manifestPath = path.join(snapshotPath, 'manifest.json');
    const writtenChunk = JSON.parse(await fs.readFile(chunkPath, 'utf8'));
    const writtenManifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const tempChunkPath = `${chunkPath}.tmp`;
    const tempManifestPath = `${manifestPath}.tmp`;

    assert.deepStrictEqual(queryCalls, [
        {
            query: SNAPSHOT_QUERY,
            params: [199999, null, null, 250],
        },
        {
            query: SNAPSHOT_QUERY,
            params: [200249, null, null, 3],
        },
    ]);
    assert.deepStrictEqual(sleepCalls, [2000]);
    assert.equal(result.chunk.rowCount, 253);
    assert.equal(result.chunk.startId, 200000);
    assert.equal(result.chunk.endId, 200252);
    assert.equal(result.manifest.nextStartId, 200253);
    assert.equal(writtenChunk.rowCount, 253);
    assert.equal(writtenChunk.startId, 200000);
    assert.equal(writtenChunk.endId, 200252);
    assert.equal(writtenChunk.generatedAt, '2026-03-15T00:00:01.000Z');
    assert.equal(writtenChunk.rows[252].id, 200252);
    assert.equal(writtenManifest.chunkCount, 1);
    assert.equal(writtenManifest.rowCount, 253);
    assert.equal(writtenManifest.nextStartId, 200253);
    assert.equal(writtenManifest.chunks[0].fileName, 'chunk-200000-200252.json');
    assert.equal(await fs.access(tempChunkPath).then(() => true).catch(() => false), false);
    assert.equal(await fs.access(tempManifestPath).then(() => true).catch(() => false), false);
    assert.match(logLines[0], /Fetched recruiter snapshot batch 1/);
    assert.match(logLines[1], /Fetched recruiter snapshot batch 2/);
    assert.match(logLines[2], /Recruiter snapshot complete: 253 rows written/);
    assert.match(logLines[2], /range 200000 to 200252, next start 200253/);
});

test('snapshot builder resumes from the manifest nextStartId when startId is omitted', async () => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'recly-snapshot-resume-test-'));
    const snapshotPath = path.join(tempDirectory, 'recruiter-profile.snapshot');

    await fs.mkdir(snapshotPath, { recursive: true });
    await fs.writeFile(
        path.join(snapshotPath, 'manifest.json'),
        JSON.stringify({
            updatedAt: '2026-03-15T00:00:00.000Z',
            sourceTable: 'recruiter_profile',
            chunkCount: 1,
            rowCount: 25000,
            nextStartId: 225000,
            chunks: [],
        })
    );

    const queryCalls = [];

    const result = await buildRecruiterSnapshot({
        snapshotPath,
        endId: null,
        maxRows: 1,
        pool: {
            async query(query, params) {
                queryCalls.push({ query, params });
                return [[
                    {
                        id: 225000,
                        recname: 'Recruiter 225000',
                        email: 'recruiter225000@example.com',
                        phone: '225000',
                        designation: 'Recruiter',
                        domain: 'example.com',
                        company_id: 6,
                        organisation: 'Next Chunk Inc',
                        status: 1,
                    },
                ]];
            },
        },
    });

    assert.deepStrictEqual(queryCalls[0], {
        query: SNAPSHOT_QUERY,
        params: [224999, null, null, 1],
    });
    assert.equal(result.chunk.startId, 225000);
    assert.equal(result.manifest.nextStartId, 225001);
});

test('snapshot builder rejects an invalid id range', async () => {
    await assert.rejects(
        () =>
            buildRecruiterSnapshot({
                startId: 101000,
                endId: 100000,
                pool: {
                    async query() {
                        return [[]];
                    },
                },
            }),
        /Invalid recruiter snapshot range/
    );
});

test('snapshot builder rejects an invalid chunk row limit', async () => {
    await assert.rejects(
        () =>
            buildRecruiterSnapshot({
                maxRows: 0,
                endId: null,
                pool: {
                    async query() {
                        return [[]];
                    },
                },
            }),
        /Invalid recruiter snapshot row limit/
    );
});
