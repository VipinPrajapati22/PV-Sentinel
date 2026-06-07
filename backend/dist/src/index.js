"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const signalRoutes_1 = __importDefault(require("./routes/signalRoutes"));
const riskRoutes_1 = __importDefault(require("./routes/riskRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const exportRoutes_1 = __importDefault(require("./routes/exportRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for dev simplicity
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/signals', signalRoutes_1.default);
app.use('/api/risks', riskRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/audits', auditRoutes_1.default);
app.use('/api/exports', exportRoutes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});
// Start Server
app.listen(PORT, () => {
    console.log(`Pharmacovigilance API Server running on port ${PORT}`);
});
exports.default = app;
