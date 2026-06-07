import { Router } from 'express';
import { getRisks, escalateSignal, updateRisk, updateCapa } from '../controllers/riskController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getRisks);
router.post('/escalate', escalateSignal);
router.patch('/:id', updateRisk);
router.patch('/capa/:id', updateCapa);

export default router;
