/**
 * ============================================================
 * HỆ THỐNG KIỂM PHIẾU BẦU CỬ — Google Apps Script Backend
 * ============================================================
 * Paste toàn bộ code này vào Google Sheets → Extensions → Apps Script
 * Deploy → Web App (Execute as: Me, Access: Anyone)
 *
 * TẤT CẢ requests đều dùng GET để tránh CORS issues.
 * Data được encode trong URL param "payload".
 */

// ==================== API ROUTER ====================

function doGet(e) {
  var action = e.parameter.action;
  var payload = {};

  // Parse payload nếu có (cho các action cần data)
  if (e.parameter.payload) {
    try {
      payload = JSON.parse(e.parameter.payload);
    } catch (err) {
      return jsonResponse({ error: 'Invalid payload JSON' });
    }
  }

  var result;

  switch (action) {
    // Read operations
    case 'getConfig':
      result = getConfig();
      break;
    case 'getCandidates':
      result = getCandidates();
      break;
    case 'getBallots':
      result = getBallots();
      break;
    case 'getResults':
      result = getResults();
      break;
    case 'getReport':
      result = getReport();
      break;
    case 'getUsers':
      result = getUsers();
      break;
    case 'getDashboard':
      result = getDashboard();
      break;

    // Write operations (data from payload)
    case 'login':
      result = login(payload.username, payload.password);
      break;
    case 'updateConfig':
      result = updateConfig(payload.config);
      break;
    case 'addCandidate':
      result = addCandidate(payload.id, payload.name);
      break;
    case 'deleteCandidate':
      result = deleteCandidate(payload.id);
      break;
    case 'updateCandidates':
      result = updateCandidates(payload.candidates);
      break;
    case 'addBallot':
      result = addBallot(payload.ballot, payload.user);
      break;
    case 'deleteBallot':
      result = deleteBallot(payload.id);
      break;
    case 'updateReport':
      result = updateReport(payload.report);
      break;
    case 'addUser':
      result = addUser(payload.username, payload.password, payload.role, payload.displayName);
      break;
    case 'deleteUser':
      result = deleteUser(payload.username);
      break;
    case 'updateUser':
      result = updateUser(payload.username, payload.password, payload.role, payload.displayName);
      break;

    default:
      result = { error: 'Unknown action: ' + action };
  }

  return jsonResponse(result);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// doPost giữ làm backup
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  // Route to doGet with same logic
  return doGet({ parameter: { action: data.action, payload: JSON.stringify(data) } });
}

// ==================== HELPER ====================

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function initSheets() {
  var config = getSheet('CONFIG');
  if (config.getLastRow() === 0) {
    config.appendRow(['key', 'value']);
    config.appendRow(['ten_cuoc_bau_cu', 'Bầu cử đại biểu']);
    config.appendRow(['cap_bau_cu', 'Quốc hội']);
    config.appendRow(['so_ung_vien', 8]);
    config.appendRow(['so_nguoi_duoc_bau', 5]);
    config.appendRow(['tong_cu_tri', 300]);
  }

  var candidates = getSheet('CANDIDATES');
  if (candidates.getLastRow() === 0) {
    candidates.appendRow(['id', 'name']);
  }

  var ballots = getSheet('BALLOTS');
  if (ballots.getLastRow() === 0) {
    ballots.appendRow(['id', 'ballot', 'valid', 'note', 'time', 'user']);
  }

  var report = getSheet('REPORT');
  if (report.getLastRow() === 0) {
    report.appendRow(['key', 'quoc_hoi', 'hdnd_tp', 'hdnd_xa']);
    report.appendRow(['phieu_nhan_ve', 0, 0, 0]);
    report.appendRow(['phieu_phat_ra', 0, 0, 0]);
    report.appendRow(['phieu_doi_hong', 0, 0, 0]);
    report.appendRow(['phieu_con_lai', 0, 0, 0]);
  }

  var users = getSheet('USERS');
  if (users.getLastRow() === 0) {
    users.appendRow(['username', 'password', 'role', 'display_name']);
    users.appendRow(['admin', 'admin123', 'admin', 'Quản trị viên']);
  }
}

// ==================== AUTH ====================

function login(username, password) {
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username && String(data[i][1]) === String(password)) {
      return {
        success: true,
        user: {
          username: data[i][0],
          role: data[i][2],
          displayName: data[i][3]
        }
      };
    }
  }

  return { success: false, error: 'Sai tài khoản hoặc mật khẩu' };
}

