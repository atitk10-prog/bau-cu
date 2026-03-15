const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

async function callApi(action: string, payload?: Record<string, unknown>) {
  const params = new URLSearchParams({ action });
  if (payload) params.set('payload', JSON.stringify(payload));
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
export const login = (username: string, password: string) => callApi('login', { username, password });

// Elections
export const getElections = (user: string) => callApi('getElections', { user });
export const addElection = (data: Record<string, unknown>) => callApi('addElection', data);
export const deleteElection = (id: string) => callApi('deleteElection', { id });
export const updateElection = (data: Record<string, unknown>) => callApi('updateElection', data);

// Candidates (per election)
export const getCandidates = (electionId: string) => callApi('getCandidates', { electionId });
export const addCandidate = (electionId: string, id: string, name: string) => callApi('addCandidate', { electionId, id, name });
export const deleteCandidate = (electionId: string, id: string) => callApi('deleteCandidate', { electionId, id });
export const saveCandidates = (electionId: string, candidates: { id: string; name: string }[]) => callApi('saveCandidates', { electionId, candidates });

// Ballots (per election)
export const getBallots = (electionId: string) => callApi('getBallots', { electionId });
export const addBallot = (electionId: string, ballot: string, user: string) => callApi('addBallot', { electionId, ballot, user });
export const addBulkBallot = (electionId: string, pattern: string, count: number, user: string) => callApi('addBulkBallot', { electionId, pattern, count, user });
export const addBulkBallots = (electionId: string, ballots: string[], user: string) => callApi('addBulkBallots', { electionId, ballots, user });
export const deleteBallot = (electionId: string, id: number) => callApi('deleteBallot', { electionId, id });

// Results
export const getResults = (electionId: string) => callApi('getResults', { electionId });

// Report
export const getReport = () => callApi('getReport');
export const updateReport = (report: Record<string, unknown>) => callApi('updateReport', { report });

// Config
export const getConfig = () => callApi('getConfig');
export const updateConfig = (config: Record<string, unknown>) => callApi('updateConfig', { config });

// Users
export const getUsers = () => callApi('getUsers');
export const addUser = (username: string, password: string, role: string, displayName: string) => callApi('addUser', { username, password, role, displayName });
export const deleteUser = (username: string) => callApi('deleteUser', { username });
