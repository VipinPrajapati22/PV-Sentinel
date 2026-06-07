import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, CheckCircle, XCircle, AlertTriangle,
  FileText, ArrowRight, Loader2, Download
} from 'lucide-react';
import { reports } from '../lib/api';

const STEPS = ['Upload', 'Preview', 'Validate', 'Map', 'Import', 'Done'];

type ParsedRow = Record<string, string>;

export default function CsvImportPage() {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ valid: ParsedRow[]; invalid: any[]; duplicates: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: (f: File) => reports.uploadCsv(f),
    onSuccess: (data) => {
      setPreview(data);
      setStep(2);
    },
  });

  const importMutation = useMutation({
    mutationFn: (rows: any[]) => reports.importValidated(rows),
    onSuccess: (data) => {
      setImportResult(data);
      setStep(5);
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xls', 'xlsx'].includes(ext)) {
      alert('Please upload a CSV or Excel file (.csv, .xls, .xlsx).');
      return;
    }
    setFile(f);
    setStep(1);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const handleImport = () => {
    if (!preview?.valid) return;
    importMutation.mutate(preview.valid);
  };

  const reset = () => {
    setStep(0);
    setFile(null);
    setPreview(null);
    setImportResult(null);
  };

  return (
    <div className="page">
      {/* Step Progress */}
      <div className="wizard-progress">
        {STEPS.map((s, i) => (
          <div key={s} className={`wz-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
            <span>{i < step ? <CheckCircle size={14} /> : i + 1}</span>
            <strong>{s}</strong>
            {i < STEPS.length - 1 && <div className="wz-line" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0 – Drop Zone */}
        {step === 0 && (
          <motion.div key="step0" className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="panel-header">
              <h3>Upload File (CSV or Excel)</h3>
              <span>Accepts spontaneous ADR reports in CSV or Excel (.xlsx/.xls) format</span>
            </div>
            <div
              className={`drop-zone ${dragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <UploadCloud size={40} />
              <strong>Drag & drop your CSV or Excel file here</strong>
              <span>or click to browse files</span>
              <label className="btn-primary upload-btn">
                Browse Files
                <input type="file" accept=".csv, .xls, .xlsx" onChange={handleInputChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div className="panel" style={{ marginTop: '1rem' }}>
              <h4>Expected CSV Columns</h4>
              <div className="column-grid">
                {['patient_age', 'patient_age_unit', 'patient_gender', 'drug_name', 'reaction_term',
                  'severity', 'seriousness', 'reporter_type', 'report_date', 'country'].map((col) => (
                  <span key={col} className="col-chip">{col}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <a href="/api/reports/sample-csv" className="btn-link">
                  <Download size={14} /> Download Sample CSV
                </a>
                <a href="/api/reports/sample-excel" className="btn-link">
                  <Download size={14} /> Download Sample Excel
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 1 – Confirm */}
        {step === 1 && (
          <motion.div key="step1" className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="panel-header">
              <h3>File Selected</h3>
              <span>Ready to parse and validate</span>
            </div>
            <div className="file-info">
              <FileText size={32} />
              <div>
                <strong>{file?.name}</strong>
                <span>{file ? `${(file.size / 1024).toFixed(1)} KB` : ''}</span>
              </div>
            </div>
            <div className="action-row">
              <button className="btn-secondary" onClick={reset}>Cancel</button>
              <button className="btn-primary" onClick={handleUpload} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
                {uploadMutation.isPending ? 'Parsing…' : 'Parse & Validate'}
              </button>
            </div>
            {uploadMutation.isError && (
              <div className="alert alert-error">
                <XCircle size={15} /> {(uploadMutation.error as Error).message}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2 – Preview */}
        {step === 2 && preview && (
          <motion.div key="step2" className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="panel-header row">
              <div>
                <h3>Validation Preview</h3>
                <span>Review parsed results before importing</span>
              </div>
              <div className="stat-pills">
                <span className="pill green"><CheckCircle size={13} /> {preview.valid.length} valid</span>
                <span className="pill red"><XCircle size={13} /> {preview.invalid.length} invalid</span>
                <span className="pill amber"><AlertTriangle size={13} /> {preview.duplicates} duplicates</span>
              </div>
            </div>

            {preview.valid.length > 0 && (
              <>
                <h4>Preview (first 5 rows)</h4>
                <div className="csv-preview">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(preview.valid[0]).slice(0, 8).map((k) => (
                          <th key={k}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.valid.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).slice(0, 8).map((v, j) => (
                            <td key={j}>{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {preview.invalid.length > 0 && (
              <>
                <h4>Invalid Rows</h4>
                <div className="invalid-list">
                  {preview.invalid.slice(0, 5).map((err: any, i: number) => (
                    <div key={i} className="invalid-row">
                      <XCircle size={13} /> Row {err.row}: {err.errors?.join(', ')}
                    </div>
                  ))}
                  {preview.invalid.length > 5 && (
                    <span>… and {preview.invalid.length - 5} more invalid rows</span>
                  )}
                </div>
              </>
            )}

            <div className="action-row">
              <button className="btn-secondary" onClick={reset}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleImport}
                disabled={importMutation.isPending || preview.valid.length === 0}
              >
                {importMutation.isPending ? <Loader2 size={16} className="spin" /> : <UploadCloud size={16} />}
                {importMutation.isPending ? 'Importing…' : `Import ${preview.valid.length} Records`}
              </button>
            </div>
            {importMutation.isError && (
              <div className="alert alert-error">
                <XCircle size={15} /> {(importMutation.error as Error).message}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 5 – Done */}
        {step === 5 && importResult && (
          <motion.div key="step5" className="panel success-panel" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckCircle size={56} className="success-icon" />
            <h2>Import Successful!</h2>
            <p>{importResult.imported} records imported. {importResult.skipped} skipped. Signals have been recalculated.</p>
            <button className="btn-primary" onClick={reset}>Import Another File</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
