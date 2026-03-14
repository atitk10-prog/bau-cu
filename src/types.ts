export interface Config {
  ten_cuoc_bau_cu: string;
  cap_bau_cu: string;
  so_ung_vien: number;
  so_nguoi_duoc_bau: number;
  tong_cu_tri: number;
}

export interface Candidate {
  id: string;
  name: string;
}

export interface Ballot {
  id: number;
  ballot: string;
  valid: boolean;
  note: string;
  time: string;
  user: string;
}

export interface ReportRow {
  quoc_hoi: number;
  hdnd_tp: number;
  hdnd_xa: number;
}

export interface Report {
  phieu_nhan_ve: ReportRow;
  phieu_phat_ra: ReportRow;
  phieu_doi_hong: ReportRow;
  phieu_con_lai: ReportRow;
}

export interface Result {
  id: string;
  name: string;
  votes: number;
  percent: number;
  elected: boolean;
  rank: number;
}

export interface Stats {
  totalBallots: number;
  validBallots: number;
  invalidBallots: number;
  blankBallots: number;
}

export interface User {
  username: string;
  password: string;
  role: 'admin' | 'team';
  displayName: string;
}

export interface AuthUser {
  username: string;
  role: 'admin' | 'team';
  displayName: string;
}
