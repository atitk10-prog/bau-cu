/**
 * HỆ THỐNG KIỂM PHIẾU BẦU CỬ v2 — Multi-Election + 2 cách nhập
 * Paste vào Google Sheets → Extensions → Apps Script
 * Deploy → Web App (Execute as: Me, Access: Anyone)
 */

function doGet(e) {
  var action = e.parameter.action;
  var payload = {};
  if (e.parameter.payload) {
    try { payload = JSON.parse(e.parameter.payload); } catch (err) {
      return jsonResponse({ error: 'Invalid payload JSON' });
    }
  }
  var result;
  switch (action) {
    case 'login': result = login(payload.username, payload.password); break;
    case 'getConfig': result = getConfig(); break;
    case 'updateConfig': result = updateConfig(payload.config); break;
    case 'getElections': result = getElections(payload.user); break;
    case 'addElection': result = addElection(payload); break;
    case 'deleteElection': result = deleteElection(payload.id); break;
    case 'updateElection': result = updateElection(payload); break;
    case 'getCandidates': result = getCandidates(payload.electionId); break;
    case 'addCandidate': result = addCandidate(payload.electionId, payload.id, payload.name); break;
    case 'deleteCandidate': result = deleteCandidate(payload.electionId, payload.id); break;
    case 'saveCandidates': result = saveCandidates(payload.electionId, payload.candidates); break;
    case 'getBallots': result = getBallots(payload.electionId); break;
    case 'addBallot': result = addBallot(payload.electionId, payload.ballot, payload.user); break;
    case 'addBulkBallot': result = addBulkBallot(payload.electionId, payload.pattern, payload.count, payload.user); break;
    case 'deleteBallot': result = deleteBallot(payload.electionId, payload.id); break;
    case 'getResults': result = getResults(payload.electionId); break;
    case 'getReport': result = getReport(); break;
    case 'updateReport': result = updateReport(payload.report); break;
    case 'getUsers': result = getUsers(); break;
    case 'addUser': result = addUser(payload.username, payload.password, payload.role, payload.displayName); break;
    case 'deleteUser': result = deleteUser(payload.username); break;
    default: result = { error: 'Unknown action: ' + action };
  }
  return jsonResponse(result);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  return doGet({ parameter: { action: data.action, payload: JSON.stringify(data) } });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ==================== HELPER ====================
function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

// ==================== AUTH ====================
function login(username, password) {
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username && String(data[i][1]) === String(password)) {
      return { success: true, user: { username: data[i][0], role: data[i][2], displayName: data[i][3] } };
    }
  }
  return { success: false, error: 'Sai tài khoản hoặc mật khẩu' };
}

function getUsers() {
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < data.length; i++) {
    users.push({ username: data[i][0], password: String(data[i][1]), role: data[i][2], displayName: data[i][3] });
  }
  return { success: true, users: users };
}

function addUser(username, password, role, displayName) {
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username) return { success: false, error: 'Tài khoản đã tồn tại' };
  }
  sheet.appendRow([username, password, role || 'team', displayName || username]);
  return { success: true };
}

function deleteUser(username) {
  if (username === 'admin') return { success: false, error: 'Không thể xóa admin' };
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false, error: 'Không tìm thấy' };
}

// ==================== CONFIG ====================
function getConfig() {
  var sheet = getSheet('CONFIG');
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) config[data[i][0]] = data[i][1];
  return { success: true, config: config };
}

function updateConfig(config) {
  var sheet = getSheet('CONFIG');
  var data = sheet.getDataRange().getValues();
  for (var key in config) {
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) { sheet.getRange(i + 1, 2).setValue(config[key]); found = true; break; }
    }
    if (!found) sheet.appendRow([key, config[key]]);
  }
  return { success: true };
}

