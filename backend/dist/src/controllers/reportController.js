"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReports = getReports;
exports.getReportById = getReportById;
exports.createReport = createReport;
exports.uploadCsv = uploadCsv;
exports.sampleCsv = sampleCsv;
exports.sampleExcel = sampleExcel;
exports.importValidatedReports = importValidatedReports;
exports.getTerminologyAutocomplete = getTerminologyAutocomplete;
exports.getDrugsAutocomplete = getDrugsAutocomplete;
exports.assessCausalityLive = assessCausalityLive;
const prisma_1 = __importDefault(require("../utils/prisma"));
const intelligenceEngine_1 = require("../services/intelligenceEngine");
const signalDetectionService_1 = require("../services/signalDetectionService");
const csv_1 = require("../utils/csv");
const exceljs_1 = __importDefault(require("exceljs"));
/**
 * Retrieves all spontaneous reports with pagination and filter criteria.
 */
async function getReports(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, severity, seriousness, causality, drugId } = req.query;
        const where = {};
        if (drugId) {
            where.suspectedDrugId = drugId;
        }
        if (severity) {
            where.severity = severity;
        }
        if (seriousness) {
            where.seriousness = seriousness;
        }
        if (causality) {
            where.causalityAssessment = causality;
        }
        if (search) {
            const searchStr = search;
            where.OR = [
                { suspectedDrug: { genericName: { contains: searchStr } } },
                { suspectedDrug: { brandName: { contains: searchStr } } },
                { reactionTerminology: { ptName: { contains: searchStr } } },
                { reactionTerminology: { lltName: { contains: searchStr } } },
                { reporterName: { contains: searchStr } }
            ];
        }
        const [reports, total] = await Promise.all([
            prisma_1.default.aDRReport.findMany({
                where,
                skip,
                take: limit,
                orderBy: { reportDate: 'desc' },
                include: {
                    patient: true,
                    suspectedDrug: true,
                    reactionTerminology: true
                }
            }),
            prisma_1.default.aDRReport.count({ where })
        ]);
        return res.status(200).json({
            reports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('getReports error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Fetches a single ADR report by ID.
 */
async function getReportById(req, res) {
    try {
        const id = String(req.params.id);
        const report = await prisma_1.default.aDRReport.findUnique({
            where: { id },
            include: {
                patient: true,
                suspectedDrug: true,
                reactionTerminology: true,
                createdBy: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        return res.status(200).json(report);
    }
    catch (error) {
        console.error('getReportById error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Creates a single spontaneous ADR report.
 */
async function createReport(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { patientAge, patientAgeUnit, patientGender, patientWeight, patientHeight, patientMedicalHistory, patientComorbidities, drugName, // brand or generic
        reactionFreeText, severity, seriousness, outcome, reporterName, reporterType, followUp, notes, temporalRelationship, dechallengeResult, rechallengeResult, alternativeCauses } = req.body;
        if (!patientAge || !patientAgeUnit || !patientGender || !drugName || !reactionFreeText || !severity || !seriousness || !outcome || !reporterName || !reporterType || !followUp) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        // 1. Create Patient
        const patient = await prisma_1.default.patient.create({
            data: {
                age: parseFloat(patientAge),
                ageUnit: patientAgeUnit,
                gender: patientGender,
                weight: patientWeight ? parseFloat(patientWeight) : null,
                height: patientHeight ? parseFloat(patientHeight) : null,
                medicalHistory: patientMedicalHistory || null,
                comorbidities: patientComorbidities || null
            }
        });
        // 2. Resolve Drug
        let drug = await prisma_1.default.drug.findFirst({
            where: {
                OR: [
                    { genericName: { equals: drugName } },
                    { brandName: { equals: drugName } }
                ]
            }
        });
        if (!drug) {
            // Create new drug as fallback
            drug = await prisma_1.default.drug.create({
                data: {
                    brandName: drugName,
                    genericName: drugName,
                    atcCode: 'UNKNOWN',
                    manufacturer: 'Unknown'
                }
            });
        }
        // 3. Resolve Terminology (MedDRA PT matching)
        let term = await prisma_1.default.terminology.findFirst({
            where: {
                OR: [
                    { lltName: { equals: reactionFreeText } },
                    { ptName: { equals: reactionFreeText } },
                    { synonyms: { contains: reactionFreeText } }
                ]
            }
        });
        if (!term) {
            // Create standard term placeholder
            term = await prisma_1.default.terminology.create({
                data: {
                    lltName: reactionFreeText,
                    ptName: reactionFreeText,
                    socName: 'General disorders',
                    synonyms: reactionFreeText
                }
            });
        }
        // 4. Auto-Assess Causality using expert system
        const causalityEval = intelligenceEngine_1.IntelligenceEngine.assessCausality({
            temporalRelationship: temporalRelationship === undefined ? null : temporalRelationship,
            dechallengeResult: dechallengeResult || null,
            rechallengeResult: rechallengeResult || null,
            alternativeCauses: alternativeCauses || null,
            severity,
            seriousness
        });
        // 5. Create ADR Report
        const newReport = await prisma_1.default.aDRReport.create({
            data: {
                patientId: patient.id,
                suspectedDrugId: drug.id,
                reactionTerminologyId: term.id,
                reactionFreeText,
                severity,
                seriousness,
                outcome,
                reporterName,
                reporterType,
                followUp,
                notes: notes || null,
                temporalRelationship: temporalRelationship === undefined ? null : temporalRelationship,
                dechallengeResult: dechallengeResult || null,
                rechallengeResult: rechallengeResult || null,
                alternativeCauses: alternativeCauses || null,
                causalityAssessment: causalityEval.category,
                causalityConfidence: causalityEval.confidence,
                causalityReasoning: causalityEval.reasoning.join('\n'),
                createdById: userId
            },
            include: {
                patient: true,
                suspectedDrug: true,
                reactionTerminology: true
            }
        });
        // Create Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId,
                action: 'Create Report',
                resource: 'ADRReport',
                resourceId: newReport.id,
                details: `Created ADR Report for patient on drug ${drug.genericName} with reaction ${term.ptName}.`,
                ipAddress: req.ip
            }
        });
        // Trigger asynchronous signal sweep
        signalDetectionService_1.SignalDetectionService.runDetection(userId).catch(err => {
            console.error('Asynchronous signal sweep error:', err);
        });
        return res.status(201).json(newReport);
    }
    catch (error) {
        console.error('createReport error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Endpoint for CSV Upload (Validation and preview phase).
 */
async function uploadCsv(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Support both CSV and Excel (.xls/.xlsx) uploads
        const name = (req.file.originalname || '').toLowerCase();
        let rawRows = [];
        if (name.endsWith('.xls') || name.endsWith('.xlsx') || req.file.mimetype.includes('spreadsheet') || req.file.mimetype.includes('excel')) {
            const workbook = new exceljs_1.default.Workbook();
            await workbook.xlsx.load(req.file.buffer);
            const sheet = workbook.worksheets[0] || workbook.getWorksheet(1);
            if (!sheet)
                return res.status(400).json({ error: 'Excel file contains no worksheets' });
            // Read header
            const headers = [];
            const headerRow = sheet.getRow(1);
            headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const txt = cell.text || (cell.value ? String(cell.value) : '');
                headers[colNumber - 1] = txt ? String(txt).trim() : `Column${colNumber}`;
            });
            for (let r = 2; r <= sheet.rowCount; r++) {
                const row = sheet.getRow(r);
                if (!row || row.cellCount === 0)
                    continue;
                const obj = {};
                headers.forEach((h, idx) => {
                    const cell = row.getCell(idx + 1);
                    const value = cell && (cell.text ?? cell.value) ? String(cell.text ?? cell.value) : '';
                    obj[h] = value;
                });
                // skip empty rows
                if (Object.values(obj).some(v => v && v.toString().trim() !== ''))
                    rawRows.push(obj);
            }
        }
        else {
            const csvText = req.file.buffer.toString('utf-8');
            rawRows = (0, csv_1.parseCsv)(csvText);
        }
        if (rawRows.length === 0) {
            return res.status(400).json({ error: 'Uploaded CSV is empty' });
        }
        const validRows = [];
        const invalidRows = [];
        const terminologySuggestions = {};
        // Load terminology for fast local mapping suggestion
        const terminologyList = await prisma_1.default.terminology.findMany({
            select: { id: true, lltName: true, ptName: true, socName: true }
        });
        // Normalize header keys so Excel files with snake_case or different column names are accepted
        const normalizeKey = (k) => String(k || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/^_+|_+$/g, '');
        const getFirst = (obj, keys) => {
            for (const k of keys) {
                if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).toString().trim() !== '')
                    return String(obj[k]);
            }
            return '';
        };
        rawRows.forEach((row, index) => {
            const rowNum = index + 2; // Header is row 1
            const errors = [];
            // build normalized row map
            const norm = {};
            Object.keys(row).forEach((k) => { norm[normalizeKey(k)] = row[k]; });
            // Accept many header variants (spaces, snake_case, camelCase)
            const patientAgeStr = getFirst(norm, ['patient_age', 'age', 'patientage']);
            const ageUnit = getFirst(norm, ['age_unit', 'ageunit', 'patient_age_unit']);
            const gender = getFirst(norm, ['gender', 'sex', 'patient_gender']);
            const drugName = getFirst(norm, ['drug', 'drug_name', 'drugname', 'drug_brand', 'brand']);
            const reaction = getFirst(norm, ['reaction', 'reaction_term', 'reactionterm', 'reaction_pt', 'reaction_pt_name', 'pt', 'reaction_free_text']);
            const severity = getFirst(norm, ['severity']);
            const seriousness = getFirst(norm, ['seriousness']);
            const outcome = getFirst(norm, ['outcome']);
            const reporter = getFirst(norm, ['reporter', 'reporter_name', 'reportername']);
            const followUp = getFirst(norm, ['follow_up', 'followup', 'follow-up']);
            const notes = getFirst(norm, ['notes']);
            // Basic validations
            if (!patientAgeStr)
                errors.push('Missing "Patient Age"');
            else if (isNaN(parseFloat(patientAgeStr)) || parseFloat(patientAgeStr) < 0)
                errors.push('Invalid numeric "Patient Age"');
            if (!ageUnit || !['days', 'months', 'years'].includes(String(ageUnit).trim().toLowerCase())) {
                errors.push('Missing or invalid "Age Unit" (must be Days, Months, Years)');
            }
            if (!gender)
                errors.push('Missing "Gender"');
            if (!drugName)
                errors.push('Missing "Drug" name');
            if (!reaction)
                errors.push('Missing "Reaction"');
            const parsedSeverity = severity || 'Moderate';
            const parsedSeriousness = seriousness || 'Non-Serious';
            const parsedOutcome = outcome || 'Unknown';
            const parsedReporter = reporter || 'Unknown';
            const parsedFollowUp = followUp || 'No';
            const mappedTerm = reaction ? terminologyList.find((t) => t.lltName.toLowerCase() === reaction.toLowerCase().trim() ||
                t.ptName.toLowerCase() === reaction.toLowerCase().trim()) : null;
            if (errors.length > 0) {
                invalidRows.push({
                    rowNumber: rowNum,
                    errors,
                    data: row
                });
            }
            else {
                validRows.push({
                    rowNumber: rowNum,
                    patientAge: parseFloat(patientAgeStr),
                    patientAgeUnit: String(ageUnit).trim(),
                    patientGender: String(gender).trim(),
                    drugName: String(drugName).trim(),
                    reactionFreeText: String(reaction).trim(),
                    mappedPtName: mappedTerm ? mappedTerm.ptName : String(reaction).trim(),
                    mappedSocName: mappedTerm ? mappedTerm.socName : 'General disorders',
                    severity: String(parsedSeverity).trim(),
                    seriousness: String(parsedSeriousness).trim(),
                    outcome: String(parsedOutcome).trim(),
                    reporterName: String(parsedReporter).trim(),
                    followUp: String(parsedFollowUp).trim(),
                    notes: notes ? String(notes).trim() : '',
                    temporalRelationship: true,
                    dechallengeResult: 'not_done',
                    rechallengeResult: 'not_done',
                    alternativeCauses: ''
                });
            }
        });
        const duplicates = rawRows.length - (validRows.length + invalidRows.length);
        return res.status(200).json({
            totalCount: rawRows.length,
            validCount: validRows.length,
            invalidCount: invalidRows.length,
            validRows,
            invalidRows,
            // Backwards-compatible keys expected by frontend
            valid: validRows,
            invalid: invalidRows,
            duplicates: Math.max(0, duplicates)
        });
    }
    catch (error) {
        console.error('uploadCsv error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Public sample CSV download
 */
async function sampleCsv(req, res) {
    try {
        const headers = ['Patient Age', 'Age Unit', 'Gender', 'Drug', 'Reaction', 'Severity', 'Seriousness', 'Outcome', 'Reporter', 'Follow-up', 'Notes'];
        const rows = [
            ['45', 'Years', 'Female', 'Warfarin', 'GI haemorrhage', 'Severe', 'Serious', 'Hospitalized', 'Dr. A', 'Yes', 'Patient on multiple meds'],
            ['63', 'Years', 'Male', 'Metformin', 'Hypoglycemia', 'Moderate', 'Non-Serious', 'Recovered', 'Dr. B', 'No', 'No dechallenge']
        ];
        const csvLines = [headers.join(',')].concat(rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')));
        const csv = csvLines.join('\r\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="sample_adr_data.csv"');
        return res.status(200).send(csv);
    }
    catch (error) {
        console.error('sampleCsv error:', error);
        return res.status(500).json({ error: 'Failed generating sample CSV' });
    }
}
/**
 * Public sample Excel download generated on-the-fly
 */
async function sampleExcel(req, res) {
    try {
        const workbook = new exceljs_1.default.Workbook();
        const ws = workbook.addWorksheet('Sample ADRs');
        const headers = ['Patient Age', 'Age Unit', 'Gender', 'Drug', 'Reaction', 'Severity', 'Seriousness', 'Outcome', 'Reporter', 'Follow-up', 'Notes'];
        ws.addRow(headers);
        const rows = [
            ['45', 'Years', 'Female', 'Warfarin', 'GI haemorrhage', 'Severe', 'Serious', 'Hospitalized', 'Dr. A', 'Yes', 'Patient on multiple meds'],
            ['63', 'Years', 'Male', 'Metformin', 'Hypoglycemia', 'Moderate', 'Non-Serious', 'Recovered', 'Dr. B', 'No', 'No dechallenge']
        ];
        rows.forEach(r => ws.addRow(r));
        const buf = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sample_adr_data.xlsx"');
        return res.status(200).send(Buffer.from(buf));
    }
    catch (error) {
        console.error('sampleExcel error:', error);
        return res.status(500).json({ error: 'Failed generating sample Excel' });
    }
}
/**
 * Commits the validated, corrected and mapped CSV rows to the database.
 */
async function importValidatedReports(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Accept both { reports: [...] } and { rows: [...] } payloads from different clients
        const reports = req.body.reports ?? req.body.rows;
        if (!reports || !Array.isArray(reports)) {
            return res.status(400).json({ error: 'Invalid payload: reports array required' });
        }
        let importCount = 0;
        await prisma_1.default.$transaction(async (tx) => {
            for (const rep of reports) {
                // Find or create patient
                const patient = await tx.patient.create({
                    data: {
                        age: parseFloat(rep.patientAge),
                        ageUnit: rep.patientAgeUnit,
                        gender: rep.patientGender,
                        weight: rep.patientWeight ? parseFloat(rep.patientWeight) : null,
                        height: rep.patientHeight ? parseFloat(rep.patientHeight) : null,
                        medicalHistory: rep.patientMedicalHistory || null,
                        comorbidities: rep.patientComorbidities || null
                    }
                });
                // Find or create drug
                let drug = await tx.drug.findFirst({
                    where: {
                        OR: [
                            { genericName: { equals: rep.drugName } },
                            { brandName: { equals: rep.drugName } }
                        ]
                    }
                });
                if (!drug) {
                    drug = await tx.drug.create({
                        data: {
                            brandName: rep.drugName,
                            genericName: rep.drugName,
                            atcCode: 'UNKNOWN',
                            manufacturer: 'Unknown'
                        }
                    });
                }
                // Find or create terminology
                let term = await tx.terminology.findFirst({
                    where: {
                        OR: [
                            { lltName: { equals: rep.reactionFreeText } },
                            { ptName: { equals: rep.reactionFreeText } }
                        ]
                    }
                });
                if (!term) {
                    term = await tx.terminology.create({
                        data: {
                            lltName: rep.reactionFreeText,
                            ptName: rep.mappedPtName || rep.reactionFreeText,
                            socName: rep.mappedSocName || 'General disorders',
                            synonyms: rep.reactionFreeText
                        }
                    });
                }
                // Assess causality
                const causalityEval = intelligenceEngine_1.IntelligenceEngine.assessCausality({
                    temporalRelationship: rep.temporalRelationship === undefined ? null : rep.temporalRelationship,
                    dechallengeResult: rep.dechallengeResult || null,
                    rechallengeResult: rep.rechallengeResult || null,
                    alternativeCauses: rep.alternativeCauses || null,
                    severity: rep.severity,
                    seriousness: rep.seriousness
                });
                // Create Report
                await tx.aDRReport.create({
                    data: {
                        patientId: patient.id,
                        suspectedDrugId: drug.id,
                        reactionTerminologyId: term.id,
                        reactionFreeText: rep.reactionFreeText,
                        severity: rep.severity,
                        seriousness: rep.seriousness,
                        outcome: rep.outcome,
                        reporterName: rep.reporterName,
                        reporterType: rep.reporterType || 'Physician',
                        followUp: rep.followUp,
                        notes: rep.notes || null,
                        temporalRelationship: rep.temporalRelationship === undefined ? null : rep.temporalRelationship,
                        dechallengeResult: rep.dechallengeResult || null,
                        rechallengeResult: rep.rechallengeResult || null,
                        alternativeCauses: rep.alternativeCauses || null,
                        causalityAssessment: causalityEval.category,
                        causalityConfidence: causalityEval.confidence,
                        causalityReasoning: causalityEval.reasoning.join('\n'),
                        createdById: userId
                    }
                });
                importCount++;
            }
        });
        // Create Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId,
                action: 'Import Reports',
                resource: 'ADRReport',
                details: `Bulk imported ${importCount} ADR reports from CSV wizard.`,
                ipAddress: req.ip
            }
        });
        // Trigger background signal recalculation
        signalDetectionService_1.SignalDetectionService.runDetection(userId).catch(err => {
            console.error('Asynchronous signal sweep error:', err);
        });
        return res.status(200).json({ success: true, imported: importCount, skipped: 0 });
    }
    catch (error) {
        console.error('importValidatedReports error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Autocomplete endpoint for MedDRA-style reaction terminology.
 */
async function getTerminologyAutocomplete(req, res) {
    try {
        const q = req.query.q;
        if (!q || q.length < 2)
            return res.status(200).json([]);
        const terms = await prisma_1.default.terminology.findMany({
            where: {
                OR: [
                    { lltName: { contains: q } },
                    { ptName: { contains: q } }
                ]
            },
            take: 10
        });
        return res.status(200).json(terms);
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Autocomplete endpoint for drugs.
 */
async function getDrugsAutocomplete(req, res) {
    try {
        const q = req.query.q;
        if (!q || q.length < 2)
            return res.status(200).json([]);
        const drugs = await prisma_1.default.drug.findMany({
            where: {
                OR: [
                    { genericName: { contains: q } },
                    { brandName: { contains: q } }
                ]
            },
            take: 10
        });
        return res.status(200).json(drugs);
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Live clinical causality evaluation endpoint.
 */
async function assessCausalityLive(req, res) {
    try {
        const { temporalRelationship, dechallengeResult, rechallengeResult, alternativeCauses, severity, seriousness } = req.body;
        const result = intelligenceEngine_1.IntelligenceEngine.assessCausality({
            temporalRelationship: temporalRelationship === undefined ? null : temporalRelationship,
            dechallengeResult: dechallengeResult || null,
            rechallengeResult: rechallengeResult || null,
            alternativeCauses: alternativeCauses || null,
            severity: severity || 'Moderate',
            seriousness: seriousness || 'Non-Serious'
        });
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
