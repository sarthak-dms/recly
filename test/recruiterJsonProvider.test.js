const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const { createJsonSnapshotRecruiterProvider } = require('../dao/Recruiter/providers/jsonSnapshot');

const fixturePath = path.resolve(__dirname, 'fixtures/recruiterSnapshot.fixture.json');

test('json snapshot provider returns recruiter by id without status filtering', async () => {
    const provider = createJsonSnapshotRecruiterProvider({ snapshotPath: fixturePath });

    const recruiter = await provider.getById(3);

    assert.deepStrictEqual(recruiter, {
        id: 3,
        recname: 'Bob',
        email: 'bob@example.com',
        phone: '3333333333',
        designation: 'Analyst',
        domain: 'example.com',
        company_id: 10,
        organisation: 'Acme',
        status: 0,
    });
});

test('json snapshot provider preserves current company-search grouping and filtering rules', async () => {
    const provider = createJsonSnapshotRecruiterProvider({ snapshotPath: fixturePath });

    const companies = await provider.searchCompanies('com');

    assert.deepStrictEqual(companies, [
        {
            companyId: 10,
            companyName: 'Acme Corp',
            domain: 'example.com',
            recruiterCount: 2,
        },
        {
            companyId: 11,
            companyName: 'ZetaBeta',
            domain: 'beta.com',
            recruiterCount: 2,
        },
    ]);
});

test('json snapshot provider filters inactive recruiters from domain and company lookups', async () => {
    const provider = createJsonSnapshotRecruiterProvider({ snapshotPath: fixturePath });

    const recruitersByDomain = await provider.getRecruitersByDomain('EXAMPLE.com', 20);
    const recruitersByCompany = await provider.getRecruitersByCompanyId(10);
    const domainCount = await provider.getRecruitersByDomainCount('example.com');

    assert.deepStrictEqual(recruitersByDomain, [
        {
            id: 2,
            recname: 'Amy',
            email: 'amy@example.com',
            phone: '2222222222',
            designation: 'Manager',
            domain: 'example.com',
            companyId: 10,
            companyName: 'Acme Corp',
        },
        {
            id: 1,
            recname: 'Zed',
            email: 'zed@example.com',
            phone: '1111111111',
            designation: 'Lead',
            domain: 'example.com',
            companyId: 10,
            companyName: 'Acme',
        },
    ]);
    assert.deepStrictEqual(recruitersByCompany, [
        {
            id: 2,
            recname: 'Amy',
            email: 'amy@example.com',
            phone: '2222222222',
            designation: 'Manager',
            domain: 'example.com',
            companyId: 10,
            companyName: 'Acme Corp',
        },
        {
            id: 1,
            recname: 'Zed',
            email: 'zed@example.com',
            phone: '1111111111',
            designation: 'Lead',
            domain: 'example.com',
            companyId: 10,
            companyName: 'Acme',
        },
    ]);
    assert.equal(domainCount, 2);
});

test('json snapshot provider fails fast for a missing snapshot file', () => {
    assert.throws(
        () => createJsonSnapshotRecruiterProvider({ snapshotPath: path.resolve(__dirname, 'fixtures/missing.json') }),
        /Failed to load recruiter snapshot/
    );
});

test('json snapshot provider can read a chunk directory with a manifest', async () => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'recly-json-provider-test-'));
    const snapshotPath = path.join(tempDirectory, 'recruiter-profile.snapshot');

    await fs.mkdir(snapshotPath, { recursive: true });
    await fs.writeFile(
        path.join(snapshotPath, 'manifest.json'),
        JSON.stringify({
            updatedAt: '2026-03-15T00:00:01.000Z',
            sourceTable: 'recruiter_profile',
            chunkCount: 2,
            rowCount: 2,
            nextStartId: 200002,
            chunks: [
                {
                    fileName: 'chunk-200000-200000.json',
                    rowCount: 1,
                    startId: 200000,
                    endId: 200000,
                },
                {
                    fileName: 'chunk-200001-200001.json',
                    rowCount: 1,
                    startId: 200001,
                    endId: 200001,
                },
            ],
        })
    );
    await fs.writeFile(
        path.join(snapshotPath, 'chunk-200000-200000.json'),
        JSON.stringify({
            rows: [
                {
                    id: 200000,
                    recname: 'First Chunk Recruiter',
                    email: 'first@example.com',
                    phone: '1',
                    designation: 'Lead',
                    domain: 'chunk.com',
                    company_id: 20,
                    organisation: 'Chunk Co',
                    status: 1,
                },
            ],
        })
    );
    await fs.writeFile(
        path.join(snapshotPath, 'chunk-200001-200001.json'),
        JSON.stringify({
            rows: [
                {
                    id: 200001,
                    recname: 'Second Chunk Recruiter',
                    email: 'second@example.com',
                    phone: '2',
                    designation: 'Manager',
                    domain: 'chunk.com',
                    company_id: 20,
                    organisation: 'Chunk Co',
                    status: 1,
                },
            ],
        })
    );

    const provider = createJsonSnapshotRecruiterProvider({ snapshotPath });

    assert.equal(await provider.getRecruitersByDomainCount('chunk.com'), 2);
    assert.deepStrictEqual(await provider.getById(200001), {
        id: 200001,
        recname: 'Second Chunk Recruiter',
        email: 'second@example.com',
        phone: '2',
        designation: 'Manager',
        domain: 'chunk.com',
        company_id: 20,
        organisation: 'Chunk Co',
        status: 1,
    });
});
