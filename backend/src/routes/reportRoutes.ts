import { Router } from 'express';
import multer from 'multer';
import { getReports, getReportById, createReport, uploadCsv, importValidatedReports, getTerminologyAutocomplete, getDrugsAutocomplete, assessCausalityLive, sampleCsv, sampleExcel } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });


// Public sample downloads (do not require auth)
router.get('/sample-csv', sampleCsv);
router.get('/sample-excel', sampleExcel);

// All other routes require authentication
router.use(authenticateToken);

router.get('/', getReports);
router.get('/terminology/autocomplete', getTerminologyAutocomplete);
router.get('/drugs/autocomplete', getDrugsAutocomplete);
router.post('/causality/assess', assessCausalityLive);
router.get('/:id', getReportById);
router.post('/', createReport);
router.post('/upload', upload.single('file'), uploadCsv);
router.post('/import', importValidatedReports);

export default router;