// ==================== ELECTIONS ====================
function getElections(user) {
  var sheet = getSheet('ELECTIONS');
  var data = sheet.getDataRange().getValues();
  var elections = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] !== '') {
      // Filter by createdBy (column 7) — each user sees only their own elections
      var createdBy = data[i][6] || '';
      if (user && createdBy && createdBy !== user) continue;
      elections.push({
        id: String(data[i][0]),
        name: data[i][1],
        soUngVien: parseInt(data[i][2]) || 0,
        soNguoiDuocBau: parseInt(data[i][3]) || 0,
        phieuPhatRa: parseInt(data[i][4]) || 0,
        phieuThuVe: parseInt(data[i][5]) || 0,
        createdBy: createdBy
      });
    }
  }
  return { success: true, elections: elections };
}

function addElection(p) {
  var sheet = getSheet('ELECTIONS');
  var id = 'e' + Date.now();
  sheet.appendRow([id, p.name, p.soUngVien, p.soNguoiDuocBau, p.phieuPhatRa || 0, p.phieuThuVe || 0, p.user || '']);
  // Create candidate + ballot sheets
  var cSheet = getSheet('C_' + id);
  if (cSheet.getLastRow() === 0) cSheet.appendRow(['id', 'name']);
  var bSheet = getSheet('B_' + id);
  if (bSheet.getLastRow() === 0) bSheet.appendRow(['id', 'pattern', 'count', 'valid', 'note', 'time', 'user', 'type']);
  return { success: true, id: id };
}

function deleteElection(id) {
  var sheet = getSheet('ELECTIONS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      // Delete associated sheets
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var cSheet = ss.getSheetByName('C_' + id);
      if (cSheet) ss.deleteSheet(cSheet);
      var bSheet = ss.getSheetByName('B_' + id);
      if (bSheet) ss.deleteSheet(bSheet);
      return { success: true };
    }
  }
  return { success: false, error: 'Không tìm thấy' };
}

function updateElection(p) {
  var sheet = getSheet('ELECTIONS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      if (p.name !== undefined) sheet.getRange(i + 1, 2).setValue(p.name);
      if (p.soUngVien !== undefined) sheet.getRange(i + 1, 3).setValue(p.soUngVien);
      if (p.soNguoiDuocBau !== undefined) sheet.getRange(i + 1, 4).setValue(p.soNguoiDuocBau);
      if (p.phieuPhatRa !== undefined) sheet.getRange(i + 1, 5).setValue(p.phieuPhatRa);
      if (p.phieuThuVe !== undefined) sheet.getRange(i + 1, 6).setValue(p.phieuThuVe);
      return { success: true };
    }
  }
  return { success: false, error: 'Không tìm thấy' };
}

// ==================== CANDIDATES (per election) ====================
function getCandidates(electionId) {
  var sheet = getSheet('C_' + electionId);
  var data = sheet.getDataRange().getValues();
  var candidates = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] !== '') candidates.push({ id: String(data[i][0]), name: data[i][1] });
  }
  return { success: true, candidates: candidates };
}

function addCandidate(electionId, id, name) {
  var sheet = getSheet('C_' + electionId);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return { success: false, error: 'Mã đã tồn tại' };
  }
  sheet.appendRow([id, name]);
  return { success: true };
}

function deleteCandidate(electionId, id) {
  var sheet = getSheet('C_' + electionId);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false, error: 'Không tìm thấy' };
}

function saveCandidates(electionId, candidates) {
  var sheet = getSheet('C_' + electionId);
  sheet.clear();
  sheet.appendRow(['id', 'name']);
  for (var i = 0; i < candidates.length; i++) {
    sheet.appendRow([candidates[i].id, candidates[i].name]);
  }
  return { success: true };
}

