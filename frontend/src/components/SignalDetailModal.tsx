import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Activity, BarChart2, Clock, User, AlertTriangle,
  Brain, FileText, ChevronDown, ChevronUp, CheckCircle
} from 'lucide-react';
import { signals } from '../lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Props {
  signalId: string;
  onClose: () => void;
}

const SIGNAL_STATUSES = ['Detected', 'Under Review', 'Medical Review', 'Safety Review', 'Triaged', 'Closed'];

const SEVERITY_COLORS: Record<string, string> = {
  Mild: '#14b8a6', Moderate: '#3a6081', Severe: '#f59e0b',
  'Life-threatening': '#e11d48', Fatal: '#7c3aed',
};

export default function SignalDetailModal({ signalId, onClose }: Props) {
  const qc = useQueryClient();
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('stats');

  const { data, isLoading } = useQuery({
    queryKey: ['signal', signalId],
    queryFn: () => signals.get(signalId),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes: string }) =>
      signals.updateStatus(signalId, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signal', signalId] });
      qc.invalidateQueries({ queryKey: ['signals'] });
      qc.invalidateQueries({ queryKey: ['top-signals'] });
      setShowStatusForm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="modal-box" style={{ maxWidth: '900px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="spinner" />
        </div>
      </div>
    );
  }

  const sig = data?.signal;
  const demographics = data?.demographics || {};
  const timeline: any[] = data?.timeline || [];
  const expert = data?.expertAnalysis || {};
  const histories: any[] = data?.histories || [];
  const casesCount: number = data?.casesCount || 0;

  if (!sig) return null;

  const severityData = Object.entries(demographics.severityDist || {}).map(([name, value]) => ({
    name, value, fill: SEVERITY_COLORS[name] || '#64748b'
  }));

  const genderData = Object.entries(demographics.genderDist || {}).map(([name, value]) => ({ name, value }));

  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div>
            <h3>Signal Detail: {sig.drug?.genericName} / {sig.reactionPtName}</h3>
            <span className="signal-meta">
              {casesCount} cases · {sig.strength} signal · {sig.status}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Stats Grid */}
        <div className="signal-stat-grid">
          {[
            { label: 'PRR', value: sig.prr?.toFixed(3), note: '≥2.0 threshold' },
            { label: 'ROR', value: sig.ror?.toFixed(3), note: '95% CI (PRR/ROR)' },
            { label: 'IC', value: sig.informationComponent?.toFixed(3), note: 'IC point estimate — positive if > 0.0' },
            { label: 'Chi²', value: sig.chiSquare?.toFixed(2), note: '≥3.84 threshold (p < 0.05)' },
            { label: 'CI Lower', value: sig.ciLower?.toFixed(3), note: 'PRR 95% CI lower limit' },
            { label: 'CI Upper', value: sig.ciUpper?.toFixed(3), note: 'PRR 95% CI upper limit' },
            { label: 'Signal Score', value: sig.signalScore?.toFixed(1), note: 'Composite metric' },
            { label: 'Cases', value: casesCount, note: 'Contributing reports' },
          ].map(({ label, value, note }) => (
            <div key={label} className="signal-stat-card">
              <span>{label}</span>
              <strong>{value ?? '—'}</strong>
              <small>{note}</small>
            </div>
          ))}
        </div>

        {/* Expert Analysis */}
        <section className="detail-section">
          <button className="section-toggle" onClick={() => toggle('expert')}>
            <Brain size={16} /> Expert Intelligence Analysis
            {expandedSection === 'expert' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {expandedSection === 'expert' && (
            <div className="section-body">
              {expert.statsInterpretation && (
                <div className="expert-block">
                  <h4>Statistical Interpretation</h4>
                  <p>{expert.statsInterpretation}</p>
                </div>
              )}
              {expert.riskAssessment && (
                <div className="expert-block">
                  <h4>Risk Assessment</h4>
                  <p>{expert.riskAssessment}</p>
                </div>
              )}
              {expert.executiveSummary && (
                <div className="expert-block">
                  <h4>Executive Summary</h4>
                  <p>{expert.executiveSummary}</p>
                </div>
              )}
              {expert.capaRecommendations?.length > 0 && (
                <div className="expert-block">
                  <h4>CAPA Recommendations</h4>
                  <ul>
                    {expert.capaRecommendations.map((r: string, i: number) => (
                      <li key={i}><CheckCircle size={13} /> {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Timeline Chart */}
        {timeline.length > 0 && (
          <section className="detail-section">
            <button className="section-toggle" onClick={() => toggle('timeline')}>
              <BarChart2 size={16} /> Case Timeline
              {expandedSection === 'timeline' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {expandedSection === 'timeline' && (
              <div className="section-body">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area dataKey="count" name="Cases" stroke="#0d9488" fill="#ccfbf1" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {/* Demographics */}
        {severityData.length > 0 && (
          <section className="detail-section">
            <button className="section-toggle" onClick={() => toggle('demographics')}>
              <User size={16} /> Demographics
              {expandedSection === 'demographics' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {expandedSection === 'demographics' && (
              <div className="section-body demo-grid">
                <div>
                  <h4>Severity Distribution</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                        {severityData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4>Gender Distribution</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={genderData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Status Update */}
        <section className="detail-section">
          <button className="section-toggle" onClick={() => toggle('status')}>
            <Activity size={16} /> Update Review Status
            {expandedSection === 'status' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {expandedSection === 'status' && (
            <div className="section-body">
              <div className="form-row">
                <div className="form-group">
                  <label>New Status</label>
                  <select value={statusForm.status} onChange={(e) => setStatusForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="">Select…</option>
                    {SIGNAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Review Notes</label>
                  <input value={statusForm.notes} onChange={(e) => setStatusForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Enter rationale…" />
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={() => updateMutation.mutate(statusForm)}
                disabled={updateMutation.isPending || !statusForm.status}
              >
                {updateMutation.isPending ? 'Updating…' : 'Update Status'}
              </button>
            </div>
          )}
        </section>

        {/* Audit History */}
        {histories.length > 0 && (
          <section className="detail-section">
            <button className="section-toggle" onClick={() => toggle('history')}>
              <Clock size={16} /> Review History ({histories.length})
              {expandedSection === 'history' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {expandedSection === 'history' && (
              <div className="section-body">
                {histories.map((h: any) => (
                  <div key={h.id} className="history-item">
                    <span className="hist-time">{new Date(h.changedAt).toLocaleString()}</span>
                    <span className="hist-change">
                      <strong>{h.previousStatus}</strong> → <strong>{h.newStatus}</strong>
                    </span>
                    <span className="hist-user">{h.user?.firstName} {h.user?.lastName}</span>
                    {h.notes && <span className="hist-notes">{h.notes}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
