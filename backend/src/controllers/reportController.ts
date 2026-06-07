import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { IntelligenceEngine } from '../services/intelligenceEngine';
import { SignalDetectionService } from '../services/signalDetectionService';
import { parseCsv } from '../utils/csv';
import ExcelJS from 'exceljs';

/**
 * Retrieves all spontaneous reports with pagination and filter criteria.
 */
export async function getReports(req: AuthenticatedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, severity, seriousness, causality, drugId } = req.query;

    const where: any = {};

    if (drugId) {
      where.suspectedDrugId = drugId as string;
    }

    if (severity) {
      where.severity = severity as string;
    }

    if (seriousness) {
      where.seriousness = seriousness as string;
    }

    if (causality) {
      where.causalityAssessment = causality as string;
    }

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { suspectedDrug: { genericName: { contains: searchStr } } },
        { suspectedDrug: { brandName: { contains: searchStr } } },
        { reactionTerminology: { ptName: { contains: searchStr } } },
        { reactionTerminology: { lltName: { contains: searchStr } } },
        { reporterName: { contains: searchStr } }
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.aDRReport.findMany({
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
      prisma.aDRReport.count({ where })
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
  } catch (error: any) {
    console.error('getReports error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Fetches a single ADR report by ID.
 */
export async function getReportById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const report = await prisma.aDRReport.findUnique({
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
  } catch (error: any) {
    console.error('getReportById error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Creates a single spontaneous ADR report.
 */
export async function createReport(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      patientAge,
      patientAgeUnit,
      patientGender,
      patientWeight,
      patientHeight,
      patientMedicalHistory,
      patientComorbidities,
      drugName, // brand or generic
      reactionFreeText,
      severity,
      seriousness,
      outcome,
      reporterName,
      reporterType,
      followUp,
      notes,
      temporalRelationship,
      dechallengeResult,
      rechallengeResult,
      alternativeCauses
    } = req.body;

    if (!patientAge || !patientAgeUnit || !patientGender || !drugName || !reactionFreeText || !severity || !seriousness || !outcome || !reporterName || !reporterType || !followUp) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 1. Create Patient
    const patient = await prisma.patient.create({
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
    let drug = await prisma.drug.findFirst({
      where: {
        OR: [
          { genericName: { equals: drugName } },
          { brandName: { equals: drugName } }
        ]
      }
    });

    if (!drug) {
      // Create new drug as fallback
      drug = await prisma.drug.create({
        data: {
          brandName: drugName,
          genericName: drugName,
          atcCode: 'UNKNOWN',
          manufacturer: 'Unknown'
        }
      });
    }

    // 3. Resolve Terminology (MedDRA PT matching)
    let term = await prisma.terminology.findFirst({
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
      term = await prisma.terminology.create({
        data: {
          lltName: reactionFreeText,
          ptName: reactionFreeText,
          socName: 'General disorders',
          synonyms: reactionFreeText
        }
      });
    }

    // 4. Auto-Assess Causality using expert system
    const causalityEval = IntelligenceEngine.assessCausality({
      temporalRelationship: temporalRelationship === undefined ? null : temporalRelationship,
      dechallengeResult: dechallengeResult || null,
      rechallengeResult: rechallengeResult || null,
      alternativeCauses: alternativeCauses || null,
      severity,
      seriousness
    });

    // 5. Create ADR Report
    const newReport = await prisma.aDRReport.create({
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
    await prisma.auditLog.create({
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
    SignalDetectionService.runDetection(userId).catch(err => {
      console.error('Asynchronous signal sweep error:', err);
    });

    return res.status(201).json(newReport);
  } catch (error: any) {
    console.error('createReport error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Endpoint for CSV Upload (Validation and preview phase).
 */
export async function uploadCsv(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Support both CSV and Excel (.xls/.xlsx) uploads
    const name = (req.file.originalname || '').toLowerCase();
    let rawRows: Record<string, string>[] = [];

    if (name.endsWith('.xls') || name.endsWith('.xlsx') || req.file.mimetype.includes('spreadsheet') || req.file.mimetype.includes('excel')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer as any);
      const sheet = workbook.worksheets[0] || workbook.getWorksheet(1);
      if (!sheet) return res.status(400).json({ error: 'Excel file contains no worksheets' });

      // Read header
      const headers: string[] = [];
      const headerRow = sheet.getRow(1);
      headerRow.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
        const txt = cell.text || (cell.value ? String(cell.value) : '');
        headers[colNumber - 1] = txt ? String(txt).trim() : `Column${colNumber}`;
      });

      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        if (!row || row.cellCount === 0) continue;
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          const cell = row.getCell(idx + 1);
          const value = cell && (cell.text ?? cell.value) ? String(cell.text ?? cell.value) : '';
          obj[h] = value;
        });
        // skip empty rows
        if (Object.values(obj).some(v => v && v.toString().trim() !== '')) rawRows.push(obj);
      }
    } else {
      const csvText = req.file.buffer.toString('utf-8');
      rawRows = parseCsv(csvText);
    }

    if (rawRows.length === 0) {
      return res.status(400).json({ error: 'Uploaded CSV is empty' });
    }

    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const terminologySuggestions: Record<string, string> = {};

    // Load terminology for fast local mapping suggestion
    const terminologyList = await prisma.terminology.findMany({
      select: { id: true, lltName: true, ptName: true, socName: true }
    });

    // Normalize header keys so Excel files with snake_case or different column names are accepted
    const normalizeKey = (k: any) => String(k || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');

    const getFirst = (obj: Record<string, any>, keys: string[]) => {
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).toString().trim() !== '') return String(obj[k]);
      }
      return '';
    };

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // Header is row 1
      const errors: string[] = [];

      // build normalized row map
      const norm: Record<string, any> = {};
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
      if (!patientAgeStr) errors.push('Missing "Patient Age"');
      else if (isNaN(parseFloat(patientAgeStr)) || parseFloat(patientAgeStr) < 0) errors.push('Invalid numeric "Patient Age"');

      if (!ageUnit || !['days', 'months', 'years'].includes(String(ageUnit).trim().toLowerCase())) {
        errors.push('Missing or invalid "Age Unit" (must be Days, Months, Years)');
      }

      if (!gender) errors.push('Missing "Gender"');

      if (!drugName) errors.push('Missing "Drug" name');
      if (!reaction) errors.push('Missing "Reaction"');

      const parsedSeverity = severity || 'Moderate';
      const parsedSeriousness = seriousness || 'Non-Serious';
      const parsedOutcome = outcome || 'Unknown';
      const parsedReporter = reporter || 'Unknown';
      const parsedFollowUp = followUp || 'No';

      const mappedTerm = reaction ? terminologyList.find((t: any) =>
        t.lltName.toLowerCase() === reaction.toLowerCase().trim() ||
        t.ptName.toLowerCase() === reaction.toLowerCase().trim()
      ) : null;

      if (errors.length > 0) {
        invalidRows.push({
          rowNumber: rowNum,
          errors,
          data: row
        });
      } else {
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
  } catch (error: any) {
    console.error('uploadCsv error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Public sample CSV download
 */
export async function sampleCsv(req: Request, res: Response) {
  try {
    const headers = ['Patient Age','Age Unit','Gender','Drug','Reaction','Severity','Seriousness','Outcome','Reporter','Follow-up','Notes'];
    const rows = [
      ['45','Years','Female','Warfarin','GI haemorrhage','Severe','Serious','Hospitalized','Dr. A','Yes','Patient on multiple meds'],
      ['63','Years','Male','Metformin','Hypoglycemia','Moderate','Non-Serious','Recovered','Dr. B','No','No dechallenge']
    ];

    const csvLines = [headers.join(',')].concat(rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')));
    const csv = csvLines.join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_adr_data.csv"');
    return res.status(200).send(csv);
  } catch (error: any) {
    console.error('sampleCsv error:', error);
    return res.status(500).json({ error: 'Failed generating sample CSV' });
  }
}

/**
 * Public sample Excel download generated on-the-fly
 */
export async function sampleExcel(req: Request, res: Response) {
  try {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Sample ADRs');
    const headers = ['Patient Age','Age Unit','Gender','Drug','Reaction','Severity','Seriousness','Outcome','Reporter','Follow-up','Notes'];
    ws.addRow(headers);
    const rows = [
      ['45','Years','Female','Warfarin','GI haemorrhage','Severe','Serious','Hospitalized','Dr. A','Yes','Patient on multiple meds'],
      ['63','Years','Male','Metformin','Hypoglycemia','Moderate','Non-Serious','Recovered','Dr. B','No','No dechallenge']
    ];
    rows.forEach(r => ws.addRow(r));

    const buf = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_adr_data.xlsx"');
    return res.status(200).send(Buffer.from(buf));
  } catch (error: any) {
    console.error('sampleExcel error:', error);
    return res.status(500).json({ error: 'Failed generating sample Excel' });
  }
}

/**
 * Commits the validated, corrected and mapped CSV rows to the database.
 */
export async function importValidatedReports(req: AuthenticatedRequest, res: Response) {
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

    await prisma.$transaction(async (tx: any) => {
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
        const causalityEval = IntelligenceEngine.assessCausality({
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
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'Import Reports',
        resource: 'ADRReport',
        details: `Bulk imported ${importCount} ADR reports from CSV wizard.`,
        ipAddress: req.ip
      }
    });

    // Trigger background signal recalculation
    SignalDetectionService.runDetection(userId).catch(err => {
      console.error('Asynchronous signal sweep error:', err);
    });

    return res.status(200).json({ success: true, imported: importCount, skipped: 0 });
  } catch (error: any) {
    console.error('importValidatedReports error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Autocomplete endpoint for MedDRA-style reaction terminology.
 */
export async function getTerminologyAutocomplete(req: Request, res: Response) {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) return res.status(200).json([]);
    
    const terms = await prisma.terminology.findMany({
      where: {
        OR: [
          { lltName: { contains: q } },
          { ptName: { contains: q } }
        ]
      },
      take: 10
    });
    return res.status(200).json(terms);
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Autocomplete endpoint for drugs.
 */
export async function getDrugsAutocomplete(req: Request, res: Response) {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) return res.status(200).json([]);
    
    const drugs = await prisma.drug.findMany({
      where: {
        OR: [
          { genericName: { contains: q } },
          { brandName: { contains: q } }
        ]
      },
      take: 10
    });
    return res.status(200).json(drugs);
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Live clinical causality evaluation endpoint.
 */
export async function assessCausalityLive(req: Request, res: Response) {
  try {
    const {
      temporalRelationship,
      dechallengeResult,
      rechallengeResult,
      alternativeCauses,
      severity,
      seriousness
    } = req.body;

    const result = IntelligenceEngine.assessCausality({
      temporalRelationship: temporalRelationship === undefined ? null : temporalRelationship,
      dechallengeResult: dechallengeResult || null,
      rechallengeResult: rechallengeResult || null,
      alternativeCauses: alternativeCauses || null,
      severity: severity || 'Moderate',
      seriousness: seriousness || 'Non-Serious'
    });
    
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