// ==================== BALLOT VALIDATION ====================
function validateBallot(pattern, electionId) {
  // Get election config
  var eSheet = getSheet('ELECTIONS');
  var eData = eSheet.getDataRange().getValues();
  var election = null;
  for (var i = 1; i < eData.length; i++) {
    if (String(eData[i][0]) === String(electionId)) {
      election = { soUngVien: parseInt(eData[i][2]), soNguoiDuocBau: parseInt(eData[i][3]) };
      break;
    }
  }
  if (!election) return { valid: false, note: 'Không tìm thấy cuộc bầu cử' };

  var X = election.soUngVien;
  var Y = election.soNguoiDuocBau;
  var minGach = X - Y; // Gạch tối thiểu để hợp lệ
  var maxGach = X - 1; // Gạch tối đa (gạch hết = phiếu trắng)

  var patternStr = String(pattern).trim();

  // Blank ballot
  if (patternStr === '' || patternStr === '0') {
    return { valid: false, note: 'Phiếu trắng — không hợp lệ', isBlank: true };
  }

  var chars = patternStr.split('');

  // Get valid candidate IDs
  var cSheet = getSheet('C_' + electionId);
  var cData = cSheet.getDataRange().getValues();
  var validIds = [];
  for (var j = 1; j < cData.length; j++) {
    if (cData[j][0] !== '') validIds.push(String(cData[j][0]));
  }

  // Check 1: each number must be a valid candidate
  for (var k = 0; k < chars.length; k++) {
    if (validIds.indexOf(chars[k]) === -1) {
      return { valid: false, note: 'Ứng viên ' + chars[k] + ' không tồn tại' };
    }
  }

  // Check 2: no duplicates
  var seen = {};
  for (var m = 0; m < chars.length; m++) {
    if (seen[chars[m]]) return { valid: false, note: 'Trùng số ' + chars[m] };
    seen[chars[m]] = true;
  }

  // Check 3: number crossed must be in range [minGach, maxGach]
  var numCrossed = chars.length;
  if (numCrossed >= X) {
    return { valid: false, note: 'Gạch hết ' + X + ' người — phiếu trắng', isBlank: true };
  }
  if (numCrossed < minGach) {
    return { valid: false, note: 'Gạch ' + numCrossed + ' (cần tối thiểu ' + minGach + ', bầu quá ' + Y + ' người)' };
  }
  if (numCrossed > maxGach) {
    return { valid: false, note: 'Gạch quá nhiều' };
  }

  var numVoted = X - numCrossed;
  return { valid: true, note: 'Hợp lệ — gạch ' + numCrossed + ', bầu ' + numVoted + ' người' };
}

// ==================== BALLOTS (per election) ====================
function getBallots(electionId) {
  var sheet = getSheet('B_' + electionId);
  var data = sheet.getDataRange().getValues();
  var ballots = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] !== '') {
      ballots.push({
        id: i,
        pattern: String(data[i][1]),
        count: parseInt(data[i][2]) || 1,
        valid: data[i][3],
        note: data[i][4],
        time: data[i][5],
        user: data[i][6],
        type: data[i][7] || 'manual'
      });
    }
  }
  return { success: true, ballots: ballots };
}

// Cách 1: Nhập thủ công từng phiếu
function addBallot(electionId, ballot, user) {
  var sheet = getSheet('B_' + electionId);
  var v = validateBallot(ballot, electionId);
  var id = sheet.getLastRow();
  var time = new Date().toLocaleString('vi-VN');

  sheet.appendRow([id, String(ballot).trim(), 1, v.valid, v.note, time, user || '', 'manual']);

  return {
    success: true,
    ballot: { id: id, pattern: String(ballot).trim(), count: 1, valid: v.valid, note: v.note, time: time, user: user || '', type: 'manual' }
  };
}

// Cách 2: Nhập theo loại phiếu với số lượng
function addBulkBallot(electionId, pattern, count, user) {
  var sheet = getSheet('B_' + electionId);
  var v = validateBallot(pattern, electionId);
  var id = sheet.getLastRow();
  var time = new Date().toLocaleString('vi-VN');
  var cnt = parseInt(count) || 0;

  if (cnt <= 0) return { success: false, error: 'Số lượng phải > 0' };

  sheet.appendRow([id, String(pattern).trim(), cnt, v.valid, v.note, time, user || '', 'bulk']);

  return {
    success: true,
    ballot: { id: id, pattern: String(pattern).trim(), count: cnt, valid: v.valid, note: v.note, time: time, user: user || '', type: 'bulk' }
  };
}

