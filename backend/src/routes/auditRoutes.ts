import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['Admin'])); // Restricted to Admin role

router.get('/', getAuditLogs);

export default router;
