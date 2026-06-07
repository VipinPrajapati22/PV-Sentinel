const BASE_URL = import.meta.env.VITE_API_URL || 'https://pv-sentinel.onrender.com';

function getToken(): string | null {
  return localStorage.getItem('pv_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data as T;
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: any }>('/auth/me'),
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reports = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/reports?${qs}`);
  },

  get: (id: string) => request<any>(`/reports/${id}`),

  create: (body: any) =>
    request<any>('/reports', { method: 'POST', body: JSON.stringify(body) }),

  uploadCsv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return upload<any>('/reports/upload', fd);
  },

  importValidated: (rows: any[]) =>
    request<any>('/reports/import', { method: 'POST', body: JSON.stringify({ rows }) }),

  terminologyAutocomplete: (q: string) =>
    request<any>(`/reports/terminology/autocomplete?q=${encodeURIComponent(q)}`),

  drugsAutocomplete: (q: string) =>
    request<any>(`/reports/drugs/autocomplete?q=${encodeURIComponent(q)}`),

  assessCausality: (body: any) =>
    request<any>('/reports/causality/assess', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Signals ───────────────────────────────────────────────────────────────────

export const signals = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/signals?${qs}`);
  },

  top: () => request<any>('/signals/top'),

  get: (id: string) => request<any>(`/signals/${id}`),

  updateStatus: (id: string, status: string, notes?: string) =>
    request<any>(`/signals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  reanalyze: () =>
    request<any>('/signals/reanalyze', { method: 'POST' }),

  stats: () => request<any>('/signals/stats'),
};

// ── Risks ─────────────────────────────────────────────────────────────────────

export const risks = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/risks?${qs}`);
  },

  get: (id: string) => request<any>(`/risks/${id}`),

  create: (body: any) =>
    request<any>('/risks', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: any) =>
    request<any>(`/risks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notifications = {
  list: () => request<any>('/notifications'),

  markRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () =>
    request<any>('/notifications/read-all', { method: 'PATCH' }),
};

// ── Audit ─────────────────────────────────────────────────────────────────────

export const audits = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/audits?${qs}`);
  },
};

// ── Exports ───────────────────────────────────────────────────────────────────

export const exports_ = {
  excel: async () => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/exports/excel`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pv_export_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },

  dashboard: () => request<any>('/exports/dashboard'),
};