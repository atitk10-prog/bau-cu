import React, { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import { Election, Candidate, Ballot, BallotType, Result, Stats, Progress, Report, ReportRow, AuthUser, User } from './types';
import { LayoutDashboard, Vote, LogOut, Settings, ChevronRight, AlertCircle, CheckCircle2, XCircle, BarChart3, Trash2, Users, FileText, UserPlus, ClipboardList, Edit3, PlusCircle, RefreshCw, Lock, List, Menu, X as XIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

type View = 'elections' | 'report' | 'entry' | 'results' | 'candidates' | 'users';

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => { const s = localStorage.getItem('authUser'); return s ? JSON.parse(s) : null; });
  const [view, setView] = useState<View>('elections');
  const [elections, setElections] = useState<Election[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (user: AuthUser) => { setAuthUser(user); localStorage.setItem('authUser', JSON.stringify(user)); };
  const handleLogout = () => { setAuthUser(null); localStorage.removeItem('authUser'); };

  const loadElections = useCallback(async () => {
    if (!authUser) return;
    try { const r = await api.getElections(authUser.username); if (r.success) setElections(r.elections); } catch {}
  }, [authUser]);

  useEffect(() => { loadElections(); }, [loadElections]);

  if (!authUser) return <LoginScreen onLogin={handleLogin} />;

  const navItems: { icon: React.ReactNode; label: string; view: View; adminOnly?: boolean }[] = [
    { icon: <List size={20} />, label: 'Bầu cử', view: 'elections' },
    { icon: <ClipboardList size={20} />, label: 'Ứng viên', view: 'candidates' },
    { icon: <Edit3 size={20} />, label: 'Nhập phiếu', view: 'entry' },
    { icon: <BarChart3 size={20} />, label: 'Kết quả', view: 'results' },
    { icon: <FileText size={20} />, label: 'Báo cáo', view: 'report' },
    { icon: <Users size={20} />, label: 'Users', view: 'users', adminOnly: true },
  ];
  const filteredNav = navItems.filter(n => !n.adminOnly || authUser.role === 'admin');
  const switchView = (v: View) => { setView(v); setSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col lg:flex-row">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-black/5 sticky top-0 z-40">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white"><Vote size={18} /></div><span className="font-serif font-bold">WECVS</span></div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5A5A40] truncate max-w-[100px]">{authUser.displayName || authUser.username}</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">{sidebarOpen ? <XIcon size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {/* Mobile slide menu */}
      {sidebarOpen && <div className="lg:hidden bg-white border-b border-black/5 px-4 py-3 space-y-1 shadow-lg z-30">
        {filteredNav.map(n => (<button key={n.view} onClick={() => switchView(n.view)} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm", view === n.view ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]")}>{n.icon}<span>{n.label}</span></button>))}
        <button onClick={handleLogout} className="w-full py-3 flex items-center justify-center gap-2 text-sm text-red-600 mt-2 border-t border-black/5 pt-3"><LogOut size={16} />Đăng xuất</button>
      </div>}
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-black/5 flex-col shrink-0">
        <div className="p-6"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white"><Vote size={24} /></div><h1 className="text-xl font-serif font-bold">WECVS</h1></div><p className="text-xs text-[#5A5A40] opacity-60 uppercase tracking-widest font-medium">Hệ thống kiểm phiếu</p></div>
        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map(n => (<button key={n.view} onClick={() => setView(n.view)} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm", view === n.view ? "bg-[#5A5A40] text-white shadow-md" : "text-[#5A5A40] hover:bg-[#5A5A40]/5")}>{n.icon}<span>{n.label}</span>{view === n.view && <ChevronRight size={16} className="ml-auto opacity-60" />}</button>))}
        </nav>
        <div className="p-4 border-t border-black/5">
          <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 bg-[#5A5A40] rounded-full flex items-center justify-center text-white text-sm font-bold">{(authUser.displayName || authUser.username).charAt(0).toUpperCase()}</div><div className="overflow-hidden"><p className="text-sm font-medium truncate">{authUser.displayName || authUser.username}</p><p className="text-xs text-[#5A5A40] capitalize">{authUser.role}</p></div></div>
          <button onClick={handleLogout} className="w-full py-2 flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={16} />Đăng xuất</button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        {view === 'elections' && <ElectionsView onSelect={() => switchView('candidates')} activeId={undefined} user={authUser.username} onRefresh={loadElections} />}
        {view === 'report' && <ReportView />}
        {view === 'entry' && <WithElectionTabs elections={elections} user={authUser.username}>{(el) => <BallotEntryView election={el} user={authUser.username} />}</WithElectionTabs>}
        {view === 'results' && <WithElectionTabs elections={elections} user={authUser.username}>{(el) => <ResultsView election={el} />}</WithElectionTabs>}
        {view === 'candidates' && <WithElectionTabs elections={elections} user={authUser.username}>{(el) => <CandidatesView election={el} />}</WithElectionTabs>}
        {view === 'users' && <UsersView />}
      </main>
      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 flex justify-around py-2 px-1 z-40">
        {filteredNav.slice(0, 5).map(n => (<button key={n.view} onClick={() => switchView(n.view)} className={cn("flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium min-w-[56px]", view === n.view ? "text-[#5A5A40] bg-[#5A5A40]/10" : "text-gray-400")}>{n.icon}<span>{n.label}</span></button>))}
      </div>
    </div>
  );
}

// ==================== ELECTION TABS WRAPPER ====================
function WithElectionTabs({ elections, user, children }: { elections: Election[]; user: string; children: (el: Election) => React.ReactNode }) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (elections.length === 0) return <div className="text-center py-20"><div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><Vote size={40} /></div><h3 className="text-xl font-serif font-bold text-gray-400 mb-2">Chưa có cuộc bầu cử</h3><p className="text-gray-400">Hãy tạo cuộc bầu cử trước ở mục "Cuộc bầu cử"</p></div>;
  const active = elections[Math.min(activeIdx, elections.length - 1)];
  return (
    <div className="space-y-6">
      {/* Election Tabs */}
      <div className="flex gap-2 flex-wrap">
        {elections.map((el, i) => (
          <button key={el.id} onClick={() => setActiveIdx(i)} className={cn("px-5 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap", i === Math.min(activeIdx, elections.length - 1) ? "bg-[#5A5A40] text-white shadow-md" : "bg-white text-[#5A5A40] border border-black/10 hover:bg-[#5A5A40]/5")}>
            {el.name} <span className="opacity-60 text-xs">(B{el.soUngVien} L{el.soNguoiDuocBau})</span>
          </button>
        ))}
      </div>
      {/* Active election content */}
      <div key={active.id}>{children(active)}</div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setError(''); try { const res = await api.login(username, password); if (res.success) onLogin(res.user); else setError(res.error); } catch { setError('Không thể kết nối server'); } setLoading(false); };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] p-4">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[32px] shadow-2xl max-w-md w-full text-center border border-black/5">
        <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-6 text-white"><Vote size={40} /></div>
        <h1 className="text-3xl font-serif font-bold mb-2">WECVS</h1><p className="text-[#5A5A40] mb-8 italic">Hệ thống Kiểm phiếu Bầu cử Minh bạch</p>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
        <div className="space-y-4 text-left">
          <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Tài khoản</label><input required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20" /></div>
          <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Mật khẩu</label><input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20" /></div>
        </div>
        <button type="submit" disabled={loading} className="w-full mt-8 py-4 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] transition-all disabled:opacity-50 flex items-center justify-center gap-3"><Lock size={20} />{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
    </div>
  );
}

// ==================== ELECTIONS ====================
function ElectionsView({ onSelect, activeId, user, onRefresh }: { onSelect: (e: Election) => void; activeId?: string; user: string; onRefresh?: () => void }) {
  const [elections, setElections] = useState<Election[]>([]); const [showAdd, setShowAdd] = useState(false); const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', soUngVien: 5, soNguoiDuocBau: 3, phieuPhatRa: 0, phieuThuVe: 0 });
  const refresh = async () => { setLoading(true); try { const r = await api.getElections(user); if (r.success) setElections(r.elections); } catch {} setLoading(false); };
  useEffect(() => { refresh(); }, []);

  const [saving, setSaving] = useState(false);
  const handleAdd = async (e: React.FormEvent) => { e.preventDefault(); if (saving) return; setSaving(true); const r = await api.addElection({ ...form, user }); if (r.success) { setShowAdd(false); setForm({ name: '', soUngVien: 5, soNguoiDuocBau: 3, phieuPhatRa: 0, phieuThuVe: 0 }); refresh(); onRefresh?.(); } setSaving(false); };
  const handleDelete = async (id: string) => { if (confirm('Xóa cuộc bầu cử này?')) { await api.deleteElection(id); refresh(); } };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div><h2 className="text-3xl font-serif font-bold">Cuộc bầu cử</h2><p className="text-[#5A5A40] italic">Chọn hoặc tạo cuộc bầu cử để bắt đầu nhập phiếu</p></div>
        <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] flex items-center gap-2"><PlusCircle size={20} />Tạo mới</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {elections.map(e => (
          <div key={e.id} onClick={() => onSelect(e)} className={cn("bg-white p-8 rounded-[28px] shadow-sm border-2 cursor-pointer transition-all hover:shadow-md", activeId === e.id ? "border-[#5A5A40] ring-2 ring-[#5A5A40]/10" : "border-transparent")}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-[#fcfcf9] rounded-2xl flex items-center justify-center text-[#5A5A40]"><Vote size={24} /></div>
              <button onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
            </div>
            <h3 className="text-lg font-serif font-bold mb-1">{e.name}</h3>
            <p className="text-sm text-[#5A5A40] mb-4">Bầu {e.soUngVien} lấy {e.soNguoiDuocBau}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Phát ra: {e.phieuPhatRa}</span><span>Thu về: {e.phieuThuVe}</span>
            </div>
          </div>
        ))}
        {!loading && elections.length === 0 && <div className="col-span-full p-16 text-center border-2 border-dashed border-gray-200 rounded-[28px]"><p className="text-gray-400 italic">Chưa có cuộc bầu cử nào. Nhấn "Tạo mới" để bắt đầu.</p></div>}
      </div>
      {showAdd && <Modal title="Tạo cuộc bầu cử mới" onClose={() => setShowAdd(false)}>
        <form onSubmit={handleAdd} className="space-y-5">
          <Field label="Tên cuộc bầu cử" required><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="inp" placeholder="VD: Đại biểu Quốc hội" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số ứng viên"><input type="number" min="2" value={form.soUngVien} onChange={e => setForm({ ...form, soUngVien: +e.target.value })} className="inp text-center font-bold" /></Field>
            <Field label="Số được bầu"><input type="number" min="1" value={form.soNguoiDuocBau} onChange={e => setForm({ ...form, soNguoiDuocBau: +e.target.value })} className="inp text-center font-bold" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phiếu phát ra"><input type="number" min="0" value={form.phieuPhatRa} onChange={e => setForm({ ...form, phieuPhatRa: +e.target.value })} className="inp text-center" /></Field>
            <Field label="Phiếu thu về"><input type="number" min="0" value={form.phieuThuVe} onChange={e => setForm({ ...form, phieuThuVe: +e.target.value })} className="inp text-center" /></Field>
          </div>
          <div className="p-3 bg-[#5A5A40]/5 rounded-xl text-sm text-[#5A5A40]">Gạch hợp lệ: từ <b>{form.soUngVien - form.soNguoiDuocBau}</b> đến <b>{form.soUngVien - 1}</b> người</div>
          <BtnRow onCancel={() => setShowAdd(false)} label={saving ? 'Đang tạo...' : 'Tạo'} disabled={saving} />
        </form>
      </Modal>}
    </div>
  );
}

