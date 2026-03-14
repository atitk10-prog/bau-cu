import React, { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import { Config, Candidate, Ballot, Result, Stats, Report, ReportRow, AuthUser, User } from './types';
import {
  LayoutDashboard, Vote, LogOut, Settings, ChevronRight, AlertCircle,
  CheckCircle2, XCircle, BarChart3, PieChart as PieChartIcon, Trash2,
  Users, FileText, UserPlus, ClipboardList, Edit3, PlusCircle, RefreshCw, Lock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

type View = 'dashboard' | 'report' | 'entry' | 'results' | 'candidates' | 'config' | 'users';

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const s = localStorage.getItem('authUser');
    return s ? JSON.parse(s) : null;
  });
  const [view, setView] = useState<View>('dashboard');

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    localStorage.setItem('authUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('authUser');
    setView('dashboard');
  };

  if (!authUser) return <LoginScreen onLogin={handleLogin} />;

  const navItems: { icon: React.ReactNode; label: string; view: View; adminOnly?: boolean }[] = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', view: 'dashboard' },
    { icon: <FileText size={20} />, label: 'Báo cáo phiếu', view: 'report' },
    { icon: <Edit3 size={20} />, label: 'Nhập phiếu', view: 'entry' },
    { icon: <BarChart3 size={20} />, label: 'Kết quả', view: 'results' },
    { icon: <ClipboardList size={20} />, label: 'Ứng viên', view: 'candidates' },
    { icon: <Settings size={20} />, label: 'Cấu hình', view: 'config', adminOnly: true },
    { icon: <Users size={20} />, label: 'Quản lý user', view: 'users', adminOnly: true },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <aside className="w-72 bg-white border-r border-black/5 flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white"><Vote size={24} /></div>
            <h1 className="text-xl font-serif font-bold text-[#1a1a1a]">WECVS</h1>
          </div>
          <p className="text-xs text-[#5A5A40] opacity-60 uppercase tracking-widest font-medium">Hệ thống kiểm phiếu</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.filter(n => !n.adminOnly || authUser.role === 'admin').map(n => (
            <button key={n.view} onClick={() => setView(n.view)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                view === n.view ? "bg-[#5A5A40] text-white shadow-md shadow-[#5A5A40]/20" : "text-[#5A5A40] hover:bg-[#5A5A40]/5"
              )}>
              {n.icon}<span>{n.label}</span>
              {view === n.view && <ChevronRight size={16} className="ml-auto opacity-60" />}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-black/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white text-sm font-bold">
              {authUser.displayName?.charAt(0) || authUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[#1a1a1a] truncate">{authUser.displayName || authUser.username}</p>
              <p className="text-xs text-[#5A5A40] capitalize">{authUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={16} />Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-10">
        {view === 'dashboard' && <DashboardView />}
        {view === 'report' && <ReportView />}
        {view === 'entry' && <BallotEntryView user={authUser.username} />}
        {view === 'results' && <ResultsView />}
        {view === 'candidates' && <CandidatesView />}
        {view === 'config' && <ConfigView />}
        {view === 'users' && <UsersView />}
      </main>
    </div>
  );
}

// ==================== LOGIN ====================
function LoginScreen({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.login(username, password);
      if (res.success) onLogin(res.user);
      else setError(res.error || 'Đăng nhập thất bại');
    } catch { setError('Không thể kết nối server'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] p-4">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[32px] shadow-2xl max-w-md w-full text-center border border-black/5">
        <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-6 text-white"><Vote size={40} /></div>
        <h1 className="text-3xl font-serif font-bold text-[#1a1a1a] mb-2">WECVS</h1>
        <p className="text-[#5A5A40] mb-8 italic">Hệ thống Kiểm phiếu Bầu cử Minh bạch</p>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Tài khoản</label>
            <input required type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#5A5A40]/20 outline-none" placeholder="Nhập tài khoản" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Mật khẩu</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#5A5A40]/20 outline-none" placeholder="Nhập mật khẩu" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full mt-8 py-4 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
          <Lock size={20} />{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}

// ==================== DASHBOARD ====================
function DashboardView() {
  const [stats, setStats] = useState<Stats>({ totalBallots: 0, validBallots: 0, invalidBallots: 0, blankBallots: 0 });
  const [results, setResults] = useState<Result[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [ballotByCount, setBallotByCount] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [resR, resC] = await Promise.all([api.getResults(), api.getConfig()]);
      if (resR.success) { setStats(resR.stats); setResults(resR.results); setBallotByCount(resR.ballotByCount || {}); }
      if (resC.success) setConfig(resC.config);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const pieData = [
    { name: 'Hợp lệ', value: stats.validBallots, color: '#5A5A40' },
    { name: 'Không hợp lệ', value: stats.invalidBallots, color: '#ef4444' },
    { name: 'Phiếu trắng', value: stats.blankBallots, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  // Cross-check
  const check1 = stats.validBallots + stats.invalidBallots + stats.blankBallots === stats.totalBallots;
  const totalVotesCast = results.reduce((s, r) => s + r.votes, 0);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[#1a1a1a] mb-2">{config?.ten_cuoc_bau_cu || 'Dashboard'}</h2>
          <p className="text-[#5A5A40] italic">Cấp: {config?.cap_bau_cu} • Bầu tối đa: {config?.so_nguoi_duoc_bau}</p>
        </div>
        <button onClick={refresh} disabled={loading} className="p-3 bg-white rounded-xl shadow-sm border border-black/5 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw size={20} className={cn("text-[#5A5A40]", loading && "animate-spin")} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Tổng phiếu thu" value={stats.totalBallots} icon={<Vote className="text-blue-500" />} />
        <StatCard label="Phiếu hợp lệ" value={stats.validBallots} icon={<CheckCircle2 className="text-green-500" />} />
        <StatCard label="Không hợp lệ" value={stats.invalidBallots} icon={<XCircle className="text-red-500" />} />
        <StatCard label="Phiếu trắng" value={stats.blankBallots} icon={<AlertCircle className="text-gray-400" />} />
      </div>

      {/* Ballot by count */}
      {Object.keys(ballotByCount).length > 0 && (
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-black/5">
          <h3 className="text-lg font-serif font-bold mb-4">Phân loại phiếu</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(ballotByCount).sort().map(([k, v]) => (
              <div key={k} className="px-4 py-2 bg-[#fcfcf9] rounded-xl text-sm">
                <span className="font-bold text-[#5A5A40]">{k.replace('bau_', 'Bầu ')}</span>
                <span className="ml-2 text-gray-600">{v} phiếu</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-black/5">
          <h3 className="text-xl font-serif font-bold mb-8 flex items-center gap-2"><BarChart3 size={20} />Số phiếu theo ứng viên</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fill: '#5A5A40' }} />
                <Tooltip cursor={{ fill: '#f8f8f8' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={32}>
                  {results.map((r, i) => <Cell key={i} fill={r.elected ? '#5A5A40' : '#d1d1c1'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5">
          <h3 className="text-xl font-serif font-bold mb-8 flex items-center gap-2"><PieChartIcon size={20} />Tỷ lệ phiếu</h3>
          <div className="h-[250px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={5} dataKey="value">
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-gray-400 italic">Chưa có dữ liệu</div>}
          </div>
          <div className="space-y-3 mt-4">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-gray-600">{d.name}</span></div>
                <span className="font-bold">{d.value} ({stats.totalBallots > 0 ? Math.round((d.value / stats.totalBallots) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-check */}
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-black/5">
        <h3 className="text-lg font-serif font-bold mb-4">Kiểm tra chéo dữ liệu</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {check1 ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
            <span>Tổng phiếu = Hợp lệ + Không hợp lệ + Trắng: {stats.validBallots} + {stats.invalidBallots} + {stats.blankBallots} = {stats.validBallots + stats.invalidBallots + stats.blankBallots} / {stats.totalBallots}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-500" />
            <span>Tổng lượt bầu từ phiếu hợp lệ: {totalVotesCast}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-black/5 flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs text-[#5A5A40] uppercase tracking-widest font-bold mb-1">{label}</p>
        <p className="text-2xl font-serif font-bold text-[#1a1a1a]">{value}</p>
      </div>
    </div>
  );
}

// ==================== REPORT ====================
function ReportView() {
  const [report, setReport] = useState<Report>({
    phieu_nhan_ve: { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 },
    phieu_phat_ra: { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 },
    phieu_doi_hong: { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 },
    phieu_con_lai: { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getReport().then(res => { if (res.success && res.report) setReport(res.report as Report); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof Report, field: keyof ReportRow, val: string) => {
    setReport(prev => ({ ...prev, [key]: { ...prev[key], [field]: parseInt(val) || 0 } }));
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await api.updateReport(report);
      setMsg(res.success ? 'Đã lưu thành công!' : 'Lỗi khi lưu');
    } catch { setMsg('Không thể kết nối server'); }
    setSaving(false);
  };

  const labels: Record<string, string> = {
    phieu_nhan_ve: '1. Số phiếu Tổ bầu cử đã nhận về',
    phieu_phat_ra: '2. Số phiếu phát ra',
    phieu_doi_hong: '3. Số phiếu cử tri đổi do gạch hỏng',
    phieu_con_lai: '4. Số phiếu còn lại không sử dụng đến',
  };

  if (loading) return <div className="text-center text-[#5A5A40] py-12">Đang tải...</div>;

  return (
    <div className="space-y-8">
      <header><h2 className="text-4xl font-serif font-bold text-[#1a1a1a]">Báo cáo phiếu bầu cử</h2><p className="text-[#5A5A40] italic">Nhập số liệu thống kê phiếu theo từng cấp bầu cử</p></header>

      <div className="bg-white rounded-[32px] shadow-sm border border-black/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold">
            <tr><th className="px-6 py-4">Nội dung</th><th className="px-6 py-4 text-center">Đại biểu Quốc hội</th><th className="px-6 py-4 text-center">HĐND cấp TP</th><th className="px-6 py-4 text-center">HĐND cấp xã</th></tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(Object.keys(labels) as (keyof Report)[]).map(key => (
              <tr key={key} className="hover:bg-[#fcfcf9]">
                <td className="px-6 py-4 font-medium text-sm">{labels[key]}</td>
                {(['quoc_hoi', 'hdnd_tp', 'hdnd_xa'] as (keyof ReportRow)[]).map(f => (
                  <td key={f} className="px-6 py-4 text-center">
                    <input type="number" min="0" value={report[key][f]} onChange={e => handleChange(key, f, e.target.value)}
                      className="w-24 text-center px-3 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#5A5A40]/20 outline-none font-bold" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] transition-all disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
        </button>
        {msg && <span className={cn("text-sm font-medium", msg.includes('thành công') ? "text-green-600" : "text-red-600")}>{msg}</span>}
      </div>
    </div>
  );
}

// ==================== BALLOT ENTRY ====================
function BallotEntryView({ user }: { user: string }) {
  const [ballot, setBallot] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [recentBallots, setRecentBallots] = useState<Ballot[]>([]);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid' | 'success'>('idle');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.getCandidates(), api.getConfig(), api.getBallots()]).then(([c, cfg, b]) => {
      if (c.success) setCandidates(c.candidates);
      if (cfg.success) setConfig(cfg.config);
      if (b.success) setRecentBallots(b.ballots.slice(-10).reverse());
    });
  }, []);

  const validate = useCallback((val: string) => {
    if (!val || val === '0') { setStatus('valid'); setNote('Phiếu trắng'); return; }
    const chars = val.split('');
    const validIds = candidates.map(c => c.id);
    const maxVote = config?.so_nguoi_duoc_bau || 5;

    for (const ch of chars) {
      if (!validIds.includes(ch)) { setStatus('invalid'); setNote(`Ứng viên ${ch} không tồn tại`); return; }
    }
    if (new Set(chars).size !== chars.length) { setStatus('invalid'); setNote('Trùng số ứng viên'); return; }
    if (chars.length > maxVote) { setStatus('invalid'); setNote(`Vượt số bầu (tối đa ${maxVote})`); return; }
    setStatus('valid');
    setNote(`Bầu ${chars.length} người: ${chars.map(ch => { const c = candidates.find(x => x.id === ch); return c ? c.name : ch; }).join(', ')}`);
  }, [candidates, config]);

  useEffect(() => { if (ballot) validate(ballot); else { setStatus('idle'); setNote(''); } }, [ballot, validate]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.addBallot(ballot || '0', user);
      if (res.success) {
        setRecentBallots(prev => [res.ballot, ...prev].slice(0, 10));
        setBallot(''); setStatus('success');
        setTimeout(() => setStatus('idle'), 1500);
      }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && status !== 'invalid') handleSubmit(); };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
      <div className="xl:col-span-2 space-y-8">
        <header>
          <h2 className="text-3xl font-serif font-bold text-[#1a1a1a]">Nhập phiếu bầu</h2>
          <p className="text-[#5A5A40] italic">Nhập chuỗi số ứng viên được bầu. Tối đa: {config?.so_nguoi_duoc_bau || '...'} người</p>
        </header>

        {/* Ballot Paper */}
        <div className={cn(
          "bg-white p-12 rounded-[40px] shadow-xl border-2 relative overflow-hidden transition-all duration-300",
          status === 'valid' ? "border-green-300 shadow-green-100" : status === 'invalid' ? "border-red-300 shadow-red-100" : status === 'success' ? "border-blue-300 shadow-blue-100" : "border-black/5"
        )}>
          <div className={cn("absolute top-0 left-0 w-full h-2 transition-colors",
            status === 'valid' ? "bg-green-500" : status === 'invalid' ? "bg-red-500" : status === 'success' ? "bg-blue-500" : "bg-[#5A5A40]"
          )} />
          <div className="text-center mb-10">
            <h3 className="text-2xl font-serif font-bold uppercase tracking-widest mb-2">Phiếu Bầu Cử</h3>
            <p className="text-sm text-gray-400 font-medium">{config?.ten_cuoc_bau_cu || ''}</p>
          </div>

          <div className="max-w-md mx-auto">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-3">Nhập số ứng viên được bầu</label>
            <input type="text" value={ballot} onChange={e => setBallot(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={handleKeyDown}
              placeholder="VD: 2456" autoFocus
              className={cn("w-full text-center text-5xl font-serif font-bold py-6 px-4 rounded-2xl border-2 outline-none transition-all tracking-[0.5em]",
                status === 'valid' ? "border-green-300 bg-green-50/30 text-green-700" :
                status === 'invalid' ? "border-red-300 bg-red-50/30 text-red-700" :
                status === 'success' ? "border-blue-300 bg-blue-50/30 text-blue-700" :
                "border-gray-200 bg-gray-50 text-[#1a1a1a] focus:border-[#5A5A40]"
              )} />

            {note && (
              <div className={cn("mt-4 p-4 rounded-xl text-sm font-medium flex items-center gap-2",
                status === 'valid' ? "bg-green-50 text-green-700" : status === 'invalid' ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
              )}>
                {status === 'valid' ? <CheckCircle2 size={16} /> : status === 'invalid' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                {note}
              </div>
            )}
            {status === 'success' && <div className="mt-4 p-4 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium text-center ballot-success">✓ Đã lưu phiếu thành công!</div>}
          </div>

          <div className="mt-10 pt-6 border-t border-dashed border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Bầu</p>
                <p className={cn("text-3xl font-serif font-bold", status === 'invalid' ? "text-red-500" : "text-[#5A5A40]")}>
                  {ballot ? ballot.split('').length : 0}
                </p>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Tối đa</p>
                <p className="text-3xl font-serif font-bold text-gray-300">{config?.so_nguoi_duoc_bau || '-'}</p>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={status === 'invalid' || submitting}
              className="px-10 py-4 bg-[#5A5A40] text-white rounded-full font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4a4a35] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Đang lưu...' : 'Xác nhận & Lưu phiếu'}
            </button>
          </div>
        </div>

        {/* Candidate reference */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-black/5">
          <h4 className="text-sm font-bold uppercase tracking-widest text-[#5A5A40] mb-3">Danh sách ứng viên</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {candidates.map(c => (
              <div key={c.id} className={cn("px-3 py-2 rounded-lg text-sm border transition-colors",
                ballot.includes(c.id) ? "bg-[#5A5A40] text-white border-[#5A5A40]" : "bg-gray-50 border-gray-100"
              )}>
                <span className="font-bold mr-2">{c.id}.</span>{c.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent ballots */}
      <div className="space-y-6">
        <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">Phiếu vừa nhập</h3>
        <div className="space-y-3">
          {recentBallots.map(b => (
            <div key={b.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-black/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{b.time}</p>
                <p className="text-lg font-serif font-bold tracking-widest">{b.ballot === '0' ? '(trắng)' : b.ballot}</p>
                <p className="text-xs text-gray-400 mt-1">{b.note}</p>
              </div>
              {b.valid ? <CheckCircle2 className="text-green-500 shrink-0" size={24} /> : <XCircle className="text-red-500 shrink-0" size={24} />}
            </div>
          ))}
          {recentBallots.length === 0 && <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-[24px]"><p className="text-gray-400 italic">Chưa có phiếu nào</p></div>}
        </div>
      </div>
    </div>
  );
}

// ==================== RESULTS ====================
function ResultsView() {
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState<Stats>({ totalBallots: 0, validBallots: 0, invalidBallots: 0, blankBallots: 0 });
  const [loading, setLoading] = useState(true);
  const [maxVote, setMaxVote] = useState(5);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.getResults();
      if (res.success) { setResults(res.results); setStats(res.stats); setMaxVote(res.maxVote); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div><h2 className="text-4xl font-serif font-bold text-[#1a1a1a]">Kết quả kiểm phiếu</h2>
          <p className="text-[#5A5A40] italic">Tổng phiếu hợp lệ: {stats.validBallots} / {stats.totalBallots}</p></div>
        <button onClick={refresh} disabled={loading} className="p-3 bg-white rounded-xl shadow-sm border border-black/5 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw size={20} className={cn("text-[#5A5A40]", loading && "animate-spin")} />
        </button>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm border border-black/5 overflow-hidden">
        <div className="p-8 border-b border-black/5"><h3 className="text-xl font-serif font-bold">Bảng xếp hạng kết quả</h3></div>
        <table className="w-full text-left">
          <thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold">
            <tr><th className="px-8 py-4">Hạng</th><th className="px-8 py-4">Ứng viên</th><th className="px-8 py-4">Mã số</th><th className="px-8 py-4 text-right">Số phiếu</th><th className="px-8 py-4 text-right">Tỷ lệ</th><th className="px-8 py-4 text-center">Trạng thái</th></tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {results.map((r, i) => (
              <tr key={r.id} className={cn("hover:bg-[#fcfcf9] transition-colors", i < maxVote && "bg-[#5A5A40]/5")}>
                <td className="px-8 py-5 font-serif font-bold text-lg">{r.rank}</td>
                <td className="px-8 py-5 font-medium">{r.name}</td>
                <td className="px-8 py-5 text-gray-500">{r.id}</td>
                <td className="px-8 py-5 text-right font-bold">{r.votes}</td>
                <td className="px-8 py-5 text-right">{r.percent}%</td>
                <td className="px-8 py-5 text-center">
                  {r.elected
                    ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Trúng cử</span>
                    : <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Chưa trúng</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== CANDIDATES ====================
function CandidatesView() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const refresh = async () => { setLoading(true); try { const r = await api.getCandidates(); if (r.success) setCandidates(r.candidates); } catch {} setLoading(false); };
  useEffect(() => { refresh(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    const res = await api.addCandidate(newId, newName);
    if (res.success) { setNewId(''); setNewName(''); setShowAdd(false); refresh(); }
    else setMsg(res.error);
  };

  const handleDelete = async (id: string) => { if (confirm('Xóa ứng viên này?')) { await api.deleteCandidate(id); refresh(); } };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div><h2 className="text-4xl font-serif font-bold text-[#1a1a1a]">Danh sách ứng viên</h2><p className="text-[#5A5A40] italic">Mỗi ứng viên có 1 mã số duy nhất</p></div>
        <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] transition-all flex items-center gap-2"><PlusCircle size={20} />Thêm</button>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm border border-black/5 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Đang tải...</div> : (
          <table className="w-full text-left">
            <thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold">
              <tr><th className="px-8 py-4">STT</th><th className="px-8 py-4">Họ và tên</th><th className="px-8 py-4 text-right">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {candidates.map(c => (
                <tr key={c.id} className="hover:bg-[#fcfcf9] transition-colors">
                  <td className="px-8 py-5 font-serif font-bold text-lg">{c.id}</td>
                  <td className="px-8 py-5 font-medium">{c.name}</td>
                  <td className="px-8 py-5 text-right"><button onClick={() => handleDelete(c.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdd} className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-serif font-bold mb-8">Thêm ứng viên</h3>
            {msg && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{msg}</div>}
            <div className="space-y-6">
              <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Mã số / STT</label>
                <input required type="text" value={newId} onChange={e => setNewId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#5A5A40]/20 outline-none" placeholder="VD: 1" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Họ và tên</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#5A5A40]/20 outline-none" placeholder="Nguyễn Văn A" /></div>
            </div>
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-gray-100 text-[#5A5A40] rounded-full font-medium hover:bg-gray-200 transition-colors">Hủy</button>
              <button type="submit" className="flex-1 py-4 bg-[#5A5A40] text-white rounded-full font-medium hover:bg-[#4a4a35] transition-colors">Thêm</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==================== CONFIG ====================
function ConfigView() {
  const [config, setConfig] = useState({ ten_cuoc_bau_cu: '', cap_bau_cu: 'Quốc hội', so_ung_vien: 8, so_nguoi_duoc_bau: 5, tong_cu_tri: 300 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.getConfig().then(r => { if (r.success) setConfig(prev => ({ ...prev, ...r.config })); setLoading(false); }); }, []);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try { const r = await api.updateConfig(config); setMsg(r.success ? 'Đã lưu!' : 'Lỗi'); } catch { setMsg('Lỗi kết nối'); }
    setSaving(false);
  };

  if (loading) return <div className="text-center text-[#5A5A40] py-12">Đang tải...</div>;

  return (
    <div className="space-y-8">
      <header><h2 className="text-4xl font-serif font-bold text-[#1a1a1a]">Cấu hình bầu cử</h2><p className="text-[#5A5A40] italic">Thiết lập thông số trước khi nhập phiếu</p></header>
      <div className="bg-white p-10 rounded-[32px] shadow-sm border border-black/5 max-w-2xl space-y-6">
        <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Tên cuộc bầu cử</label>
          <input type="text" value={config.ten_cuoc_bau_cu} onChange={e => setConfig({ ...config, ten_cuoc_bau_cu: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20" /></div>
        <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Cấp bầu cử</label>
          <select value={config.cap_bau_cu} onChange={e => setConfig({ ...config, cap_bau_cu: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none">
            <option>Quốc hội</option><option>HĐND Thành phố</option><option>HĐND Quận/Huyện</option><option>HĐND Xã/Phường</option></select></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Số ứng viên</label>
            <input type="number" min="1" value={config.so_ung_vien} onChange={e => setConfig({ ...config, so_ung_vien: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-center font-bold" /></div>
          <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Số được bầu</label>
            <input type="number" min="1" value={config.so_nguoi_duoc_bau} onChange={e => setConfig({ ...config, so_nguoi_duoc_bau: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-center font-bold" /></div>
          <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Tổng cử tri</label>
            <input type="number" min="1" value={config.tong_cu_tri} onChange={e => setConfig({ ...config, tong_cu_tri: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20 text-center font-bold" /></div>
        </div>
        <div className="flex items-center gap-4 pt-4">
          <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] transition-all disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</button>
          {msg && <span className={cn("text-sm font-medium", msg.includes('Đã') ? "text-green-600" : "text-red-600")}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}

// ==================== USERS ====================
function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'team', displayName: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const refresh = async () => { setLoading(true); try { const r = await api.getUsers(); if (r.success) setUsers(r.users); } catch {} setLoading(false); };
  useEffect(() => { refresh(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    const res = await api.addUser(form.username, form.password, form.role, form.displayName || form.username);
    if (res.success) { setForm({ username: '', password: '', role: 'team', displayName: '' }); setShowAdd(false); refresh(); }
    else setMsg(res.error);
  };

  const handleDelete = async (username: string) => { if (confirm(`Xóa tài khoản ${username}?`)) { const r = await api.deleteUser(username); if (!r.success) alert(r.error); refresh(); } };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div><h2 className="text-4xl font-serif font-bold text-[#1a1a1a]">Quản lý tài khoản</h2><p className="text-[#5A5A40] italic">Tạo và quản lý tài khoản nhập phiếu</p></div>
        <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] transition-all flex items-center gap-2"><UserPlus size={20} />Tạo tài khoản</button>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm border border-black/5 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Đang tải...</div> : (
          <table className="w-full text-left">
            <thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold">
              <tr><th className="px-8 py-4">Tài khoản</th><th className="px-8 py-4">Tên hiển thị</th><th className="px-8 py-4">Mật khẩu</th><th className="px-8 py-4">Vai trò</th><th className="px-8 py-4 text-right">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map(u => (
                <tr key={u.username} className="hover:bg-[#fcfcf9] transition-colors">
                  <td className="px-8 py-5 font-medium">{u.username}</td>
                  <td className="px-8 py-5 text-gray-600">{u.displayName}</td>
                  <td className="px-8 py-5 text-gray-400 font-mono text-sm">{u.password}</td>
                  <td className="px-8 py-5"><span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>{u.role}</span></td>
                  <td className="px-8 py-5 text-right">
                    {u.username !== 'admin' && <button onClick={() => handleDelete(u.username)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdd} className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-serif font-bold mb-8">Tạo tài khoản mới</h3>
            {msg && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{msg}</div>}
            <div className="space-y-6">
              <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Tài khoản</label>
                <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Mật khẩu</label>
                <input required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Tên hiển thị</label>
                <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20" placeholder="Tùy chọn" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Vai trò</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none">
                  <option value="team">Tổ bầu cử (team)</option><option value="admin">Quản trị (admin)</option></select></div>
            </div>
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => { setShowAdd(false); setMsg(''); }} className="flex-1 py-4 bg-gray-100 text-[#5A5A40] rounded-full font-medium hover:bg-gray-200 transition-colors">Hủy</button>
              <button type="submit" className="flex-1 py-4 bg-[#5A5A40] text-white rounded-full font-medium hover:bg-[#4a4a35] transition-colors">Tạo</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
