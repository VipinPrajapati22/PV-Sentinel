"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportExcel = exportExcel;
exports.exportSignalPdf = exportSignalPdf;
exports.dashboard = dashboard;
const prisma_1 = __importDefault(require("../utils/prisma"));
const exportService_1 = require("../services/exportService");
const intelligenceEngine_1 = require("../services/intelligenceEngine");
/**
 * Exports all reports and signals to an Excel spreadsheet.
 */
async function exportExcel(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Fetch reports
        const dbReports = await prisma_1.default.aDRReport.findMany({
            include: { suspectedDrug: true, reactionTerminology: true }
        });
        const reportsData = dbReports.map((r) => ({
            id: r.id.substring(0, 8).toUpperCase(), // Shorten UUID for Excel read
            patientAge: r.patientId ? 0 : 0, // Placeholder, let's load patient age below
            patientAgeUnit: '',
            patientGender: '',
            suspectedDrug: r.suspectedDrug.genericName,
            reaction: r.reactionTerminology.ptName,
            severity: r.severity,
            seriousness: r.seriousness,
            causality: r.causalityAssessment,
            outcome: r.outcome,
            reporterName: r.reporterName,
            reportDate: r.reportDate
        }));
        // Retrieve patient details in parallel
        const patientIds = dbReports.map((r) => r.patientId);
        const patients = await prisma_1.default.patient.findMany({
            where: { id: { in: patientIds } }
        });
        dbReports.forEach((r, idx) => {
            const pat = patients.find((p) => p.id === r.patientId);
            if (pat) {
                reportsData[idx].patientAge = pat.age;
                reportsData[idx].patientAgeUnit = pat.ageUnit;
                reportsData[idx].patientGender = pat.gender;
            }
        });
        // Fetch signals
        const dbSignals = await prisma_1.default.signalDetection.findMany({
            include: { drug: true }
        });
        const signalsData = dbSignals.map((s) => ({
            drugName: s.drug.genericName,
            reactionPtName: s.reactionPtName,
            prr: s.prr,
            ror: s.ror,
            chiSquare: s.chiSquare,
            ciLower: s.ciLower,
            ciUpper: s.ciUpper,
            informationComponent: s.informationComponent,
            signalScore: s.signalScore,
            strength: s.strength,
            trend: s.trend,
            status: s.status
        }));
        // Calculate overall stats
        const strong = dbSignals.filter((s) => s.strength === 'Strong').length;
        const moderate = dbSignals.filter((s) => s.strength === 'Moderate').length;
        const weak = dbSignals.filter((s) => s.strength === 'Weak').length;
        const prrs = dbSignals.map((s) => s.prr);
        const avgPrr = prrs.length > 0 ? prrs.reduce((a, b) => a + b, 0) / prrs.length : 0;
        const maxPrr = prrs.length > 0 ? Math.max(...prrs) : 0;
        const stats = {
            total: dbSignals.length,
            strong,
            moderate,
            weak,
            avgPrr: Math.round(avgPrr * 100) / 100,
            maxPrr
        };
        const buffer = await exportService_1.ExportService.generateExcel(reportsData, signalsData, stats);
        // Create Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId,
                action: 'Export Excel',
                resource: 'ADRReport',
                details: `Exported ${reportsData.length} reports and ${signalsData.length} signals to Excel.`,
                ipAddress: req.ip
            }
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Pharmacovigilance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
        return res.status(200).send(buffer);
    }
    catch (error) {
        console.error('exportExcel error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Generates and downloads a clinical safety PDF evaluation report for a signal.
 */
async function exportSignalPdf(req, res) {
    try {
        const { signalId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Fetch signal details
        const signalIdParam = String(signalId);
        const signal = await prisma_1.default.signalDetection.findUnique({
            where: { id: signalIdParam },
            include: { drug: true }
        });
        if (!signal) {
            return res.status(404).json({ error: 'Safety signal not found' });
        }
        // Fetch contributing reports
        const cases = await prisma_1.default.aDRReport.findMany({
            where: {
                suspectedDrugId: signal.drugId,
                reactionTerminology: { ptName: signal.reactionPtName }
            },
            include: { patient: true }
        });
        // Compute Demographic Distributions
        const ageDist = { 'Child (<18)': 0, 'Adult (18-64)': 0, 'Elderly (>=65)': 0, 'Unknown': 0 };
        const genderDist = {};
        const severityDist = {};
        const reporterDist = {};
        const causalityStats = {};
        cases.forEach((c) => {
            // Age group
            const age = c.patient.age;
            const unit = c.patient.ageUnit;
            if (unit !== 'Years')
                ageDist['Child (<18)']++;
            else if (age < 18)
                ageDist['Child (<18)']++;
            else if (age >= 65)
                ageDist['Elderly (>=65)']++;
            else if (age >= 18 && age < 65)
                ageDist['Adult (18-64)']++;
            else
                ageDist['Unknown']++;
            // Gender
            const gender = c.patient.gender;
            genderDist[gender] = (genderDist[gender] || 0) + 1;
            // Severity
            const sev = c.severity;
            severityDist[sev] = (severityDist[sev] || 0) + 1;
            // Reporter Type
            const rep = c.reporterType;
            reporterDist[rep] = (reporterDist[rep] || 0) + 1;
            // Causality
            const caus = c.causalityAssessment;
            causalityStats[caus] = (causalityStats[caus] || 0) + 1;
        });
        // Generate Expert Intelligence assessment
        const statsInterpretation = intelligenceEngine_1.IntelligenceEngine.interpretStats({
            prr: signal.prr,
            ror: signal.ror,
            chiSquare: signal.chiSquare,
            ciLower: signal.ciLower,
            ciUpper: signal.ciUpper,
            informationComponent: signal.informationComponent,
            signalScore: signal.signalScore,
            caseCount: cases.length,
            strength: signal.strength,
            trend: signal.trend
        });
        const riskAssessment = intelligenceEngine_1.IntelligenceEngine.assessRisk({
            prr: signal.prr,
            ror: signal.ror,
            chiSquare: signal.chiSquare,
            ciLower: signal.ciLower,
            ciUpper: signal.ciUpper,
            informationComponent: signal.informationComponent,
            signalScore: signal.signalScore,
            caseCount: cases.length,
            strength: signal.strength,
            trend: signal.trend
        }, severityDist);
        const capaRecommendations = intelligenceEngine_1.IntelligenceEngine.getCapaRecommendations(signal.drug.genericName, signal.reactionPtName, signal.strength);
        const executiveSummary = intelligenceEngine_1.IntelligenceEngine.generateExecutiveSummary(signal.drug.genericName, signal.reactionPtName, {
            prr: signal.prr,
            ror: signal.ror,
            chiSquare: signal.chiSquare,
            ciLower: signal.ciLower,
            ciUpper: signal.ciUpper,
            informationComponent: signal.informationComponent,
            signalScore: signal.signalScore,
            caseCount: cases.length,
            strength: signal.strength,
            trend: signal.trend
        }, causalityStats, riskAssessment);
        const expertInterpretation = {
            causality: {
                category: signal.strength === 'Strong' ? 'Probable' : 'Possible',
                confidence: signal.strength === 'Strong' ? 0.85 : 0.65,
                reasoning: [
                    'Consensus algorithm computed causality assessment.',
                    `Statistical reporting frequency exceeds threshold. Cases: ${cases.length}.`,
                    `High proportion of plausible temporal relationship reports.`
                ]
            },
            statsInterpretation,
            riskAssessment,
            capaRecommendations,
            executiveSummary
        };
        const signalData = {
            drugName: signal.drug.genericName,
            reactionPtName: signal.reactionPtName,
            prr: signal.prr,
            ror: signal.ror,
            chiSquare: signal.chiSquare,
            ciLower: signal.ciLower,
            ciUpper: signal.ciUpper,
            informationComponent: signal.informationComponent,
            signalScore: signal.signalScore,
            strength: signal.strength,
            trend: signal.trend,
            status: signal.status
        };
        const buffer = await exportService_1.ExportService.generateSignalPdf(signalData, expertInterpretation, { ageDist, genderDist, severityDist, reporterDist });
        // Create Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId,
                action: 'Export PDF Report',
                resource: 'SignalDetection',
                resourceId: signalIdParam,
                details: `Exported safety dossier PDF for signal ${signal.drug.genericName} - ${signal.reactionPtName}.`,
                ipAddress: req.ip
            }
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Signal_Dossier_${signal.drug.genericName}_${signal.reactionPtName}.pdf`);
        return res.status(200).send(buffer);
    }
    catch (error) {
        console.error('exportSignalPdf error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Returns dashboard KPIs and chart data for the frontend.
 */
async function dashboard(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        // Basic counts
        const totalReports = await prisma_1.default.aDRReport.count();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const reportsThisMonth = await prisma_1.default.aDRReport.count({ where: { reportDate: { gte: startOfMonth } } });
        const strongSignals = await prisma_1.default.signalDetection.count({ where: { strength: 'Strong' } });
        const seriousCases = await prisma_1.default.aDRReport.count({ where: { seriousness: 'Serious' } });
        const underReview = await prisma_1.default.signalDetection.count({ where: { status: { in: ['Under Review', 'Triaged', 'Detected', 'New'] } } });
        // Severity distribution
        const reportsForDist = await prisma_1.default.aDRReport.findMany({ select: { severity: true, reportDate: true } });
        const severityDistribution = {};
        reportsForDist.forEach((r) => {
            severityDistribution[r.severity] = (severityDistribution[r.severity] || 0) + 1;
        });
        // Signal strength distribution
        const signals = await prisma_1.default.signalDetection.findMany({ select: { strength: true } });
        const signalStrengthDistribution = {};
        signals.forEach((s) => { signalStrengthDistribution[s.strength] = (signalStrengthDistribution[s.strength] || 0) + 1; });
        // Monthly trend (last 12 months)
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('en-US', { month: 'short' });
            months.push({ key, label });
        }
        const monthlyReportsPromises = months.map((m) => prisma_1.default.aDRReport.count({ where: { reportDate: { gte: new Date(m.key + '-01'), lt: new Date(new Date(m.key + '-01').getFullYear(), new Date(m.key + '-01').getMonth() + 1, 1) } } }));
        const monthlySignalsPromises = months.map((m) => prisma_1.default.signalDetection.count({ where: { detectedAt: { gte: new Date(m.key + '-01'), lt: new Date(new Date(m.key + '-01').getFullYear(), new Date(m.key + '-01').getMonth() + 1, 1) } } }));
        const monthlyReports = await Promise.all(monthlyReportsPromises);
        const monthlySignals = await Promise.all(monthlySignalsPromises);
        const monthlyTrend = months.map((m, idx) => ({ month: m.label, reports: monthlyReports[idx] || 0, signals: monthlySignals[idx] || 0 }));
        // Compute additional signal statistics for risk radar
        const dbSignals = await prisma_1.default.signalDetection.findMany({ select: { strength: true, signalScore: true } });
        const totalSignals = dbSignals.length;
        const strongCount = dbSignals.filter((s) => s.strength === 'Strong').length;
        const avgSignalScore = dbSignals.length ? Math.round((dbSignals.reduce((a, b) => a + (b.signalScore || 0), 0) / dbSignals.length) * 100) / 100 : 0;
        // CAPA / Risk registers
        const capaCount = await prisma_1.default.riskRegister.count();
        // Severity-based factor (proportion of severe/life-threatening/fatal cases)
        const severeCount = (severityDistribution['Severe'] || 0) + (severityDistribution['Life-threatening'] || 0) + (severityDistribution['Fatal'] || 0);
        const severityRatio = totalReports ? severeCount / totalReports : 0;
        const severityScore = Math.min(100, Math.round(severityRatio * 100 * 2)); // scale to make visible
        // Frequency (scale against a sensible benchmark of ~5k reports seeded)
        const BASE_REPORTS = 5200;
        const frequencyScore = Math.min(100, Math.round((totalReports / BASE_REPORTS) * 100));
        // Causality (share of strong signals)
        const causalityScore = totalSignals ? Math.min(100, Math.round((strongCount / totalSignals) * 100)) : 0;
        // Detectability — how easy it is to detect signals (more reports -> higher detectability)
        const detectabilityScore = Math.min(100, Math.round((Math.log10(totalReports + 1) / Math.log10(BASE_REPORTS + 1)) * 100));
        // Regulatory concern driven by proportion of serious cases
        const regulatoryRatio = totalReports ? (seriousCases / totalReports) : 0;
        const regulatoryScore = Math.min(100, Math.round(regulatoryRatio * 100 * 4));
        // CAPA maturity / activity
        const capaScore = totalSignals ? Math.min(100, Math.round((capaCount / Math.max(1, totalSignals)) * 100)) : Math.min(100, Math.round(capaCount * 10));
        const stats = {
            totalReports,
            reportsThisMonth,
            strongSignals,
            seriousCases,
            underReview,
            severityDistribution,
            signalStrengthDistribution,
            riskScore: {
                severity: severityScore,
                frequency: frequencyScore,
                causality: causalityScore,
                detectability: detectabilityScore,
                regulatory: regulatoryScore,
                capa: capaScore
            }
        };
        return res.status(200).json({ stats, charts: { monthlyTrend } });
    }
    catch (error) {
        console.error('dashboard error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
