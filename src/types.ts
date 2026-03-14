export interface Election {
  id: string;
  name: string;
  soUngVien: number;
  soNguoiDuocBau: number;
  phieuPhatRa: number;
  phieuThuVe: number;
}

export interface Candidate {
  id: string;
  name: string;
}

export interface Ballot {
  id: number;
  pattern: string;
  count: number;
  valid: boolean;
  note: string;
  time: string;
  user: string;
  type: 'manual' | 'bulk';
}

export interface BallotType {
  pattern: string;
  count: number;
  valid: boolean;
  note: string;
}

export interface Result {
  id: string;
  name: string;
  votes: number;
  crossed: number;
  percent: number;
  elected: boolean;
  rank: number;
}

export interface Stats {
  totalPhieu: number;
  validPhieu: number;
  invalidPhieu: number;
  blankPhieu: number;
}

export interface Progress {
  phieuPhatRa: number;
  phieuThuVe: number;
  daNhap: number;
  conThieu: number;
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