function getUsers() {
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();
  var users = [];

  for (var i = 1; i < data.length; i++) {
    users.push({
      username: data[i][0],
      password: String(data[i][1]),
      role: data[i][2],
      displayName: data[i][3]
    });
  }

  return { success: true, users: users };
}

function addUser(username, password, role, displayName) {
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      return { success: false, error: 'Tài khoản đã tồn tại' };
    }
  }

  sheet.appendRow([username, password, role || 'team', displayName || username]);
  return { success: true };
}

function deleteUser(username) {
  if (username === 'admin') {
    return { success: false, error: 'Không thể xóa tài khoản admin' };
  }

  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Không tìm thấy tài khoản' };
}

function updateUser(username, password, role, displayName) {
  var sheet = getSheet('USERS');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      if (password) sheet.getRange(i + 1, 2).setValue(password);
      if (role) sheet.getRange(i + 1, 3).setValue(role);
      if (displayName) sheet.getRange(i + 1, 4).setValue(displayName);
      return { success: true };
    }
  }

  return { success: false, error: 'Không tìm thấy tài khoản' };
}

// ==================== CONFIG ====================

function getConfig() {
  var sheet = getSheet('CONFIG');
  var data = sheet.getDataRange().getValues();
  var config = {};

  for (var i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }

  return { success: true, config: config };
}

function updateConfig(config) {
  var sheet = getSheet('CONFIG');
  var data = sheet.getDataRange().getValues();

  for (var key in config) {
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(config[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, config[key]]);
    }
  }

  return { success: true };
}

// ==================== CANDIDATES ====================

function getCandidates() {
  var sheet = getSheet('CANDIDATES');
  var data = sheet.getDataRange().getValues();
  var candidates = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] !== '') {
      candidates.push({
        id: String(data[i][0]),
        name: data[i][1]
      });
    }
  }

  return { success: true, candidates: candidates };
}

function addCandidate(id, name) {
  var sheet = getSheet('CANDIDATES');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      return { success: false, error: 'Mã ứng viên đã tồn tại' };
    }
  }

  sheet.appendRow([id, name]);
  return { success: true };
}

function deleteCandidate(id) {
  var sheet = getSheet('CANDIDATES');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Không tìm thấy ứng viên' };
}

function updateCandidates(candidates) {
  var sheet = getSheet('CANDIDATES');
  sheet.clear();
  sheet.appendRow(['id', 'name']);

  for (var i = 0; i < candidates.length; i++) {
    sheet.appendRow([candidates[i].id, candidates[i].name]);
  }

  return { success: true };
}

// ==================== BALLOTS ====================

function getBallots() {
  var sheet = getSheet('BALLOTS');
  var data = sheet.getDataRange().getValues();
  var ballots = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] !== '') {
      ballots.push({
        id: i,
        ballot: String(data[i][1]),
        valid: data[i][2],
        note: data[i][3],
        time: data[i][4],
        user: data[i][5]
      });
    }
  }

  return { success: true, ballots: ballots };
}

function addBallot(ballot, user) {
  var sheet = getSheet('BALLOTS');
  var configSheet = getSheet('CONFIG');
  var candidateSheet = getSheet('CANDIDATES');

  var configData = configSheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < configData.length; i++) {
    config[configData[i][0]] = configData[i][1];
  }

  var maxVote = parseInt(config['so_nguoi_duoc_bau']) || 5;

  var candidateData = candidateSheet.getDataRange().getValues();
  var validIds = [];
  for (var j = 1; j < candidateData.length; j++) {
    if (candidateData[j][0] !== '') {
      validIds.push(String(candidateData[j][0]));
    }
  }

  var ballotStr = String(ballot).trim();
  var chars = ballotStr.split('');

  var valid = true;
  var note = 'hợp lệ';

  if (ballotStr === '' || ballotStr === '0') {
    valid = true;
    note = 'phiếu trắng';
  } else {
    for (var k = 0; k < chars.length; k++) {
      if (validIds.indexOf(chars[k]) === -1) {
        valid = false;
        note = 'ứng viên ' + chars[k] + ' không tồn tại';
        break;
      }
    }

    if (valid) {
      var seen = {};
      for (var m = 0; m < chars.length; m++) {
        if (seen[chars[m]]) {
          valid = false;
          note = 'trùng số ' + chars[m];
          break;
        }
        seen[chars[m]] = true;
      }
    }

    if (valid && chars.length > maxVote) {
      valid = false;
      note = 'vượt số bầu (tối đa ' + maxVote + ')';
    }
  }

  var id = sheet.getLastRow();
  var time = new Date().toLocaleString('vi-VN');

  sheet.appendRow([id, ballotStr, valid, note, time, user || '']);

  return {
    success: true,
    ballot: {
      id: id,
      ballot: ballotStr,
      valid: valid,
      note: note,
      time: time,
      user: user || ''
    }
  };
}

