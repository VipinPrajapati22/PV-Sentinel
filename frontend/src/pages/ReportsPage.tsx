import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Filter, FileText, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { reports } from '../lib/api';
import NewReportModal from '../components/NewReportModal';

const SEVERITY_BADGE: Record<string, string> = {
  Mild: 'badge-green',
  Moderate: 'badge-blue',
  Severe: 'badge-amber',
  'Life-threatening': 'badge-red',
  Fatal: 'badge-purple',
};

const CAUSALITY_BADGE: Record<string, string> = {
  Certain: 'badge-red',
  Probable: 'badge-amber',
  Possible: 'badge-blue',
  Unlikely: 'badge-gray',
  Unclassified: 'badge-gray',
  Unassessable: 'badge-gray',
};

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [causality, setCausality] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', page, search, severity, causality],
    queryFn: () => reports.list({ page, limit: 15, search, severity, causality }),
    staleTime: 30_000,
  });

  const reportList: any[] = data?.reports || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  return (
    <div className="page">
      {/* Toolbar */}
      <div className="page-toolbar">
        <form onSubmit={handleSearch} className="search-bar">
          <Search size={16} />
          <input
            placeholder="Search drug, reaction, reporter…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className="filter-group">
          <Filter size={15} />
          <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
            <option value="">All Severity</option>
            <option>Mild</option>
            <option>Moderate</option>
            <option>Severe</option>
            <option>Life-threatening</option>
            <option>Fatal</option>
          </select>
          <select value={causality} onChange={(e) => { setCausality(e.target.value); setPage(1); }}>
            <option value="">All Causality</option>
            <option>Certain</option>
            <option>Probable</option>
            <option>Possible</option>
            <option>Unlikely</option>
            <option>Unclassified</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New ADR Report
        </button>
      </div>

      {/* Stats Row */}
      <div className="mini-stats">
        <span>Total: <strong>{pagination.total}</strong> reports</span>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
      </div>

      {/* Table */}
      <div className="panel">
        {isLoading ? (
          <div className="table-empty"><span className="spinner-sm" /> Loading reports…</div>
        ) : reportList.length === 0 ? (
          <div className="table-empty">
            <FileText size={36} />
            <p>No reports found. Try adjusting your filters or upload a CSV.</p>
          </div>
        ) : (
          <div className="data-table">
            <div className="dt-head reports-head">
              <span>Report Date</span>
              <span>Drug</span>
              <span>Reaction (PT)</span>
              <span>Patient</span>
              <span>Severity</span>
              <span>Seriousness</span>
              <span>Causality</span>
              <span>Reporter</span>
            </div>
            {reportList.map((r: any) => (
              <motion.div
                key={r.id}
                className="dt-row reports-row"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ backgroundColor: '#f8fafc' }}
              >
                <span>{new Date(r.reportDate).toLocaleDateString()}</span>
                <strong>
                  {r.suspectedDrug?.genericName || r.suspectedDrug?.brandName}
                  {r.suspectedDrug?.brandName && r.suspectedDrug?.genericName && (
                    <small>{r.suspectedDrug.brandName}</small>
                  )}
                </strong>
                <span>{r.reactionTerminology?.ptName || r.reactionTerminology?.lltName || '—'}</span>
                <span>
                  {r.patient?.age}{r.patient?.ageUnit === 'Years' ? 'y' : r.patient?.ageUnit?.[0]?.toLowerCase() || ''}
                  {' '}{r.patient?.gender}
                </span>
                <span className={`badge ${SEVERITY_BADGE[r.severity] || 'badge-gray'}`}>{r.severity}</span>
                <span className={`badge ${r.seriousness === 'Serious' ? 'badge-red' : 'badge-gray'}`}>{r.seriousness}</span>
                <span className={`badge ${CAUSALITY_BADGE[r.causalityAssessment] || 'badge-gray'}`}>{r.causalityAssessment}</span>
                <span>{r.reporterType}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn-secondary icon-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`page-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn-secondary icon-btn"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {showModal && <NewReportModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
