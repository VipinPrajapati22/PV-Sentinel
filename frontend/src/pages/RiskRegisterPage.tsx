import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Shield, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { risks } from '../lib/api';

const RISK_LEVEL_BADGE: Record<string, string> = {
  Critical: 'badge-red',
  High: 'badge-amber',
  Medium: 'badge-blue',
  Low: 'badge-green',
};

const STATUS_BADGE: Record<string, string> = {
  Open: 'badge-red',
  'In Progress': 'badge-amber',
  Resolved: 'badge-green',
  Closed: 'badge-gray',
};

export default function RiskRegisterPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [riskLevel, setRiskLevel] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', riskLevel: 'Medium', mitigationPlan: '',
    targetDate: '', status: 'Open', signalId: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['risks', page, riskLevel],
    queryFn: () => risks.list({ page, limit: 12, riskLevel }),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => risks.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risks'] });
      setShowForm(false);
      setForm({ title: '', description: '', riskLevel: 'Medium', mitigationPlan: '', targetDate: '', status: 'Open', signalId: '' });
    },
  });

  const riskList: any[] = data?.risks || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="page">
      <div className="page-toolbar">
        <div className="filter-group">
          <Filter size={15} />
          <select value={riskLevel} onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}>
            <option value="">All Risk Levels</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Risk Item'}
        </button>
      </div>

      {/* New Risk Form */}
      {showForm && (
        <motion.div className="panel" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="panel-header"><h3>New Risk Register Entry</h3></div>
          <form onSubmit={handleSubmit} className="risk-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Warfarin bleeding risk" />
              </div>
              <div className="form-group">
                <label>Risk Level *</label>
                <select value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Describe the risk in detail…" />
            </div>
            <div className="form-group">
              <label>Mitigation Plan (CAPA)</label>
              <textarea value={form.mitigationPlan} onChange={(e) => setForm({ ...form, mitigationPlan: e.target.value })} rows={2} placeholder="Corrective and preventive actions…" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Target Resolution Date</label>
                <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>
            </div>
            <div className="action-row">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Save Risk Item'}
              </button>
            </div>
            {createMutation.isError && (
              <div className="alert alert-error">{(createMutation.error as Error).message}</div>
            )}
          </form>
        </motion.div>
      )}

      {/* Risk Table */}
      <div className="panel">
        <div className="panel-header row">
          <div>
            <h3>Risk Register</h3>
            <span>CAPA tracking for identified safety signals</span>
          </div>
          <span className="mini-stat">Total: <strong>{pagination.total}</strong></span>
        </div>
        {isLoading ? (
          <div className="table-empty"><span className="spinner-sm" /> Loading…</div>
        ) : riskList.length === 0 ? (
          <div className="table-empty">
            <Shield size={36} />
            <p>No risk items found. Create your first risk register entry.</p>
          </div>
        ) : (
          <div className="data-table">
            <div className="dt-head risk-head">
              <span>Title</span>
              <span>Risk Level</span>
              <span>Status</span>
              <span>Mitigation Plan</span>
              <span>Target Date</span>
              <span>Owner</span>
              <span>Created</span>
            </div>
            {riskList.map((r: any) => (
              <motion.div key={r.id} className="dt-row risk-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <strong>
                  {r.title}
                  {r.description && <small title={r.description}>{r.description.slice(0, 60)}…</small>}
                </strong>
                <span className={`badge ${RISK_LEVEL_BADGE[r.riskLevel] || 'badge-gray'}`}>{r.riskLevel}</span>
                <span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{r.status}</span>
                <span className="truncate">{r.mitigationPlan || '—'}</span>
                <span>{r.targetDate ? new Date(r.targetDate).toLocaleDateString() : '—'}</span>
                <span>{r.owner ? `${r.owner.firstName} ${r.owner.lastName}` : '—'}</span>
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              </motion.div>
            ))}
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="btn-secondary icon-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => (
              <button key={i + 1} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="btn-secondary icon-btn" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