function deleteBallot(id) {
  var sheet = getSheet('BALLOTS');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Không tìm thấy phiếu' };
}

// ==================== RESULTS ====================

function getResults() {
  var candidateSheet = getSheet('CANDIDATES');
  var ballotSheet = getSheet('BALLOTS');
  var configSheet = getSheet('CONFIG');

  var configData = configSheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < configData.length; i++) {
    config[configData[i][0]] = configData[i][1];
  }
  var maxVote = parseInt(config['so_nguoi_duoc_bau']) || 5;

  var candidateData = candidateSheet.getDataRange().getValues();
  var candidates = {};
  for (var j = 1; j < candidateData.length; j++) {
    if (candidateData[j][0] !== '') {
      candidates[String(candidateData[j][0])] = {
        id: String(candidateData[j][0]),
        name: candidateData[j][1],
        votes: 0
      };
    }
  }

  var ballotData = ballotSheet.getDataRange().getValues();
  var totalBallots = 0;
  var validBallots = 0;
  var invalidBallots = 0;
  var blankBallots = 0;
  var ballotByCount = {};

  for (var k = 1; k < ballotData.length; k++) {
    if (ballotData[k][0] === '') continue;
    totalBallots++;

    var ballotStr = String(ballotData[k][1]);
    var isValid = ballotData[k][2];

    if (isValid === true || isValid === 'TRUE') {
      if (ballotStr === '' || ballotStr === '0') {
        blankBallots++;
        var countKey = 'bau_0';
        ballotByCount[countKey] = (ballotByCount[countKey] || 0) + 1;
      } else {
        validBallots++;
        var chars = ballotStr.split('');
        var countKey2 = 'bau_' + chars.length;
        ballotByCount[countKey2] = (ballotByCount[countKey2] || 0) + 1;

        for (var m = 0; m < chars.length; m++) {
          if (candidates[chars[m]]) {
            candidates[chars[m]].votes++;
          }
        }
      }
    } else {
      invalidBallots++;
    }
  }

  var results = [];
  for (var id in candidates) {
    var c = candidates[id];
    results.push({
      id: c.id,
      name: c.name,
      votes: c.votes,
      percent: validBallots > 0 ? Math.round((c.votes / validBallots) * 10000) / 100 : 0
    });
  }

  results.sort(function(a, b) { return b.votes - a.votes; });

  for (var n = 0; n < results.length; n++) {
    results[n].elected = n < maxVote;
    results[n].rank = n + 1;
  }

  return {
    success: true,
    results: results,
    stats: {
      totalBallots: totalBallots,
      validBallots: validBallots,
      invalidBallots: invalidBallots,
      blankBallots: blankBallots
    },
    ballotByCount: ballotByCount,
    maxVote: maxVote
  };
}

// ==================== REPORT ====================

function getReport() {
  var sheet = getSheet('REPORT');
  var data = sheet.getDataRange().getValues();
  var report = {};

  for (var i = 1; i < data.length; i++) {
    report[data[i][0]] = {
      quoc_hoi: data[i][1] || 0,
      hdnd_tp: data[i][2] || 0,
      hdnd_xa: data[i][3] || 0
    };
  }

  return { success: true, report: report };
}

function updateReport(report) {
  var sheet = getSheet('REPORT');
  sheet.clear();
  sheet.appendRow(['key', 'quoc_hoi', 'hdnd_tp', 'hdnd_xa']);

  var keys = ['phieu_nhan_ve', 'phieu_phat_ra', 'phieu_doi_hong', 'phieu_con_lai'];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var row = report[key] || { quoc_hoi: 0, hdnd_tp: 0, hdnd_xa: 0 };
    sheet.appendRow([key, row.quoc_hoi || 0, row.hdnd_tp || 0, row.hdnd_xa || 0]);
  }

  return { success: true };
}

// ==================== DASHBOARD ====================

function getDashboard() {
  var results = getResults();
  var report = getReport();
  var config = getConfig();

  return {
    success: true,
    results: results,
    report: report.report,
    config: config.config
  };
}

// ==================== INIT ====================
function setupSheets() {
  initSheets();
  SpreadsheetApp.getUi().alert('Đã tạo cấu trúc sheets thành công!');
}
