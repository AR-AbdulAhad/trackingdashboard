const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Returns raw Response (no auto-throw) — used when caller needs custom error handling
export const apiRequest = (path, options = {}) =>
  fetch(`${API_BASE}${path}`, {
    headers: getHeaders(),
    ...options,
  });

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};



export const login = (email, password) =>
  apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getExecutiveSummary = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`/api/reports/executive-summary?${params}`);
};

export const getAudienceOverview = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`/api/reports/audience-overview?${params}`);
};

export const getConfiguratorFunnel = (configurator, from, to) => {
  const params = new URLSearchParams({ configurator });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`/api/reports/configurator-funnel?${params}`);
};

export const getExitPoints = (configurator, from, to) => {
  const params = new URLSearchParams({ configurator });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`/api/reports/exit-points?${params}`);
};

export const getJourneySummary = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`/api/reports/journey-summary?${params}`);
};

export const getConversionRates = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`/api/reports/conversion-rates?${params}`);
};

export const getEntryRate = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`/api/reports/entry-rate?${params}`);
};

export const getAudienceGrowth = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`/api/reports/audience-growth?${params}`);
};

export const updateProfile = (payload) =>
  apiFetch('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const getVisitors = (page = 1, limit = 20, search = '', educationType = '') => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  if (educationType) params.set('educationType', educationType);
  return apiFetch(`/api/reports/visitors?${params}`);
};

export const getVisitorDetails = (id) => apiFetch(`/api/visitor/${id}`);
export const getVisitorRecordings = (id) => apiFetch(`/api/recordings/visitor/${id}`);
export const getRecordingPlayback = (id) => apiFetch(`/api/recordings/play/${id}`);
