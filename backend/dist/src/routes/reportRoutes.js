"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
// Public sample downloads (do not require auth)
router.get('/sample-csv', reportController_1.sampleCsv);
router.get('/sample-excel', reportController_1.sampleExcel);
// All other routes require authentication
router.use(auth_1.authenticateToken);
router.get('/', reportController_1.getReports);
router.get('/terminology/autocomplete', reportController_1.getTerminologyAutocomplete);
router.get('/drugs/autocomplete', reportController_1.getDrugsAutocomplete);
router.post('/causality/assess', reportController_1.assessCausalityLive);
router.get('/:id', reportController_1.getReportById);
router.post('/', reportController_1.createReport);
router.post('/upload', upload.single('file'), reportController_1.uploadCsv);
router.post('/import', reportController_1.importValidatedReports);
exports.default = router;
