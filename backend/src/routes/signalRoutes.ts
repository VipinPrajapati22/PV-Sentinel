import { Router } from 'express';
import { getSignals, getTopSignals, getSignalById, updateSignalStatus, triggerReanalysis } from '../controllers/signalController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getSignals);
router.get('/top', getTopSignals);
router.get('/:id', getSignalById);
router.patch('/:id/status', updateSignalStatus);
router.post('/reanalyze', triggerReanalysis);

export default router;