function deleteBallot(electionId, id) {
  var sheet = getSheet('B_' + electionId);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false, error: 'Không tìm thấy' };
}

// ==================== RESULTS (per election) ====================
function getResults(electionId) {
  // Election info
  var eSheet = getSheet('ELECTIONS');
  var eData = eSheet.getDataRange().getValues();
  var election = null;
  for (var i = 1; i < eData.length; i++) {
    if (String(eData[i][0]) === String(electionId)) {
      election = {
        id: String(eData[i][0]), name: eData[i][1],
        soUngVien: parseInt(eData[i][2]), soNguoiDuocBau: parseInt(eData[i][3]),
        phieuPhatRa: parseInt(eData[i][4]) || 0, phieuThuVe: parseInt(eData[i][5]) || 0
      };
      break;
    }
  }
  if (!election) return { success: false, error: 'Không tìm thấy cuộc bầu cử' };

  // Candidates
  var cSheet = getSheet('C_' + electionId);
  var cData = cSheet.getDataRange().getValues();
  var candidates = {};
  for (var j = 1; j < cData.length; j++) {
    if (cData[j][0] !== '') {
      candidates[String(cData[j][0])] = { id: String(cData[j][0]), name: cData[j][1], votes: 0, crossed: 0 };
    }
  }

  // Ballots
  var bSheet = getSheet('B_' + electionId);
  var bData = bSheet.getDataRange().getValues();
  var totalPhieu = 0, validPhieu = 0, invalidPhieu = 0, blankPhieu = 0;
  var ballotTypes = {}; // pattern → { count, valid }
  var ballotByVoteCount = {}; // "bau_X" → count

  for (var k = 1; k < bData.length; k++) {
    if (bData[k][0] === '') continue;
    var pattern = String(bData[k][1]);
    var count = parseInt(bData[k][2]) || 1;
    var isValid = bData[k][3];

    totalPhieu += count;

    // Group by pattern type
    var typeKey = pattern || '0';
    if (!ballotTypes[typeKey]) ballotTypes[typeKey] = { pattern: typeKey, count: 0, valid: isValid, note: bData[k][4] };
    ballotTypes[typeKey].count += count;

    if (isValid === true || isValid === 'TRUE') {
      if (pattern === '' || pattern === '0') {
        blankPhieu += count;
        var bk0 = 'bau_0';
        ballotByVoteCount[bk0] = (ballotByVoteCount[bk0] || 0) + count;
      } else {
        validPhieu += count;
        var chars = pattern.split('');
        var numVoted = election.soUngVien - chars.length;
        var bkV = 'bau_' + numVoted;
        ballotByVoteCount[bkV] = (ballotByVoteCount[bkV] || 0) + count;
        // Crossed candidates
        for (var m = 0; m < chars.length; m++) {
          if (candidates[chars[m]]) candidates[chars[m]].crossed += count;
        }
        // Voted candidates = all candidates NOT in pattern
        for (var cid in candidates) {
          if (chars.indexOf(cid) === -1) candidates[cid].votes += count;
        }
      }
    } else {
      invalidPhieu += count;
      // Also track vote count for invalid ones
      if (pattern === '' || pattern === '0') {
        var bk0i = 'bau_0_khl';
        ballotByVoteCount[bk0i] = (ballotByVoteCount[bk0i] || 0) + count;
      } else {
        var numVotedI = election.soUngVien - pattern.split('').length;
        if (numVotedI < 0) numVotedI = 0;
        var bkI = 'bau_' + numVotedI + '_khl';
        ballotByVoteCount[bkI] = (ballotByVoteCount[bkI] || 0) + count;
      }
    }
  }

  // Build results
  var results = [];
  for (var rid in candidates) {
    var c = candidates[rid];
    results.push({
      id: c.id, name: c.name, votes: c.votes, crossed: c.crossed,
      percent: validPhieu > 0 ? Math.round((c.votes / validPhieu) * 10000) / 100 : 0
    });
  }
  results.sort(function(a, b) { return b.votes - a.votes; });
  for (var n = 0; n < results.length; n++) {
    results[n].elected = n < election.soNguoiDuocBau;
    results[n].rank = n + 1;
  }

  // Ballot types array
  var typesArr = [];
  for (var tk in ballotTypes) typesArr.push(ballotTypes[tk]);
  typesArr.sort(function(a, b) { return b.count - a.count; });

  return {
    success: true,
    election: election,
    results: results,
    stats: { totalPhieu: totalPhieu, validPhieu: validPhieu, invalidPhieu: invalidPhieu, blankPhieu: blankPhieu },
    ballotTypes: typesArr,
    ballotByVoteCount: ballotByVoteCount,
    progress: {
      phieuPhatRa: election.phieuPhatRa,
      phieuThuVe: election.phieuThuVe,
      daNhap: totalPhieu,
      conThieu: election.phieuThuVe - totalPhieu
    }
  };
}

