const fs = require('fs');
const path = require('path');

function normalizeDomain(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function compareAscending(left, right) {
    return String(left ?? '').localeCompare(String(right ?? ''));
}

function compareRecruiterNames(left, right) {
    return compareAscending(left.recname, right.recname);
}

function isNonEmptyText(value) {
    return typeof value === 'string' && value.trim() !== '';
}

function buildCompanyRecord(record, grouped) {
    const candidateName = record.organisation;
    const candidateDomain = normalizeDomain(record.domain);

    if (compareAscending(candidateName, grouped.companyName) > 0) {
        grouped.companyName = candidateName;
    }

    if (!grouped.domain || compareAscending(candidateDomain, grouped.domain) < 0) {
        grouped.domain = candidateDomain;
    }

    grouped.recruiterCount += 1;
}

function buildIndexes(rows) {
    const byId = new Map();
    const byCompanyId = new Map();
    const byDomain = new Map();
    const companies = new Map();

    for (const row of rows) {
        byId.set(String(row.id), row);

        if (row.status !== 1) {
            continue;
        }

        const normalizedDomain = normalizeDomain(row.domain);
        if (normalizedDomain) {
            const domainRows = byDomain.get(normalizedDomain) || [];
            domainRows.push(row);
            byDomain.set(normalizedDomain, domainRows);
        }

        if (row.company_id !== null && row.company_id !== undefined) {
            const companyKey = String(row.company_id);
            const companyRows = byCompanyId.get(companyKey) || [];
            companyRows.push(row);
            byCompanyId.set(companyKey, companyRows);
        }

        if (
            row.company_id === null ||
            row.company_id === undefined ||
            !normalizedDomain ||
            !isNonEmptyText(row.organisation)
        ) {
            continue;
        }

        const companyKey = String(row.company_id);
        const grouped = companies.get(companyKey) || {
            companyId: row.company_id,
            companyName: row.organisation,
            domain: normalizedDomain,
            recruiterCount: 0,
        };

        buildCompanyRecord(row, grouped);
        companies.set(companyKey, grouped);
    }

    for (const rowsForDomain of byDomain.values()) {
        rowsForDomain.sort(compareRecruiterNames);
    }

    for (const rowsForCompany of byCompanyId.values()) {
        rowsForCompany.sort(compareRecruiterNames);
    }

    const companySearchRows = Array.from(companies.values()).sort((left, right) => {
        const byName = compareAscending(left.companyName, right.companyName);
        if (byName !== 0) {
            return byName;
        }

        return compareAscending(left.domain, right.domain);
    });

    return {
        byId,
        byCompanyId,
        byDomain,
        companySearchRows,
    };
}

function parseSnapshotPayload(parsedSnapshot, snapshotPath) {
    if (!parsedSnapshot || !Array.isArray(parsedSnapshot.rows)) {
        throw new Error(`Recruiter snapshot at ${snapshotPath} is invalid: expected a JSON object with a rows array`);
    }

    return parsedSnapshot.rows;
}

function loadSnapshotFile(snapshotFs, snapshotPath) {
    const rawSnapshot = snapshotFs.readFileSync(snapshotPath, 'utf8');
    return parseSnapshotPayload(JSON.parse(rawSnapshot), snapshotPath);
}

function loadSnapshotDirectory(snapshotFs, snapshotPath) {
    const manifestPath = path.join(snapshotPath, 'manifest.json');
    let chunkFileNames = [];

    if (snapshotFs.existsSync(manifestPath)) {
        const manifest = JSON.parse(snapshotFs.readFileSync(manifestPath, 'utf8'));
        chunkFileNames = Array.isArray(manifest.chunks) ? manifest.chunks.map((chunk) => chunk.fileName) : [];
    } else {
        chunkFileNames = snapshotFs
            .readdirSync(snapshotPath)
            .filter((fileName) => fileName.endsWith('.json') && fileName !== 'manifest.json')
            .sort();
    }

    const rowsById = new Map();

    for (const fileName of chunkFileNames) {
        const chunkRows = loadSnapshotFile(snapshotFs, path.join(snapshotPath, fileName));

        for (const row of chunkRows) {
            rowsById.set(String(row.id), row);
        }
    }

    return Array.from(rowsById.values()).sort((left, right) => left.id - right.id);
}

function loadSnapshot(options = {}) {
    const snapshotFs = options.fs || fs;
    let snapshotStats;

    try {
        snapshotStats = snapshotFs.statSync(options.snapshotPath);
    } catch (error) {
        throw new Error(`Failed to load recruiter snapshot from ${options.snapshotPath}: ${error.message}`);
    }

    if (snapshotStats.isDirectory()) {
        return loadSnapshotDirectory(snapshotFs, options.snapshotPath);
    }

    return loadSnapshotFile(snapshotFs, options.snapshotPath);
}

function createJsonSnapshotRecruiterProvider(options = {}) {
    const rows = loadSnapshot(options);
    const indexes = buildIndexes(rows);

    return {
        async getById(id) {
            return indexes.byId.get(String(id)) || null;
        },

        async getAll(limit = 10) {
            return rows.slice(0, limit);
        },

        async searchCompanies(search) {
            const normalizedSearch = normalizeDomain(search);

            return indexes.companySearchRows
                .filter((company) => company.domain.includes(normalizedSearch))
                .slice(0, 20);
        },

        async getRecruitersByDomain(domain, limit) {
            const normalizedDomain = normalizeDomain(domain);
            const domainRows = indexes.byDomain.get(normalizedDomain) || [];

            return domainRows.slice(0, limit).map((row) => ({
                id: row.id,
                recname: row.recname,
                email: row.email,
                phone: row.phone,
                designation: row.designation,
                domain: normalizedDomain,
                companyId: row.company_id,
                companyName: row.organisation,
            }));
        },

        async getRecruitersByDomainCount(domain) {
            const normalizedDomain = normalizeDomain(domain);
            return (indexes.byDomain.get(normalizedDomain) || []).length;
        },

        async getRecruitersByCompanyId(companyId) {
            const companyRows = indexes.byCompanyId.get(String(companyId)) || [];

            return companyRows.slice(0, 20).map((row) => ({
                id: row.id,
                recname: row.recname,
                email: row.email,
                phone: row.phone,
                designation: row.designation,
                domain: normalizeDomain(row.domain),
                companyId: row.company_id,
                companyName: row.organisation,
            }));
        },
    };
}

module.exports = {
    createJsonSnapshotRecruiterProvider,
    normalizeDomain,
};
