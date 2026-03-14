const test = require('node:test');
const assert = require('node:assert/strict');

const { createRecruiterDAO } = require('../dao/Recruiter');

test('dao factory selects the mysql provider when requested', async () => {
    const mysqlProvider = {
        getById: async (id) => ({ id }),
    };
    let mysqlFactoryCalls = 0;

    const dao = createRecruiterDAO({
        dataSource: 'mysql',
        createMySqlRecruiterProvider(options) {
            mysqlFactoryCalls += 1;
            assert.equal(options.dataSource, 'mysql');
            return mysqlProvider;
        },
    });

    assert.equal(mysqlFactoryCalls, 1);
    assert.deepStrictEqual(await dao.getById(42), { id: 42 });
});

test('dao factory selects the json snapshot provider and forwards the snapshot path', async () => {
    const jsonProvider = {
        getRecruitersByDomainCount: async () => 7,
    };
    let capturedSnapshotPath;

    const dao = createRecruiterDAO({
        dataSource: 'json',
        snapshotPath: '/tmp/recruiter-snapshot.json',
        createJsonSnapshotRecruiterProvider(options) {
            capturedSnapshotPath = options.snapshotPath;
            return jsonProvider;
        },
    });

    assert.equal(capturedSnapshotPath, '/tmp/recruiter-snapshot.json');
    assert.equal(await dao.getRecruitersByDomainCount('example.com'), 7);
});

test('dao factory rejects unsupported recruiter data sources', () => {
    assert.throws(
        () => createRecruiterDAO({ dataSource: 'csv' }),
        /Unsupported recruiter data source/
    );
});
