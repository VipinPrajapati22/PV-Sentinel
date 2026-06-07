import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Filter, Activity, RefreshCw, ChevronLeft, ChevronRight,
  AlertTriangle, TrendingUp, Eye
} from 'lucide-react';
import { signals } from '../lib/api';
import SignalDetailModal from '../components/SignalDetailModal';

const STRENGTH_BADGE: Record<string, string> = {
  Strong: 'badge-red',
  Moderate: 'badge-amber',
  Weak: 'badge-blue',
  'No Signal': 'badge-gray',
};

const STATUS_BADGE: Record<string, string> = {
  'Safety Review': 'badge-red',
  'Medical Review': 'badge-amber',
  Triaged: 'badge-indigo',
  'Under Review': 'badge-blue',
  Closed: 'badge-gray',
  Detected: 'badge-purple',
};

export default function SignalsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [strength, setStrength] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['signals', page, search, strength, status],
    queryFn: () => signals.list({ page, limit: 15, search, strength, status }),
    staleTime: 30_000,
  });

  const reanalyzeMutation = useMutation({
    mutationFn: () => signals.reanalyze(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signals'] });
      qc.invalidateQueries({ queryKey: ['top-signals'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      alert('Signal reanalysis complete!');
    },
  });

  const signalList: any[] = data?.signals || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  // Return an array of page numbers to display centered around the current page
  const getPageRange = (current: number, total: number, maxButtons = 7) => {
    if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="page">
      {/* Toolbar */}
      <div className="page-toolbar">
        <div className="search-bar">
          <Search size={16} />
          <input
            placeholder="Search drug or reaction…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-group">
          <Filter size={15} />
          <select value={strength} onChange={(e) => { setStrength(e.target.value); setPage(1); }}>
            <option value="">All Strength</option>
            <option>Strong</option>
            <option>Moderate</option>
            <option>Weak</option>
            <option>No Signal</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option>Detected</option>
            <option>Under Review</option>
            <option>Medical Review</option>
            <option>Safety Review</option>
            <option>Triaged</option>
            <option>Closed</option>
          </select>
        </div>
        <button
          className="btn-primary"
          onClick={() => reanalyzeMutation.mutate()}
          disabled={reanalyzeMutation.isPending}
        >
          <RefreshCw size={15} className={reanalyzeMutation.isPending ? 'spin' : ''} />
          {reanalyzeMutation.isPending ? 'Running…' : 'Reanalyze'}
        </button>
      </div>

      {/* Summary Chips */}
      <div className="mini-stats">
        <span>Total: <strong>{pagination.total}</strong> signals</span>
        <span className="pill red"><AlertTriangle size={12} /> Strong signals require immediate review</span>
      </div>

      {/* Signals Table */}
      <div className="panel">
        {isLoading ? (
          <div className="table-empty"><span className="spinner-sm" /> Loading signals…</div>
        ) : signalList.length === 0 ? (
          <div className="table-empty">
            <Activity size={36} />
            <p>No signals detected. Upload ADR data and click Reanalyze.</p>
          </div>
        ) : (
          <div className="data-table">
            <div className="dt-head signals-head">
              <span>Drug</span>
              <span>Reaction (PT)</span>
              <span>Cases</span>
              <span>PRR</span>
              <span>ROR</span>
              <span>IC</span>
              <span>Chi²</span>
              <span>Score</span>
              <span>Strength</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {signalList.map((sig: any) => (
              <motion.div
                key={sig.id}
                className="dt-row signals-row"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ backgroundColor: '#f8fafc' }}
              >
                <strong>{sig.drug?.genericName || sig.drug?.brandName}</strong>
                <span>{sig.reactionPtName}</span>
                <span>{sig.caseCount}</span>
                <span className={sig.prr >= 2 ? 'text-red' : ''}>{sig.prr?.toFixed(2) ?? '—'}</span>
                <span className={sig.ror >= 2 ? 'text-red' : ''}>{sig.ror?.toFixed(2) ?? '—'}</span>
                <span>{sig.informationComponent?.toFixed(2) ?? '—'}</span>
                <span className={sig.chiSquare >= 3.84 ? 'text-amber' : ''}>{sig.chiSquare?.toFixed(1) ?? '—'}</span>
                <strong>{sig.signalScore?.toFixed(1) ?? '—'}</strong>
                <span className={`badge ${STRENGTH_BADGE[sig.strength] || 'badge-gray'}`}>{sig.strength}</span>
                <span className={`badge ${STATUS_BADGE[sig.status] || 'badge-gray'}`}>{sig.status}</span>
                <button
                  className="btn-icon"
                  onClick={() => setSelectedId(sig.id)}
                  title="View signal detail"
                >
                  <Eye size={15} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="btn-secondary icon-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </button>

            {/* first page + leading ellipsis when needed */}
            {(() => {
              const pages = getPageRange(page, pagination.totalPages, 7);
              const first = pages[0];
              const last = pages[pages.length - 1];
              const elems: any[] = [];
              if (first > 1) {
                elems.push(
                  <button key={1} className={`page-btn ${page === 1 ? 'active' : ''}`} onClick={() => setPage(1)}>1</button>
                );
                if (first > 2) elems.push(<span key="lead-ellipsis" className="ellipsis">…</span>);
              }

              pages.forEach((pNum) => {
                elems.push(
                  <button key={pNum} className={`page-btn ${page === pNum ? 'active' : ''}`} onClick={() => setPage(pNum)}>
                    {pNum}
                  </button>
                );
              });

              if (last < pagination.totalPages) {
                if (last < pagination.totalPages - 1) elems.push(<span key="trail-ellipsis" className="ellipsis">…</span>);
                elems.push(
                  <button key={pagination.totalPages} className={`page-btn ${page === pagination.totalPages ? 'active' : ''}`} onClick={() => setPage(pagination.totalPages)}>
                    {pagination.totalPages}
                  </button>
                );
              }

              return elems;
            })()}

            <button className="btn-secondary icon-btn" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
              <ChevronRight size={16} />
            </button>

            <div style={{ marginLeft: 12, fontSize: 13, color: '#64748b' }}>
              Page {pagination.page} of {pagination.totalPages} — Showing {signalList.length} of {pagination.total} signals
            </div>
          </div>
        )}
      </div>

      {/* Evans Criteria Info */}
      <div className="panel info-panel">
        <div className="panel-header">
          <h3><TrendingUp size={16} /> Evans Criteria for Signal Detection</h3>
        </div>
        <div className="criteria-grid">
          <div className="criterion"><strong>PRR ≥ 2.0</strong><span>Proportional Reporting Ratio threshold</span></div>
          <div className="criterion"><strong>Chi² ≥ 3.84</strong><span>Statistical significance cutoff (p &lt; 0.05)</span></div>
          <div className="criterion"><strong>Cases ≥ 3</strong><span>Minimum case count requirement</span></div>
          <div className="criterion"><strong>PRR 95% CI lower &gt; 1.0</strong><span>Confidence interval requirement (Evans)</span></div>
        </div>
      </div>

      {selectedId && (
        <SignalDetailModal signalId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
