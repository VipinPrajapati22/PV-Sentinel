import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Brain } from 'lucide-react';
import { reports } from '../lib/api';

interface Props {
  onClose: () => void;
}

const REACTION_OPTIONS = [
  'Nausea', 'Vomiting', 'Headache', 'Dizziness', 'Rash', 'Pruritus',
  'Dyspnoea', 'Chest pain', 'Palpitations', 'Hypotension', 'Hypertension',
  'Bradycardia', 'Tachycardia', 'Hepatotoxicity', 'Nephrotoxicity',
  'Anaphylaxis', 'Angioedema', 'Myalgia', 'Arthralgia', 'Fatigue',
  'Insomnia', 'Tremor', 'Convulsion', 'Depression', 'Anxiety',
  'GI haemorrhage', 'Acute kidney injury', 'Hypoglycaemia', 'Thrombocytopenia',
];

export default function NewReportModal({ onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    patientAge: '',
    patientAgeUnit: 'Years',
    patientGender: 'Male',
    drugName: '',
    reactionTerm: '',
    severity: 'Moderate',
    seriousness: 'Non-serious',
    reporterType: 'Healthcare Professional',
    reportDate: new Date().toISOString().split('T')[0],
    country: 'India',
    notes: '',
  });
  const [causalityResult, setCausalityResult] = useState<any>(null);
  const [reactionInput, setReactionInput] = useState('');
  const [drugInput, setDrugInput] = useState('');
  const [drugOptions, setDrugOptions] = useState<any[]>([]);
  const [reactionOptions, setReactionOptions] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: (body: any) => reports.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onClose();
    },
  });

  const causalityMutation = useMutation({
    mutationFn: () => reports.assessCausality({
      drugName: form.drugName,
      reactionTerm: form.reactionTerm,
      severity: form.severity,
      seriousness: form.seriousness,
      patientAge: Number(form.patientAge),
      ageUnit: form.patientAgeUnit,
    }),
    onSuccess: (data) => setCausalityResult(data),
  });

  const handleDrugSearch = async (q: string) => {
    setDrugInput(q);
    if (q.length < 2) { setDrugOptions([]); return; }
    try {
      const res = await reports.drugsAutocomplete(q);
      setDrugOptions(res || []);
    } catch { setDrugOptions([]); }
  };

  const handleReactionSearch = (q: string) => {
    setReactionInput(q);
    if (q.length < 2) { setReactionOptions([]); return; }
    const matches = REACTION_OPTIONS.filter((r) => r.toLowerCase().includes(q.toLowerCase()));
    setReactionOptions(matches.slice(0, 8));
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <h3>New ADR Report</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <h4 className="form-section-title">Patient Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Age *</label>
              <input type="number" min="0" max="130" value={form.patientAge} onChange={(e) => set('patientAge', e.target.value)} required placeholder="e.g. 45" />
            </div>
            <div className="form-group">
              <label>Age Unit</label>
              <select value={form.patientAgeUnit} onChange={(e) => set('patientAgeUnit', e.target.value)}>
                <option>Years</option><option>Months</option><option>Weeks</option><option>Days</option>
              </select>
            </div>
            <div className="form-group">
              <label>Gender *</label>
              <select value={form.patientGender} onChange={(e) => set('patientGender', e.target.value)}>
                <option>Male</option><option>Female</option><option>Unknown</option><option>Other</option>
              </select>
            </div>
          </div>

          <h4 className="form-section-title">Suspected Drug</h4>
          <div className="form-group autocomplete-group">
            <label>Drug Name (Generic) *</label>
            <input
              value={drugInput || form.drugName}
              onChange={(e) => handleDrugSearch(e.target.value)}
              required
              placeholder="Start typing drug name…"
            />
            {drugOptions.length > 0 && (
              <ul className="autocomplete-list">
                {drugOptions.map((d: any) => (
                  <li key={d.id || d.genericName} onClick={() => {
                    set('drugName', d.genericName || d.name);
                    setDrugInput(d.genericName || d.name);
                    setDrugOptions([]);
                  }}>
                    <strong>{d.genericName || d.name}</strong>
                    {d.brandName && <small> — {d.brandName}</small>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h4 className="form-section-title">Adverse Reaction</h4>
          <div className="form-group autocomplete-group">
            <label>Reaction Term (MedDRA PT) *</label>
            <input
              value={reactionInput || form.reactionTerm}
              onChange={(e) => handleReactionSearch(e.target.value)}
              required
              placeholder="Start typing reaction term…"
            />
            {reactionOptions.length > 0 && (
              <ul className="autocomplete-list">
                {reactionOptions.map((r) => (
                  <li key={r} onClick={() => {
                    set('reactionTerm', r);
                    setReactionInput(r);
                    setReactionOptions([]);
                  }}>{r}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Severity *</label>
              <select value={form.severity} onChange={(e) => set('severity', e.target.value)}>
                <option>Mild</option><option>Moderate</option><option>Severe</option>
                <option>Life-threatening</option><option>Fatal</option>
              </select>
            </div>
            <div className="form-group">
              <label>Seriousness</label>
              <select value={form.seriousness} onChange={(e) => set('seriousness', e.target.value)}>
                <option>Non-serious</option><option>Serious</option>
              </select>
            </div>
          </div>

          <h4 className="form-section-title">Reporter Details</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Reporter Type</label>
              <select value={form.reporterType} onChange={(e) => set('reporterType', e.target.value)}>
                <option>Healthcare Professional</option>
                <option>Consumer/Patient</option>
                <option>Manufacturer</option>
                <option>Regulatory Authority</option>
                <option>Literature</option>
              </select>
            </div>
            <div className="form-group">
              <label>Report Date</label>
              <input type="date" value={form.reportDate} onChange={(e) => set('reportDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="e.g. India" />
            </div>
          </div>

          <div className="form-group">
            <label>Clinical Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Additional clinical context…" />
          </div>

          {/* WHO-UMC Causality Assessment */}
          {form.drugName && form.reactionTerm && (
            <div className="causality-panel">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => causalityMutation.mutate()}
                disabled={causalityMutation.isPending}
              >
                <Brain size={15} /> {causalityMutation.isPending ? 'Assessing…' : 'Assess WHO-UMC Causality'}
              </button>
              {causalityResult && (
                <div className="causality-result">
                  <strong>{causalityResult.category}</strong>
                  <span>{causalityResult.rationale}</span>
                  <span className="causality-score">Confidence: {causalityResult.confidence}%</span>
                </div>
              )}
            </div>
          )}

          {createMutation.isError && (
            <div className="alert alert-error">{(createMutation.error as Error).message}</div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 size={15} className="spin" /> : null}
              {createMutation.isPending ? 'Submitting…' : 'Submit ADR Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