// ==================== REPORT ====================
function getReport() {
  var sheet = getSheet('REPORT');
  var data = sheet.getDataRange().getValues();
  var report = {};
  for (var i = 1; i < data.length; i++) {
    report[data[i][0]] = { quoc_hoi: data[i][1] || 0, hdnd_tp: data[i][2] || 0, hdnd_xa: data[i][3] || 0 };
  }
  return { success: true, report: report };
}

function updateReport(report) {
  var sheet = getSheet('REPORT');
  sheet.clear();
  sheet.appendRow(['key', 'quoc_hoi', 'hdnd_tp', 'hdnd_xa']);
  var keys = ['phieu_nhan_ve', 'phieu_phat_ra', 'phieu_doi_hong', 'phieu_con_lai'];
  for (var i = 0; i < keys.length; i++) {
    var row = report[keys[i]] || { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 };
    sheet.appendRow([keys[i], row.quoc_hoi || 0, row.hdnd_tp || 0, row.hdnd_xa || 0]);
  }
  return { success: true };
}

// ==================== INIT ====================
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // CONFIG
  var config = getSheet('CONFIG');
  if (config.getLastRow() === 0) {
    config.appendRow(['key', 'value']);
    config.appendRow(['ten_he_thong', 'Hệ thống kiểm phiếu bầu cử']);
  }
  // ELECTIONS
  var elections = getSheet('ELECTIONS');
  if (elections.getLastRow() === 0) {
    elections.appendRow(['id', 'name', 'so_ung_vien', 'so_nguoi_duoc_bau', 'phieu_phat_ra', 'phieu_thu_ve', 'created_by']);
  }
  // REPORT
  var report = getSheet('REPORT');
  if (report.getLastRow() === 0) {
    report.appendRow(['key', 'quoc_hoi', 'hdnd_tp', 'hdnd_xa']);
    report.appendRow(['phieu_nhan_ve', 0, 0, 0]);
    report.appendRow(['phieu_phat_ra', 0, 0, 0]);
    report.appendRow(['phieu_doi_hong', 0, 0, 0]);
    report.appendRow(['phieu_con_lai', 0, 0, 0]);
  }
  // USERS
  var users = getSheet('USERS');
  if (users.getLastRow() === 0) {
    users.appendRow(['username', 'password', 'role', 'display_name']);
    users.appendRow(['admin', 'admin123', 'admin', 'Quản trị viên']);
  }
  SpreadsheetApp.getUi().alert('Đã tạo cấu trúc sheets thành công!');
}
