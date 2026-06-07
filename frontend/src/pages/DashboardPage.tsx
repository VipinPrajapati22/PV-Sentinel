import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, FileSpreadsheet, HeartPulse,
  ClipboardCheck, TrendingUp, Users, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { exports_, signals } from '../lib/api';

const SEVERITY_COLORS: Record<string, string> = {
  Mild: '#14b8a6',
  Moderate: '#3a6081',
  Severe: '#f59e0b',
  'Life-threatening': '#e11d48',
  Fatal: '#7c3aed',
};

const SIGNAL_COLORS: Record<string, string> = {
  Strong: '#e11d48',
  Moderate: '#f59e0b',
  Weak: '#14b8a6',
  'No Signal': '#94a3b8',
};

const STATUS_BADGE: Record<string, string> = {
  'Safety Review': 'badge-red',
  'Medical Review': 'badge-amber',
  Triaged: 'badge-indigo',
  'Under Review': 'badge-blue',
  Closed: 'badge-gray',
  Detected: 'badge-purple',
};

export default function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => exports_.dashboard(),
    staleTime: 60_000,
  });

  const { data: topSignalsData, isLoading: sigLoading } = useQuery({
    queryKey: ['top-signals'],
    queryFn: () => signals.top(),
    staleTime: 60_000,
  });

  const stats = statsData?.stats || {};
  const charts = statsData?.charts || {};
  const topSignals: any[] = topSignalsData || [];

  const kpis = [
    { label: 'Total ADR Reports', value: stats.totalReports ?? '—', delta: stats.reportsThisMonth ? `+${stats.reportsThisMonth} this month` : '', icon: FileSpreadsheet, tone: 'teal' },
    { label: 'Strong Signals', value: stats.strongSignals ?? '—', delta: 'Evans criteria met', icon: AlertTriangle, tone: 'rose' },
    { label: 'Serious Cases', value: stats.seriousCases ?? '—', delta: 'SAE classified', icon: HeartPulse, tone: 'amber' },
    { label: 'Under Review', value: stats.underReview ?? '—', delta: 'Pending assessment', icon: ClipboardCheck, tone: 'indigo' },
  ];

  const severityChartData = Object.entries(stats.severityDistribution || {}).map(([name, value]) => ({
    name, value, color: SEVERITY_COLORS[name] || '#64748b'
  }));

  const signalChartData = Object.entries(stats.signalStrengthDistribution || {}).map(([name, value]) => ({
    name, value, fill: SIGNAL_COLORS[name] || '#64748b'
  }));

  const trendData: any[] = charts.monthlyTrend || [
    { month: 'Jan', reports: 0, signals: 0 },
  ];

  const riskRadar = [
    { factor: 'Severity', value: stats.riskScore?.severity || 0 },
    { factor: 'Frequency', value: stats.riskScore?.frequency || 0 },
    { factor: 'Causality', value: stats.riskScore?.causality || 0 },
    { factor: 'Detectability', value: stats.riskScore?.detectability || 0 },
    { factor: 'Regulatory', value: stats.riskScore?.regulatory || 0 },
    { factor: 'CAPA', value: stats.riskScore?.capa || 0 },
  ];

  if (statsLoading && sigLoading) {
    return <div className="page-loading"><span className="spinner" /> Loading dashboard…</div>;
  }

  return (
    <div className="page">
      {/* KPI Grid */}
      <section className="kpi-grid">
        {kpis.map(({ label, value, delta, icon: Icon, tone }, i) => (
          <motion.article
            key={label}
            className={`kpi ${tone}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3 }}
          >
            <Icon size={22} />
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
            <em>{delta}</em>
          </motion.article>
        ))}
      </section>

      {/* Analytics Charts */}
      <section className="analytics-grid">
        {/* Trend */}
        <article className="panel span-2">
          <div className="panel-header">
            <h3>Monthly ADR Trend</h3>
            <span>Reports submitted and signals detected over time</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="grad-reports" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area dataKey="reports" name="Reports" stroke="#0d9488" fill="url(#grad-reports)" strokeWidth={2} />
              <Area dataKey="signals" name="Signals" stroke="#e11d48" fill="none" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        {/* Severity Pie */}
        <article className="panel">
          <div className="panel-header">
            <h3>Severity Distribution</h3>
            <span>Case severity classification</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={severityChartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3}>
                {severityChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>

        {/* Signal Strength Bar */}
        <article className="panel">
          <div className="panel-header">
            <h3>Signal Strength</h3>
            <span>Evans criteria classification</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={signalChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Signals" radius={[5, 5, 0, 0]}>
                {signalChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>

        {/* Risk Radar */}
        <article className="panel">
          <div className="panel-header">
            <h3>Risk Radar</h3>
            <span>Composite signal review profile</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={riskRadar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar dataKey="value" stroke="#3a6081" fill="#14b8a6" fillOpacity={0.35} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </article>
      </section>

      {/* Top Signals Table */}
      <section className="panel">
        <div className="panel-header row">
          <div>
            <h3>Top Signal Prioritization</h3>
            <span>Ranked by composite score, not PRR alone</span>
          </div>
          <button
            className="secondary-action"
            onClick={() => signals.reanalyze()}
            title="Trigger signal reanalysis"
          >
            <RefreshCw size={15} /> Reanalyze
          </button>
        </div>
        {sigLoading ? (
          <div className="table-empty"><span className="spinner-sm" /> Loading signals…</div>
        ) : topSignals.length === 0 ? (
          <div className="table-empty">
            <Activity size={32} />
            <p>No signals detected yet. Upload ADR data or run reanalysis.</p>
          </div>
        ) : (
          <div className="data-table">
            <div className="dt-head risk-head">
              <span>Drug / Reaction</span>
              <span>Cases</span>
              <span>PRR</span>
              <span>ROR</span>
              <span>Chi</span>
              <span>Score</span>
              <span>Status</span>
            </div>
            {topSignals.slice(0, 10).map((sig: any) => (
              <div className="dt-row risk-row" key={sig.id}>
                <strong>
                  {sig.drug?.genericName || sig.drug?.brandName}
                  <small>{sig.reactionPtName}</small>
                </strong>
                <span>{sig.caseCount}</span>
                <span>{sig.prr?.toFixed(2) ?? '—'}</span>
                <span>{sig.ror?.toFixed(2) ?? '—'}</span>
                <span>{sig.chiSquare?.toFixed(2) ?? sig.informationComponent?.toFixed(2) ?? '—'}</span>
                <span><strong>{sig.signalScore?.toFixed(1) ?? '—'}</strong></span>
                <span className={`badge ${STATUS_BADGE[sig.status] || 'badge-gray'}`}>{sig.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats Cards Row */}
      <section className="stat-cards">
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <span>PRR Threshold</span>
            <strong>≥ 2.0</strong>
          </div>
        </div>
        <div className="stat-card">
          <Users size={20} />
          <div>
            <span>Min. Case Count</span>
            <strong>≥ 3</strong>
          </div>
        </div>
        <div className="stat-card">
          <AlertTriangle size={20} />
          <div>
            <span>Chi² Threshold</span>
            <strong>≥ 3.84</strong>
          </div>
        </div>
        <div className="stat-card">
          <Activity size={20} />
          <div>
            <span>Information Component (IC)</span>
            <strong>&gt; 0.0 (positive)</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
