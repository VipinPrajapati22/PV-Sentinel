"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = require("../controllers/auditController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['Admin'])); // Restricted to Admin role
router.get('/', auditController_1.getAuditLogs);
exports.default = router;
