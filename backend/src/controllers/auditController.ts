import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

/**
 * Retrieves all system audit logs. Restricted to Admin.
 */
export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true }
          }
        }
      }),
      prisma.auditLog.count()
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
  } catch (error: any) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
