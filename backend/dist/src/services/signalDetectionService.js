"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalDetectionService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const statsEngine_1 = require("./statsEngine");
class SignalDetectionService {
    /**
     * Executes a complete statistical signal detection sweep across all reports.
     * Preserves existing statuses (e.g., Under Review, Confirmed) and histories.
     */
    static async runDetection(userId) {
        console.log('Running background signal detection Sweep...');
        // Fetch all reports
        const reports = await prisma_1.default.aDRReport.findMany({
            include: {
                suspectedDrug: true,
                reactionTerminology: true
            }
        });
        const N = reports.length;
        if (N < 3) {
            console.log('Insufficient reports to run signal detection (N < 3).');
            return 0;
        }
        // Counts maps
        const drugCounts = {};
        const eventCounts = {};
        const jointCounts = {}; // key: drugId_ptName
        for (const r of reports) {
            const drugId = r.suspectedDrugId;
            const ptName = r.reactionTerminology.ptName;
            const key = `${drugId}_${ptName}`;
            drugCounts[drugId] = (drugCounts[drugId] || 0) + 1;
            eventCounts[ptName] = (eventCounts[ptName] || 0) + 1;
            jointCounts[key] = (jointCounts[key] || 0) + 1;
        }
        let detectedCount = 0;
        const sysUser = await prisma_1.default.user.findFirst({ where: { email: 'admin@pvplatform.local' } });
        const actingUserId = userId || sysUser?.id || '';
        // Loop through joint counts and compute statistics
        for (const [key, a] of Object.entries(jointCounts)) {
            if (a < 2)
                continue; // Minimum case threshold for signal detection
            const [drugId, ptName] = key.split('_');
            const drugReports = drugCounts[drugId] || 0;
            const eventReports = eventCounts[ptName] || 0;
            // Calculate stats using engine
            const metrics = (0, statsEngine_1.calculateMetrics)(a, drugReports, eventReports, N);
            if (metrics.strength === 'No Signal')
                continue;
            // Check if signal already exists
            const existingSignal = await prisma_1.default.signalDetection.findFirst({
                where: {
                    drugId,
                    reactionPtName: ptName
                }
            });
            if (existingSignal) {
                // Calculate trend based on case count growth
                let trend = existingSignal.trend;
                if (a > existingSignal.prr) { // Simple logic based on increase
                    trend = 'Increasing';
                }
                else if (a < existingSignal.prr) {
                    trend = 'Decreasing';
                }
                else {
                    trend = 'Stable';
                }
                // Update stats
                await prisma_1.default.signalDetection.update({
                    where: { id: existingSignal.id },
                    data: {
                        prr: metrics.prr,
                        ror: metrics.ror,
                        chiSquare: metrics.chiSquare,
                        ciLower: metrics.ciLower,
                        ciUpper: metrics.ciUpper,
                        informationComponent: metrics.informationComponent,
                        signalScore: metrics.signalScore,
                        strength: metrics.strength,
                        trend
                    }
                });
            }
            else {
                // Create new signal
                const newSig = await prisma_1.default.signalDetection.create({
                    data: {
                        drugId,
                        reactionPtName: ptName,
                        prr: metrics.prr,
                        ror: metrics.ror,
                        chiSquare: metrics.chiSquare,
                        ciLower: metrics.ciLower,
                        ciUpper: metrics.ciUpper,
                        informationComponent: metrics.informationComponent,
                        signalScore: metrics.signalScore,
                        status: 'New',
                        strength: metrics.strength,
                        trend: 'Stable'
                    }
                });
                // Add history entry
                await prisma_1.default.signalHistory.create({
                    data: {
                        signalId: newSig.id,
                        previousStatus: 'None',
                        newStatus: 'New',
                        modifiedById: actingUserId,
                        notes: `System-generated safety signal detected. Strength: ${metrics.strength}, PRR: ${metrics.prr}.`
                    }
                });
                // Add Notification for safety officers if it's a Strong signal
                if (metrics.strength === 'Strong') {
                    const safetyOfficers = await prisma_1.default.user.findMany({
                        where: { role: { name: 'Safety Officer' } }
                    });
                    const drug = await prisma_1.default.drug.findUnique({ where: { id: drugId } });
                    for (const officer of safetyOfficers) {
                        await prisma_1.default.notification.create({
                            data: {
                                userId: officer.id,
                                title: `Strong Safety Alert: ${drug?.genericName} - ${ptName}`,
                                message: `New safety signal flagged. PRR: ${metrics.prr}, Cases: ${a}. Immediate evaluation required.`,
                                type: 'warning'
                            }
                        });
                    }
                }
            }
            detectedCount++;
        }
        console.log(`Signal sweep completed. Total active signals processed: ${detectedCount}`);
        return detectedCount;
    }
}
exports.SignalDetectionService = SignalDetectionService;
