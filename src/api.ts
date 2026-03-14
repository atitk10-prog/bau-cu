const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

async function fetchApi(action: string) {
  const res = await fetch(`${API_URL}?action=${action}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postApi(data: Record<string, unknown>) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Auth
export const login = (username: string, password: string) =>
  postApi({ action: 'login', username, password });

// Config
export const getConfig = () => fetchApi('getConfig');
export const updateConfig = (config: Record<string, unknown>) =>
  postApi({ action: 'updateConfig', config });

// Candidates
export const getCandidates = () => fetchApi('getCandidates');
export const addCandidate = (id: string, name: string) =>
  postApi({ action: 'addCandidate', id, name });
export const deleteCandidate = (id: string) =>
  postApi({ action: 'deleteCandidate', id });
export const updateCandidates = (candidates: { id: string; name: string }[]) =>
  postApi({ action: 'updateCandidates', candidates });

// Ballots
export const getBallots = () => fetchApi('getBallots');
export const addBallot = (ballot: string, user: string) =>
  postApi({ action: 'addBallot', ballot, user });
export const deleteBallot = (id: number) =>
  postApi({ action: 'deleteBallot', id });

// Results
export const getResults = () => fetchApi('getResults');

// Report
export const getReport = () => fetchApi('getReport');
export const updateReport = (report: Record<string, unknown>) =>
  postApi({ action: 'updateReport', report });

// Users
export const getUsers = () => fetchApi('getUsers');
export const addUser = (username: string, password: string, role: string, displayName: string) =>
  postApi({ action: 'addUser', username, password, role, displayName });
export const deleteUser = (username: string) =>
  postApi({ action: 'deleteUser', username });
export const updateUser = (username: string, password: string, role: string, displayName: string) =>
  postApi({ action: 'updateUser', username, password, role, displayName });

// Dashboard
export const getDashboard = () => fetchApi('getDashboard');