// ==================== BALLOT ENTRY ====================
function BallotEntryView({ election, user }: { election: Election; user: string }) {
  const [tab, setTab] = useState<'manual' | 'bulk'>('manual');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recentBallots, setRecentBallots] = useState<Ballot[]>([]);
  const [ballot, setBallot] = useState('');
  const [bulkPattern, setBulkPattern] = useState('');
  const [bulkCount, setBulkCount] = useState('');
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid' | 'success'>('idle');
  const [note, setNote] = useState(''); const [submitting, setSubmitting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    Promise.all([api.getCandidates(election.id), api.getBallots(election.id)]).then(([c, b]) => {
      if (c.success) setCandidates(c.candidates);
      if (b.success) {
        setRecentBallots(b.ballots.slice(-15).reverse());
        const total = b.ballots.reduce((sum: number, bl: Ballot) => sum + (Number(bl.count) || 1), 0);
        console.log('Ballots loaded:', b.ballots.length, 'entries, totalCount:', total, 'sample:', b.ballots[0]);
        setTotalCount(total);
      }
    });
  }, [election.id]);

  const minGach = election.soUngVien - election.soNguoiDuocBau;
  const maxGach = election.soUngVien - 1;

  const validate = useCallback((val: string) => {
    if (!val || val === '0') { setStatus('invalid'); setNote('Phiếu trắng — không hợp lệ'); return; }
    const chars = val.split(''); const validIds = candidates.map(c => c.id);
    for (const ch of chars) { if (!validIds.includes(ch)) { setStatus('invalid'); setNote(`Ứng viên ${ch} không tồn tại`); return; } }
    if (new Set(chars).size !== chars.length) { setStatus('invalid'); setNote('Trùng số'); return; }
    if (chars.length < minGach) { setStatus('invalid'); setNote(`Gạch ${chars.length} (cần tối thiểu ${minGach})`); return; }
    if (chars.length >= election.soUngVien) { setStatus('invalid'); setNote('Gạch hết — phiếu trắng'); return; }
    if (chars.length > maxGach) { setStatus('invalid'); setNote('Gạch quá nhiều'); return; }
    const voted = election.soUngVien - chars.length;
    setStatus('valid'); setNote(`✓ Gạch ${chars.length}, bầu ${voted} người`);
  }, [candidates, election, minGach, maxGach]);

  useEffect(() => { if (ballot) validate(ballot); else { setStatus('idle'); setNote(''); } }, [ballot, validate]);

  const handleManualSubmit = async () => {
    if (submitting) return; setSubmitting(true);
    try {
      const res = await api.addBallot(election.id, ballot || '0', user);
      if (res.success) { setRecentBallots(prev => [res.ballot, ...prev].slice(0, 15)); setTotalCount(s => s + 1); setBallot(''); setStatus('success'); setTimeout(() => setStatus('idle'), 800); }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleBulkSubmit = async () => {
    if (submitting || !bulkPattern || !bulkCount) return; setSubmitting(true);
    try {
      const res = await api.addBulkBallot(election.id, bulkPattern, parseInt(bulkCount), user);
      if (res.success) { setRecentBallots(prev => [res.ballot, ...prev].slice(0, 15)); setTotalCount(s => s + parseInt(bulkCount)); setBulkPattern(''); setBulkCount(''); }
      else alert(res.error);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleManualSubmit(); };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-serif font-bold">{election.name}</h2>
        <p className="text-[#5A5A40] italic">Bầu {election.soUngVien} lấy {election.soNguoiDuocBau} • Gạch hợp lệ: {minGach}→{maxGach} người</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('manual')} className={cn("px-5 py-2.5 rounded-full font-medium text-sm transition-all", tab === 'manual' ? "bg-[#5A5A40] text-white" : "bg-white text-[#5A5A40] border border-black/10")}>✏️ Nhập thủ công</button>
        <button onClick={() => setTab('bulk')} className={cn("px-5 py-2.5 rounded-full font-medium text-sm transition-all", tab === 'bulk' ? "bg-[#5A5A40] text-white" : "bg-white text-[#5A5A40] border border-black/10")}>📦 Nhập theo loại phiếu</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {tab === 'manual' ? (
            <div className={cn("bg-white p-10 rounded-[32px] shadow-sm border-2 transition-all", status === 'valid' ? "border-green-300" : status === 'invalid' ? "border-red-300" : status === 'success' ? "border-blue-300" : "border-black/5")}>
              <div className={cn("h-1.5 rounded-full mb-8 transition-colors", status === 'valid' ? "bg-green-500" : status === 'invalid' ? "bg-red-500" : status === 'success' ? "bg-blue-500" : "bg-[#5A5A40]")} />
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-serif font-bold text-gray-200">#{totalCount + 1}</span>
                <span className="text-sm text-gray-400">Phiếu tiếp theo • Đã nhập: <b className="text-[#5A5A40]">{totalCount}</b>{election.phieuThuVe > 0 && <> / {election.phieuThuVe}{totalCount >= election.phieuThuVe && <span className="text-red-500 font-bold ml-1"> ⚠ ĐÃ ĐỦ!</span>}</>}</span>
              </div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-3">Nhập số ứng viên bị GẠCH</label>
              <input type="text" value={ballot} onChange={e => setBallot(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={handleKeyDown} placeholder="VD: 24 (gạch ứng viên 2 và 4)" autoFocus
                className={cn("w-full text-center text-5xl font-serif font-bold py-6 rounded-2xl border-2 outline-none transition-all tracking-[0.5em]",
                  status === 'valid' ? "border-green-300 bg-green-50/30 text-green-700" : status === 'invalid' ? "border-red-300 bg-red-50/30 text-red-700" : status === 'success' ? "border-blue-300 bg-blue-50/30 text-blue-700" : "border-gray-200 bg-gray-50 focus:border-[#5A5A40]")} />
              {note && <div className={cn("mt-4 p-3 rounded-xl text-sm font-medium", status === 'valid' ? "bg-green-50 text-green-700" : status === 'invalid' ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700")}>{note}</div>}
              {status === 'success' && <div className="mt-4 p-3 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium text-center">✓ Đã lưu! Nhập phiếu tiếp...</div>}
              <div className="mt-8 flex justify-between items-center">
                <span className="text-sm text-gray-400">Nhấn <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-bold">Enter</kbd> để lưu nhanh</span>
                <button onClick={handleManualSubmit} disabled={submitting} className="px-8 py-3 bg-[#5A5A40] text-white rounded-full font-bold shadow-lg hover:bg-[#4a4a35] disabled:opacity-50">Lưu phiếu</button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-black/5">
              <h3 className="text-xl font-serif font-bold mb-6">Nhập theo loại phiếu</h3>
              <p className="text-sm text-gray-500 mb-6">Nhập mẫu phiếu gạch (VD: "12" = gạch ứng viên 1,2) và số lượng phiếu có cùng mẫu đó.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Mẫu gạch</label>
                  <input type="text" value={bulkPattern} onChange={e => setBulkPattern(e.target.value.replace(/[^0-9]/g, ''))} className="inp text-center text-2xl font-bold tracking-[0.3em]" placeholder="VD: 12" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Số lượng phiếu</label>
                  <input type="number" min="1" value={bulkCount} onChange={e => setBulkCount(e.target.value)} className="inp text-center text-2xl font-bold" placeholder="50" />
                </div>
              </div>
              {bulkPattern && <div className="p-3 bg-gray-50 rounded-xl text-sm mb-4">Gạch: <b>{bulkPattern.split('').map(ch => { const c = candidates.find(x => x.id === ch); return c ? c.name : `#${ch}`; }).join(', ')}</b> × {bulkCount || 0} phiếu</div>}
              {election.phieuThuVe > 0 && <div className={cn("p-3 rounded-xl text-sm mb-4 font-medium", totalCount + (parseInt(bulkCount) || 0) > election.phieuThuVe ? "bg-red-100 text-red-700" : "bg-green-50 text-green-700")}>
                Còn lại: <b>{Math.max(0, election.phieuThuVe - totalCount)}</b> phiếu{totalCount + (parseInt(bulkCount) || 0) > election.phieuThuVe && <> — ⚠️ VƯỢT QUÁ {totalCount + (parseInt(bulkCount) || 0) - election.phieuThuVe} phiếu!</>}
              </div>}
              <button onClick={handleBulkSubmit} disabled={submitting || !bulkPattern || !bulkCount} className="px-8 py-3 bg-[#5A5A40] text-white rounded-full font-bold shadow-lg hover:bg-[#4a4a35] disabled:opacity-50">{submitting ? 'Đang lưu...' : 'Lưu loại phiếu'}</button>
            </div>
          )}
          {/* Candidate reference */}
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-black/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-3">Danh sách ứng viên</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {candidates.map(c => <div key={c.id} className={cn("px-3 py-2 rounded-lg text-sm border", ballot.includes(c.id) || bulkPattern.includes(c.id) ? "bg-red-500 text-white border-red-500" : "bg-gray-50 border-gray-100")}><b>{c.id}.</b> {c.name}</div>)}
            </div>
          </div>
        </div>

        {/* Recent ballots */}
        <div className="space-y-4">
          <h3 className="text-lg font-serif font-bold">Phiếu đã nhập ({totalCount})</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {recentBallots.map(b => (
              <div key={b.id} className="bg-white p-4 rounded-[16px] shadow-sm border border-black/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-300">#{b.id}</span>
                    <span className="text-lg font-serif font-bold tracking-widest">{b.pattern === '0' ? '(trắng)' : b.pattern}</span>
                    {b.count > 1 && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">×{b.count}</span>}
                  </div>
                  <p className="text-xs text-gray-400">{b.note}</p>
                </div>
                <div className="flex items-center gap-2">
                  {b.valid ? <CheckCircle2 className="text-green-500 shrink-0" size={20} /> : <XCircle className="text-red-500 shrink-0" size={20} />}
                  <button onClick={async () => { if (confirm(`Xóa phiếu #${b.id}?`)) { await api.deleteBallot(election.id, b.id); setRecentBallots(prev => prev.filter(x => x.id !== b.id)); setTotalCount(s => s - (b.count || 1)); } }} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== RESULTS ====================
function ResultsView({ election }: { election: Election }) {
  const [results, setResults] = useState<Result[]>([]); const [stats, setStats] = useState<Stats>({ totalPhieu: 0, validPhieu: 0, invalidPhieu: 0, blankPhieu: 0 });
  const [progress, setProgress] = useState<Progress>({ phieuPhatRa: 0, phieuThuVe: 0, daNhap: 0, conThieu: 0 });
  const [ballotTypes, setBallotTypes] = useState<BallotType[]>([]); const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'total' | 'types' | 'votecount'>('total');
  const [ballotByVoteCount, setBallotByVoteCount] = useState<Record<string, number>>({});

  const refresh = async () => { setLoading(true); try { const r = await api.getResults(election.id); if (r.success) { setResults(r.results); setStats(r.stats); setProgress(r.progress); setBallotTypes(r.ballotTypes); setBallotByVoteCount(r.ballotByVoteCount || {}); } } catch {} setLoading(false); };

  const exportExcel = () => {
    let csv = '\uFEFF'; // BOM for Excel UTF-8
    csv += `${election.name} — Kết quả kiểm phiếu\n\n`;
    csv += `Phát ra,${progress.phieuPhatRa}\nThu về,${progress.phieuThuVe}\nĐã nhập,${progress.daNhap}\nCòn thiếu,${progress.conThieu}\n\n`;
    csv += `Tổng phiếu,${stats.totalPhieu}\nHợp lệ,${stats.validPhieu}\nKhông hợp lệ,${stats.invalidPhieu}\nPhiếu trắng,${stats.blankPhieu}\n\n`;
    csv += 'Hạng,Ứng viên,Phiếu bầu,Bị gạch,Tỷ lệ %,Kết quả\n';
    results.forEach(r => { csv += `${r.rank},${r.name},${r.votes},${r.crossed},${r.percent}%,${r.elected ? 'Trúng cử' : 'Chưa trúng'}\n`; });
    csv += '\nPhân loại theo số người bầu\nLoại,Số lượng,Tình trạng\n';
    for (let i = 0; i <= election.soUngVien; i++) {
      const hl = ballotByVoteCount['bau_' + i] || 0;
      const khl = ballotByVoteCount['bau_' + i + '_khl'] || 0;
      if (hl > 0) csv += `Bầu ${i} người,${hl},Hợp lệ\n`;
      if (khl > 0) csv += `Bầu ${i} người,${khl},Không hợp lệ\n`;
    }
    csv += '\nChi tiết loại phiếu\nMẫu gạch,Số lượng,Trạng thái,Ghi chú\n';
    ballotTypes.forEach(bt => { csv += `${bt.pattern === '0' ? '(trắng)' : bt.pattern},${bt.count},${bt.valid ? 'Hợp lệ' : 'Không hợp lệ'},${bt.note}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${election.name}_ket_qua.csv`; a.click(); URL.revokeObjectURL(url);
  };
  useEffect(() => { refresh(); }, [election.id]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div><h2 className="text-3xl font-serif font-bold">{election.name} — Kết quả</h2><p className="text-[#5A5A40] italic">Bầu {election.soUngVien} lấy {election.soNguoiDuocBau}</p></div>
        <button onClick={refresh} disabled={loading} className="p-3 bg-white rounded-xl shadow-sm border hover:bg-gray-50 disabled:opacity-50"><RefreshCw size={20} className={cn("text-[#5A5A40]", loading && "animate-spin")} /></button>
      </header>

      <div className={cn("bg-white p-6 rounded-[24px] shadow-sm border", progress.daNhap > progress.phieuThuVe && progress.phieuThuVe > 0 ? "border-red-300 bg-red-50/30" : "border-black/5")}>
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#5A5A40] mb-3">Tiến độ nhập phiếu</h3>
        <div className="flex items-center gap-6 mb-3">
          <div><span className="text-xs text-gray-400">Phát ra</span><p className="text-xl font-bold">{progress.phieuPhatRa}</p></div>
          <div><span className="text-xs text-gray-400">Thu về</span><p className="text-xl font-bold">{progress.phieuThuVe}</p></div>
          <div><span className="text-xs text-gray-400">Đã nhập</span><p className={cn("text-xl font-bold", progress.daNhap > progress.phieuThuVe && progress.phieuThuVe > 0 ? "text-red-600" : "text-green-600")}>{progress.daNhap}</p></div>
          <div><span className="text-xs text-gray-400">{progress.conThieu >= 0 ? 'Còn thiếu' : 'Dư'}</span><p className={cn("text-xl font-bold", progress.conThieu < 0 ? "text-red-600" : progress.conThieu === 0 ? "text-green-600" : "text-orange-500")}>{progress.conThieu < 0 ? `+${Math.abs(progress.conThieu)}` : progress.conThieu}</p></div>
        </div>
        {progress.daNhap > progress.phieuThuVe && progress.phieuThuVe > 0 && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm font-medium mb-3">⚠️ Đã nhập VƯỢT QUÁ số phiếu thu về! Dư <b>{progress.daNhap - progress.phieuThuVe}</b> phiếu — vui lòng kiểm tra lại.</div>}
        {progress.phieuThuVe > 0 && <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden"><div className={cn("h-full rounded-full transition-all", progress.daNhap > progress.phieuThuVe ? "bg-red-500" : "bg-[#5A5A40]")} style={{ width: `${Math.min(100, (progress.daNhap / progress.phieuThuVe) * 100)}%` }} /></div>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <SC label="Tổng phiếu" value={stats.totalPhieu} color="text-blue-500" />
        <SC label="Hợp lệ" value={stats.validPhieu} color="text-green-500" />
        <SC label="Không hợp lệ" value={stats.invalidPhieu} color="text-red-500" />
        <SC label="Phiếu trắng" value={stats.blankPhieu} color="text-gray-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveTab('total')} className={cn("px-5 py-2.5 rounded-full font-medium text-sm", activeTab === 'total' ? "bg-[#5A5A40] text-white" : "bg-white text-[#5A5A40] border border-black/10")}>📊 Tổng kết quả</button>
        <button onClick={() => setActiveTab('votecount')} className={cn("px-5 py-2.5 rounded-full font-medium text-sm", activeTab === 'votecount' ? "bg-[#5A5A40] text-white" : "bg-white text-[#5A5A40] border border-black/10")}>🗳️ Phân loại bầu</button>
        <button onClick={() => setActiveTab('types')} className={cn("px-5 py-2.5 rounded-full font-medium text-sm", activeTab === 'types' ? "bg-[#5A5A40] text-white" : "bg-white text-[#5A5A40] border border-black/10")}>📋 Loại phiếu ({ballotTypes.length})</button>
        <button onClick={exportExcel} className="px-5 py-2.5 rounded-full font-medium text-sm bg-green-600 text-white hover:bg-green-700">📥 Xuất Excel</button>
      </div>

      {activeTab === 'total' && <>
        {/* Chart */}
        <div className="bg-white p-8 rounded-[28px] shadow-sm border border-black/5">
          <h3 className="text-lg font-serif font-bold mb-6">Số phiếu bầu theo ứng viên</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" /><XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fill: '#5A5A40' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={28}>{results.map((r, i) => <Cell key={i} fill={r.elected ? '#5A5A40' : '#d1d1c1'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded-[28px] shadow-sm border border-black/5 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold">
              <tr><th className="px-6 py-3">Hạng</th><th className="px-6 py-3">Ứng viên</th><th className="px-6 py-3 text-right">Phiếu bầu</th><th className="px-6 py-3 text-right">Bị gạch</th><th className="px-6 py-3 text-right">Tỷ lệ</th><th className="px-6 py-3 text-center">Kết quả</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {results.map((r, i) => (
                <tr key={r.id} className={cn("hover:bg-[#fcfcf9]", i < election.soNguoiDuocBau && "bg-[#5A5A40]/5")}>
                  <td className="px-6 py-4 font-serif font-bold text-lg">{r.rank}</td><td className="px-6 py-4 font-medium">{r.name}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-700">{r.votes}</td><td className="px-6 py-4 text-right text-red-400">{r.crossed}</td>
                  <td className="px-6 py-4 text-right">{r.percent}%</td>
                  <td className="px-6 py-4 text-center">{r.elected ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Trúng cử</span> : <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-bold uppercase">Chưa trúng</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}

      {activeTab === 'votecount' && <div className="bg-white rounded-[28px] shadow-sm border border-black/5 overflow-hidden">
        <div className="p-6 border-b border-black/5"><h3 className="text-lg font-serif font-bold">Phân loại theo số người được bầu</h3><p className="text-sm text-gray-500 mt-1">Bầu {election.soUngVien} lấy {election.soNguoiDuocBau} — hợp lệ: bầu {election.soNguoiDuocBau}→{election.soUngVien > 1 ? election.soUngVien - 1 + ' → ' : ''}gạch {election.soUngVien - election.soNguoiDuocBau}→{election.soUngVien - 1} người</p></div>
        <table className="w-full text-left">
          <thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold">
            <tr><th className="px-6 py-3">Loại phiếu</th><th className="px-6 py-3 text-right">Hợp lệ</th><th className="px-6 py-3 text-right">Không hợp lệ</th><th className="px-6 py-3 text-right">Tổng</th></tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {Array.from({ length: election.soUngVien + 1 }, (_, i) => {
              const hl = ballotByVoteCount['bau_' + i] || 0;
              const khl = ballotByVoteCount['bau_' + i + '_khl'] || 0;
              if (hl === 0 && khl === 0) return null;
              const isValid = i >= 1 && i <= election.soNguoiDuocBau;
              return (
                <tr key={i} className={cn("hover:bg-[#fcfcf9]", isValid && "bg-green-50/50")}>
                  <td className="px-6 py-4 font-medium">{i === 0 ? 'Phiếu trắng (bầu 0)' : `Bầu ${i} người (gạch ${election.soUngVien - i})`}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">{hl || '-'}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-500">{khl || '-'}</td>
                  <td className="px-6 py-4 text-right font-bold">{hl + khl}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}

      {activeTab === 'types' && <div className="bg-white rounded-[28px] shadow-sm border border-black/5 overflow-hidden">
          <div className="p-6 border-b border-black/5"><h3 className="text-lg font-serif font-bold">Phân loại phiếu theo mẫu gạch</h3></div>
          <table className="w-full text-left">
            <thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold">
              <tr><th className="px-6 py-3">Mẫu gạch</th><th className="px-6 py-3 text-right">Số lượng</th><th className="px-6 py-3">Trạng thái</th><th className="px-6 py-3">Ghi chú</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {ballotTypes.map((bt, i) => (
                <tr key={i} className="hover:bg-[#fcfcf9]">
                  <td className="px-6 py-4 font-serif font-bold text-xl tracking-widest">{bt.pattern === '0' ? '(trắng)' : bt.pattern}</td>
                  <td className="px-6 py-4 text-right font-bold text-lg">{bt.count}</td>
                  <td className="px-6 py-4">{bt.valid ? <CheckCircle2 size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-500" />}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{bt.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
    </div>
  );
}

function SC({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="bg-white p-5 rounded-[20px] shadow-sm border border-black/5"><p className="text-xs text-[#5A5A40] uppercase tracking-widest font-bold mb-1">{label}</p><p className={cn("text-2xl font-serif font-bold", color)}>{value}</p></div>;
}

// ==================== CANDIDATES ====================
function CandidatesView({ election }: { election: Election }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]); const [showAdd, setShowAdd] = useState(false);
  const [newId, setNewId] = useState(''); const [newName, setNewName] = useState(''); const [loading, setLoading] = useState(true); const [msg, setMsg] = useState('');
  const refresh = async () => { setLoading(true); try { const r = await api.getCandidates(election.id); if (r.success) setCandidates(r.candidates); } catch {} setLoading(false); };
  useEffect(() => { refresh(); }, [election.id]);
  const [saving, setSaving] = useState(false);
  const handleAdd = async (e: React.FormEvent) => { e.preventDefault(); if (saving) return; setSaving(true); setMsg(''); const r = await api.addCandidate(election.id, newId, newName); if (r.success) { setNewId(''); setNewName(''); setShowAdd(false); refresh(); } else setMsg(r.error); setSaving(false); };
  const handleDelete = async (id: string) => { if (confirm('Xóa?')) { await api.deleteCandidate(election.id, id); refresh(); } };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div><h2 className="text-3xl font-serif font-bold">Ứng viên — {election.name}</h2></div>
        <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] flex items-center gap-2"><PlusCircle size={20} />Thêm</button>
      </header>
      <div className="bg-white rounded-[28px] shadow-sm border border-black/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold"><tr><th className="px-8 py-4">STT</th><th className="px-8 py-4">Họ và tên</th><th className="px-8 py-4 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-black/5">{candidates.map(c => (
            <tr key={c.id} className="hover:bg-[#fcfcf9]"><td className="px-8 py-5 font-serif font-bold text-lg">{c.id}</td><td className="px-8 py-5 font-medium">{c.name}</td>
              <td className="px-8 py-5 text-right"><button onClick={() => handleDelete(c.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button></td></tr>
          ))}</tbody>
        </table>
      </div>
      {showAdd && <Modal title="Thêm ứng viên" onClose={() => setShowAdd(false)}>
        <form onSubmit={handleAdd} className="space-y-5">
          {msg && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{msg}</div>}
          <Field label="STT / Mã số"><input required value={newId} onChange={e => setNewId(e.target.value)} className="inp" placeholder="1" /></Field>
          <Field label="Họ và tên"><input required value={newName} onChange={e => setNewName(e.target.value)} className="inp" placeholder="Nguyễn Văn A" /></Field>
          <BtnRow onCancel={() => setShowAdd(false)} label="Thêm" />
        </form>
      </Modal>}
    </div>
  );
}

// ==================== REPORT ====================
function ReportView() {
  const [report, setReport] = useState<Report>({ phieu_nhan_ve: { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 }, phieu_phat_ra: { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 }, phieu_doi_hong: { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 }, phieu_con_lai: { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 } });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [msg, setMsg] = useState('');
  useEffect(() => { api.getReport().then(r => { if (r.success && r.report) setReport(r.report as Report); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const handleChange = (k: keyof Report, f: keyof ReportRow, v: string) => { setReport(p => ({ ...p, [k]: { ...p[k], [f]: parseInt(v) || 0 } })); };
  const handleSave = async () => { setSaving(true); setMsg(''); try { const r = await api.updateReport(report); setMsg(r.success ? '✓ Đã lưu!' : 'Lỗi'); } catch { setMsg('Lỗi kết nối'); } setSaving(false); };
  const labels: Record<string, string> = { phieu_nhan_ve: '1. Số phiếu nhận về', phieu_phat_ra: '2. Số phiếu phát ra', phieu_doi_hong: '3. Phiếu đổi do gạch hỏng', phieu_con_lai: '4. Phiếu còn lại không dùng' };
  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải...</div>;
  return (
    <div className="space-y-6">
      <header><h2 className="text-3xl font-serif font-bold">Báo cáo phiếu bầu cử</h2></header>
      <div className="bg-white rounded-[28px] shadow-sm border border-black/5 overflow-hidden">
        <table className="w-full text-left"><thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold"><tr><th className="px-6 py-3">Nội dung</th><th className="px-6 py-3 text-center">ĐB Quốc hội</th><th className="px-6 py-3 text-center">HĐND TP</th><th className="px-6 py-3 text-center">HĐND xã</th></tr></thead>
          <tbody className="divide-y divide-black/5">{(Object.keys(labels) as (keyof Report)[]).map(k => (
            <tr key={k} className="hover:bg-[#fcfcf9]"><td className="px-6 py-4 font-medium text-sm">{labels[k]}</td>
              {(['quoc_hoi', 'hdnd_tp', 'hdnd_xa'] as (keyof ReportRow)[]).map(f => (
                <td key={f} className="px-6 py-4 text-center"><input type="number" min="0" value={report[k][f]} onChange={e => handleChange(k, f, e.target.value)} className="w-24 text-center px-3 py-2 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20 font-bold" /></td>
              ))}</tr>
          ))}</tbody>
        </table>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] disabled:opacity-50">{saving ? 'Lưu...' : 'Lưu báo cáo'}</button>
        {msg && <span className={cn("text-sm font-medium", msg.includes('✓') ? "text-green-600" : "text-red-600")}>{msg}</span>}
      </div>
    </div>
  );
}

// ==================== USERS ====================
function UsersView() {
  const [users, setUsers] = useState<User[]>([]); const [showAdd, setShowAdd] = useState(false); const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'team', displayName: '' }); const [msg, setMsg] = useState('');
  const refresh = async () => { setLoading(true); try { const r = await api.getUsers(); if (r.success) setUsers(r.users); } catch {} setLoading(false); };
  useEffect(() => { refresh(); }, []);
  const handleAdd = async (e: React.FormEvent) => { e.preventDefault(); setMsg(''); const r = await api.addUser(form.username, form.password, form.role, form.displayName || form.username); if (r.success) { setForm({ username: '', password: '', role: 'team', displayName: '' }); setShowAdd(false); refresh(); } else setMsg(r.error); };
  const handleDelete = async (u: string) => { if (confirm(`Xóa ${u}?`)) { const r = await api.deleteUser(u); if (!r.success) alert(r.error); refresh(); } };
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center"><div><h2 className="text-3xl font-serif font-bold">Quản lý tài khoản</h2></div>
        <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-[#5A5A40] text-white rounded-full font-medium shadow-lg hover:bg-[#4a4a35] flex items-center gap-2"><UserPlus size={20} />Tạo</button></header>
      <div className="bg-white rounded-[28px] shadow-sm border border-black/5 overflow-hidden">
        <table className="w-full text-left"><thead className="bg-[#fcfcf9] text-[#5A5A40] text-xs uppercase tracking-widest font-bold"><tr><th className="px-6 py-3">Tài khoản</th><th className="px-6 py-3">Tên</th><th className="px-6 py-3">Mật khẩu</th><th className="px-6 py-3">Vai trò</th><th className="px-6 py-3 text-right">Xóa</th></tr></thead>
          <tbody className="divide-y divide-black/5">{users.map(u => (
            <tr key={u.username} className="hover:bg-[#fcfcf9]"><td className="px-6 py-4 font-medium">{u.username}</td><td className="px-6 py-4 text-gray-600">{u.displayName}</td><td className="px-6 py-4 text-gray-400 font-mono text-sm">{u.password}</td>
              <td className="px-6 py-4"><span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase", u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>{u.role}</span></td>
              <td className="px-6 py-4 text-right">{u.username !== 'admin' && <button onClick={() => handleDelete(u.username)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>}</td></tr>
          ))}</tbody>
        </table>
      </div>
      {showAdd && <Modal title="Tạo tài khoản" onClose={() => { setShowAdd(false); setMsg(''); }}>
        <form onSubmit={handleAdd} className="space-y-5">
          {msg && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{msg}</div>}
          <Field label="Tài khoản"><input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="inp" /></Field>
          <Field label="Mật khẩu"><input required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="inp" /></Field>
          <Field label="Tên hiển thị"><input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="inp" /></Field>
          <Field label="Vai trò"><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="inp"><option value="team">Tổ bầu cử</option><option value="admin">Admin</option></select></Field>
          <BtnRow onCancel={() => setShowAdd(false)} label="Tạo" />
        </form>
      </Modal>}
    </div>
  );
}

// ==================== SHARED UI ====================
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-md w-full"><h3 className="text-2xl font-serif font-bold mb-6">{title}</h3>{children}</div></div>;
}
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <div><label className="block text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">{label}{required && ' *'}</label>{children}</div>;
}
function BtnRow({ onCancel, label, disabled }: { onCancel: () => void; label: string; disabled?: boolean }) {
  return <div className="flex gap-3 pt-2"><button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-100 text-[#5A5A40] rounded-full font-medium hover:bg-gray-200">Hủy</button><button type="submit" disabled={disabled} className="flex-1 py-3 bg-[#5A5A40] text-white rounded-full font-medium hover:bg-[#4a4a35] disabled:opacity-50">{label}</button></div>;
}
