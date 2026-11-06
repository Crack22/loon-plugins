// ChilledMelon 每日签到 cron：账号数量不限
// 账号1：chilledmelon_username + chilledmelon_password
// 更多账号：chilledmelon_accounts，每行一个 账号----密码（四个短横线隔开）
// 登录数量：chilledmelon_max_accounts，填数字只签前 N 个账号，空着就是全部都签
// 流程：BoxJs 读账号密码 → POST /api/auth/login 拿 accessToken → GET /api/auth/me/checkin 查今日状态
// → 未签到则 GET /api/auth/me/checkin/captcha 取运算题 → 算出答案 → POST /api/auth/me/checkin 提交
// 账号密码存在 BoxJs（$persistentStore），不在脚本里
const USER_KEY = 'chilledmelon_username';
const PASS_KEY = 'chilledmelon_password';
const EXTRA_KEY = 'chilledmelon_accounts';
const MAX_KEY = 'chilledmelon_max_accounts';
const BASE = 'https://www.chilledmelon.com';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function read(k) { return $persistentStore.read(k) || ""; }

// 收集全部账号：账号1（单独的键）+ 多账号文本框（每行一个 账号----密码）
function collectAccounts() {
  var list = [];
  var u1 = read(USER_KEY), p1 = read(PASS_KEY);
  if (u1 && p1) list.push({ label: '账号1', user: u1, pass: p1 });
  var lines = (read(EXTRA_KEY) || '').split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var p = line.indexOf('----');
    if (p === -1) continue;
    var u = line.slice(0, p).trim(), pw = line.slice(p + 4).trim();
    if (!u || !pw) continue;
    list.push({ label: '账号' + (list.length + 1), user: u, pass: pw });
  }
  var max = parseInt(read(MAX_KEY) || '0', 10);
  if (max > 0) list = list.slice(0, max);
  return list;
}

var accounts = collectAccounts();
var results = [];
var idx = 0;

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  login(acct, processNext);
}

function finish() {
  if (results.length === 0) {
    $notification.post('ChilledMelon 签到', '还没填账号', '在 BoxJs 里填账号密码，多账号每行一个 账号----密码');
  } else {
    $notification.post('ChilledMelon 签到', '共 ' + results.length + ' 个账号', results.join('\n'));
  }
  $done();
}

function login(acct, next) {
  $httpClient.post({
    url: BASE + '/api/auth/login',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ username: acct.user, password: acct.pass })
  }, function (error, response, data) {
    if (error) { results.push(acct.label + '：登录网络异常'); next(); return; }
    let r = {};
    try { r = JSON.parse(data); } catch (e) {}
    if (response.status === 401 || response.status === 403) {
      results.push(acct.label + '：账号或密码错误'); next(); return;
    }
    if (response.status === 429) {
      results.push(acct.label + '：登录尝试过于频繁，请稍后再试'); next(); return;
    }
    if (!r.accessToken) {
      results.push(acct.label + '：登录失败：' + (r.message || ('HTTP ' + response.status))); next(); return;
    }
    checkStatus(acct, r.accessToken, next);
  });
}

function checkStatus(acct, token, next) {
  const now = new Date();
  const url = BASE + '/api/auth/me/checkin?year=' + now.getFullYear() + '&month=' + (now.getMonth() + 1);
  $httpClient.get({
    url: url,
    headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': UA }
  }, function (error, response, data) {
    if (error) { results.push(acct.label + '：查询签到状态网络异常'); next(); return; }
    let r = {};
    try { r = JSON.parse(data); } catch (e) {}
    if (r.checkedInToday) {
      results.push(acct.label + '：今日已签到，积分 ' + (r.balance || '') + '，今日 +' + (r.todayReward || '') + ' 积分');
      next(); return;
    }
    getCaptcha(acct, token, next);
  });
}

function getCaptcha(acct, token, next) {
  $httpClient.get({
    url: BASE + '/api/auth/me/checkin/captcha',
    headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': UA }
  }, function (error, response, data) {
    if (error) { results.push(acct.label + '：获取验证码网络异常'); next(); return; }
    let r = {};
    try { r = JSON.parse(data); } catch (e) {}
    if (!r.token || !r.question) {
      results.push(acct.label + '：获取验证码失败：' + (r.message || ('HTTP ' + response.status))); next(); return;
    }
    const ans = solve(r.question);
    if (ans === null) {
      results.push(acct.label + '：无法解析运算题：' + r.question); next(); return;
    }
    submit(acct, token, r.token, String(ans), next);
  });
}

function submit(acct, token, captchaToken, answer, next) {
  $httpClient.post({
    url: BASE + '/api/auth/me/checkin',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ captchaToken: captchaToken, captchaAnswer: answer })
  }, function (error, response, data) {
    if (error) { results.push(acct.label + '：提交签到网络异常'); next(); return; }
    let r = {};
    try { r = JSON.parse(data); } catch (e) {}
    if (r.checkedIn) {
      results.push(acct.label + '：签到成功 +' + r.reward + ' 积分，当前 ' + r.balance);
    } else if (response.status === 200 && r.date) {
      results.push(acct.label + '：今日已签到，今日 +' + (r.reward || '') + ' 积分，当前 ' + (r.balance || ''));
    } else {
      results.push(acct.label + '：签到失败，' + (r.message || ('HTTP ' + response.status)));
    }
    next();
  });
}

function solve(q) {
  const m = q.match(/(-?\d+)\s*([+\-×x*÷\/])\s*(-?\d+)/);
  if (!m) return null;
  const a = parseInt(m[1], 10), b = parseInt(m[3], 10), op = m[2];
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '×' || op === 'x' || op === '*') return a * b;
  if (op === '÷' || op === '/') return b === 0 ? null : Math.round(a / b);
  return null;
}

processNext();
