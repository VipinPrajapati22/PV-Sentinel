import { Router } from 'express';
import { exportExcel, exportSignalPdf, dashboard } from '../controllers/exportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', dashboard);
router.get('/excel', exportExcel);
router.get('/pdf/:signalId', exportSignalPdf);

export default router;
