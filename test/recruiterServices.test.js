const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { createJsonSnapshotRecruiterProvider } = require('../dao/Recruiter/providers/jsonSnapshot');

const daoPath = path.resolve(__dirname, '../dao/Recruiter/index.js');
const fixturePath = path.resolve(__dirname, 'fixtures/recruiterSnapshot.fixture.json');

function loadService(serviceRelativePath, dao) {
    const servicePath = path.resolve(__dirname, '..', serviceRelativePath);
    const originalDaoCache = require.cache[daoPath];
    const originalServiceCache = require.cache[servicePath];

    require.cache[daoPath] = {
        id: daoPath,
        filename: daoPath,
        loaded: true,
        exports: dao,
    };
    delete require.cache[servicePath];

    const service = require(servicePath);

    delete require.cache[servicePath];
    if (originalServiceCache) {
        require.cache[servicePath] = originalServiceCache;
    }

    delete require.cache[daoPath];
    if (originalDaoCache) {
        require.cache[daoPath] = originalDaoCache;
    }

    return service;
}

test('recruiter services keep the current response shape with the snapshot-backed provider', async () => {
    const provider = createJsonSnapshotRecruiterProvider({ snapshotPath: fixturePath });

    const getRecruiter = loadService('services/Recruiter/getRecruiter.js', provider);
    const getRecruitersByDomain = loadService('services/Recruiter/getRecruitersByDomain.js', provider);
    const getRecruitersByDomainCount = loadService('services/Recruiter/getRecruitersByDomainCount.js', provider);
    const getRecruitersByCompanyId = loadService('services/Recruiter/getRecruitersByCompanyId.js', provider);
    const searchCompanies = loadService('services/Recruiter/searchCompanies.js', provider);

    assert.deepStrictEqual(await getRecruiter({ recruiterid: 1 }), {
        id: 1,
        name: 'Zed',
        email: 'zed@example.com',
        phone: '1111111111',
        designation: 'Lead',
        domain: 'Example.com',
    });
    assert.deepStrictEqual(await getRecruitersByDomain({ domain: 'example.com', limit: 20 }), {
        domain: 'example.com',
        limit: 20,
        recruiters: [
            {
                id: 2,
                name: 'Amy',
                email: 'amy@example.com',
                phone: '2222222222',
                designation: 'Manager',
                domain: 'example.com',
                companyId: 10,
                companyName: 'Acme Corp',
            },
            {
                id: 1,
                name: 'Zed',
                email: 'zed@example.com',
                phone: '1111111111',
                designation: 'Lead',
                domain: 'example.com',
                companyId: 10,
                companyName: 'Acme',
            },
        ],
    });
    assert.deepStrictEqual(await getRecruitersByDomainCount({ domain: 'example.com' }), {
        domain: 'example.com',
        count: 2,
    });
    assert.deepStrictEqual(await getRecruitersByCompanyId({ companyId: 10 }), {
        companyId: 10,
        recruiters: [
            {
                id: 2,
                name: 'Amy',
                email: 'amy@example.com',
                phone: '2222222222',
                designation: 'Manager',
                domain: 'example.com',
                companyId: 10,
                companyName: 'Acme Corp',
            },
            {
                id: 1,
                name: 'Zed',
                email: 'zed@example.com',
                phone: '1111111111',
                designation: 'Lead',
                domain: 'example.com',
                companyId: 10,
                companyName: 'Acme',
            },
        ],
    });
    assert.deepStrictEqual(await searchCompanies({ search: 'example' }), {
        search: 'example',
        companies: [
            {
                companyId: 10,
                companyName: 'Acme Corp',
                domain: 'example.com',
                recruiterCount: 2,
            },
        ],
    });
});
