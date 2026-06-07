import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Database, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { audits } from '../lib/api';

export default function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audits', page, search],
    queryFn: () => audits.list({ page, limit: 20, search }),
    staleTime: 30_000,
  });

  const logs: any[] = data?.logs || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const ACTION_COLOR: Record<string, string> = {
    Login: '#14b8a6',
    'Create Report': '#3b82f6',
    'Update Signal Status': '#f59e0b',
    'Manual Signal Detection Reanalysis': '#e11d48',
    'Create Risk Register': '#8b5cf6',
    'Export Data': '#0d9488',
  };

  return (
    <div className="page">
      <div className="page-toolbar">
        <div className="search-bar">
          <Search size={16} />
          <input
            placeholder="Search action, user, resource…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-header row">
          <div>
            <h3>Audit Trail</h3>
            <span>Full immutable log of all platform actions</span>
          </div>
          <Database size={20} />
        </div>

        <div className="mini-stats">
          <span>Total: <strong>{pagination.total}</strong> audit events</span>
        </div>

        {isLoading ? (
          <div className="table-empty"><span className="spinner-sm" /> Loading audit trail…</div>
        ) : logs.length === 0 ? (
          <div className="table-empty">
            <Database size={36} />
            <p>No audit events found.</p>
          </div>
        ) : (
          <div className="data-table">
            <div className="dt-head audit-head">
              <span>Timestamp</span>
              <span>User</span>
              <span>Action</span>
              <span>Resource</span>
              <span>Details</span>
              <span>IP</span>
            </div>
            {logs.map((log: any) => (
              <motion.div key={log.id} className="dt-row audit-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="mono">{new Date(log.createdAt).toLocaleString()}</span>
                <span>
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : '—'}
                  {log.user && <small>{log.user.email}</small>}
                </span>
                <span>
                  <span
                    className="action-dot"
                    style={{ backgroundColor: ACTION_COLOR[log.action] || '#64748b' }}
                  />
                  {log.action}
                </span>
                <span>
                  <span className="badge badge-gray">{log.resource}</span>
                </span>
                <span className="audit-detail">{log.details}</span>
                <span className="mono">{log.ipAddress || '—'}</span>
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
