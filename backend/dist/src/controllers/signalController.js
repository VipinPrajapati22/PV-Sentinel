"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignals = getSignals;
exports.getTopSignals = getTopSignals;
exports.getSignalById = getSignalById;
exports.updateSignalStatus = updateSignalStatus;
exports.triggerReanalysis = triggerReanalysis;
const prisma_1 = __importDefault(require("../utils/prisma"));
const intelligenceEngine_1 = require("../services/intelligenceEngine");
const signalDetectionService_1 = require("../services/signalDetectionService");
/**
 * Retrieves all detected signals with filters and pagination.
 */
async function getSignals(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, strength, status } = req.query;
        const where = {};
        if (strength) {
            where.strength = strength;
        }
        if (status) {
            where.status = status;
        }
        if (search) {
            const searchStr = search;
            where.OR = [
                { drug: { genericName: { contains: searchStr } } },
                { drug: { brandName: { contains: searchStr } } },
                { reactionPtName: { contains: searchStr } }
            ];
        }
        const [signals, total] = await Promise.all([
            prisma_1.default.signalDetection.findMany({
                where,
                skip,
                take: limit,
                orderBy: { signalScore: 'desc' },
                include: { drug: true }
            }),
            prisma_1.default.signalDetection.count({ where })
        ]);
        return res.status(200).json({
            signals,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('getSignals error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Retrieves the top 20 safety signals ranked by composite score.
 */
async function getTopSignals(req, res) {
    try {
        const rawSignals = await prisma_1.default.signalDetection.findMany({
            take: 20,
            orderBy: { signalScore: 'desc' },
            include: { drug: true }
        });
        // Attach case counts for each signal so frontend can display 'Cases'
        const signals = await Promise.all(rawSignals.map(async (s) => {
            const cases = await prisma_1.default.aDRReport.count({
                where: {
                    suspectedDrugId: s.drugId,
                    reactionTerminology: { ptName: s.reactionPtName }
                }
            });
            return { ...s, caseCount: cases };
        }));
        return res.status(200).json(signals);
    }
    catch (error) {
        console.error('getTopSignals error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Retrieves comprehensive detail metrics, case distributions, audit history,
 * and expert recommendations for a specific signal.
 */
async function getSignalById(req, res) {
    try {
        const id = String(req.params.id);
        const signal = await prisma_1.default.signalDetection.findUnique({
            where: { id },
            include: {
                drug: true,
                histories: {
                    orderBy: { changedAt: 'desc' }
                },
                riskRegisters: {
                    include: { owner: { select: { firstName: true, lastName: true } } }
                }
            }
        });
        if (!signal) {
            return res.status(404).json({ error: 'Signal not found' });
        }
        // Fetch all reports contributing to this signal
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
        const timelineData = {}; // Format: YYYY-MM
        cases.forEach((c) => {
            // Age group
            const age = c.patient.age;
            const unit = c.patient.ageUnit;
            if (unit !== 'Years') {
                ageDist['Child (<18)']++;
            }
            else if (age < 18) {
                ageDist['Child (<18)']++;
            }
            else if (age >= 65) {
                ageDist['Elderly (>=65)']++;
            }
            else if (age >= 18 && age < 65) {
                ageDist['Adult (18-64)']++;
            }
            else {
                ageDist['Unknown']++;
            }
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
            // Timeline (YYYY-MM)
            const date = new Date(c.reportDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            timelineData[key] = (timelineData[key] || 0) + 1;
        });
        // Format timeline for chart representation
        const formattedTimeline = Object.entries(timelineData)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        // Call Expert Intelligence Engine
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
        // Fetch user details for audit histories
        const historiesWithUsers = await Promise.all(signal.histories.map(async (h) => {
            const user = await prisma_1.default.user.findUnique({
                where: { id: h.modifiedById },
                select: { firstName: true, lastName: true, email: true }
            });
            return { ...h, user };
        }));
        return res.status(200).json({
            signal,
            casesCount: cases.length,
            demographics: {
                ageDist,
                genderDist,
                severityDist,
                reporterDist,
                causalityStats
            },
            timeline: formattedTimeline,
            expertAnalysis: {
                statsInterpretation,
                riskAssessment,
                capaRecommendations,
                executiveSummary
            },
            histories: historiesWithUsers
        });
    }
    catch (error) {
        console.error('getSignalById error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Updates the evaluation status of a safety signal.
 */
async function updateSignalStatus(req, res) {
    try {
        const id = String(req.params.id);
        const { status, notes } = req.body;
        const userId = req.user?.id;
        if (!status || !userId) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const signal = await prisma_1.default.signalDetection.findUnique({ where: { id } });
        if (!signal) {
            return res.status(404).json({ error: 'Signal not found' });
        }
        const updatedSignal = await prisma_1.default.signalDetection.update({
            where: { id },
            data: { status }
        });
        // Create history record
        await prisma_1.default.signalHistory.create({
            data: {
                signalId: id,
                previousStatus: signal.status,
                newStatus: status,
                modifiedById: userId,
                notes: notes || 'Status updated during review process.'
            }
        });
        // Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId,
                action: 'Update Signal Status',
                resource: 'SignalDetection',
                resourceId: id,
                details: `Updated signal status from ${signal.status} to ${status}.`,
                ipAddress: req.ip
            }
        });
        return res.status(200).json(updatedSignal);
    }
    catch (error) {
        console.error('updateSignalStatus error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
/**
 * Triggers manual reanalysis of all spontaneous ADR reports in the database.
 */
async function triggerReanalysis(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const processedCount = await signalDetectionService_1.SignalDetectionService.runDetection(userId);
        // Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId,
                action: 'Manual Signal Detection Reanalysis',
                resource: 'SignalDetection',
                details: `Triggered manual signal sweep. Processed ${processedCount} signals.`,
                ipAddress: req.ip
            }
        });
        return res.status(200).json({ success: true, message: `Reanalysis complete. Processed ${processedCount} signals.` });
    }
    catch (error) {
        console.error('triggerReanalysis error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
