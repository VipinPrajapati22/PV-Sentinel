"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = getAuditLogs;
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Retrieves all system audit logs. Restricted to Admin.
 */
async function getAuditLogs(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma_1.default.auditLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true, firstName: true, lastName: true }
                    }
                }
            }),
            prisma_1.default.auditLog.count()
        ]);
        return res.status(200).json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('getAuditLogs error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
