import { Router } from 'express';
import { login, register, getMe } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticateToken, requireRole(['Admin']), register);
router.get('/me', authenticateToken, getMe);

export default router;
