import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes';
import reportRoutes from './routes/reportRoutes';
import signalRoutes from './routes/signalRoutes';
import riskRoutes from './routes/riskRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditRoutes from './routes/auditRoutes';
import exportRoutes from './routes/exportRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/exports', exportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Pharmacovigilance API Server running on port ${PORT}`);
});

export default app;
