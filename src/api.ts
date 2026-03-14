const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

/**
 * Google Apps Script Web App chỉ hỗ trợ GET tốt qua CORS.
 * POST bị redirect 302 → browser đổi thành GET → 405.
 * Giải pháp: encode tất cả data vào URL params, dùng GET cho mọi request.
 */
async function callApi(action: string, payload?: Record<string, unknown>) {
  const params = new URLSearchParams({ action });
  if (payload) {
    params.set('payload', JSON.stringify(payload));
  }
  const url = `${API_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Auth
export const login = (username: string, password: string) =>
  callApi('login', { username, password });

// Config
export const getConfig = () => callApi('getConfig');
export const updateConfig = (config: Record<string, unknown>) =>
  callApi('updateConfig', { config });

// Candidates
export const getCandidates = () => callApi('getCandidates');
export const addCandidate = (id: string, name: string) =>
  callApi('addCandidate', { id, name });
export const deleteCandidate = (id: string) =>
  callApi('deleteCandidate', { id });
export const updateCandidates = (candidates: { id: string; name: string }[]) =>
  callApi('updateCandidates', { candidates });

// Ballots
export const getBallots = () => callApi('getBallots');
export const addBallot = (ballot: string, user: string) =>
  callApi('addBallot', { ballot, user });
export const deleteBallot = (id: number) =>
  callApi('deleteBallot', { id });

// Results
export const getResults = () => callApi('getResults');

// Report
export const getReport = () => callApi('getReport');
export const updateReport = (report: Record<string, unknown>) =>
  callApi('updateReport', { report });

// Users
export const getUsers = () => callApi('getUsers');
export const addUser = (username: string, password: string, role: string, displayName: string) =>
  callApi('addUser', { username, password, role, displayName });
export const deleteUser = (username: string) =>
  callApi('deleteUser', { username });
export const updateUser = (username: string, password: string, role: string, displayName: string) =>
  callApi('updateUser', { username, password, role, displayName });

// Dashboard
export const getDashboard = () => callApi('getDashboard');
