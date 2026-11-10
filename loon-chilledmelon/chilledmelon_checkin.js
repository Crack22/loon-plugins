// ChilledMelon 每日签到 cron：账号数量不限
// 账号1/2/3：chilledmelon_username(+2/+3) + chilledmelon_password(+2/+3)
// 多账号：chilledmelon_accounts，每行一个 账号；密码（中文分号隔开）
// 流程：BoxJs 读账号密码 → POST /api/auth/login 拿 accessToken → GET /api/auth/me/checkin 查今日状态
// → 未签到则 GET /api/auth/me/checkin/captcha 取运算题 → 算出答案 → POST /api/auth/me/checkin 提交
// 账号密码存在 BoxJs（$persistentStore），不在脚本里
const USER_KEY = 'chilledmelon_username';
const PASS_KEY = 'chilledmelon_password';
const EXTRA_KEY = 'chilledmelon_accounts';
const BASE = 'https://www.chilledmelon.com';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// chilledmelon_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// chilledmelon_time_mode：fixed = 指定时间 / random = 时间区间随机
// chilledmelon_time：指定时间 "HH:MM"，如 09:30
// chilledmelon_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "chilledmelon_time_enabled";
const TIME_MODE_KEY = "chilledmelon_time_mode";
const TIME_KEY = "chilledmelon_time";
const TIME_RANGE_KEY = "chilledmelon_time_range";
const TIME_TARGET_KEY = "chilledmelon_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "chilledmelon_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "chilledmelon_manual_done"; // 手动运行一次今天已跑过的日期
const DEFAULT_TIME_MIN = 9 * 60; // 默认 09:00

// 开关值可能是 "true"/true/"1"/1，都当作开
function isTrue(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}
// 本地日期 YYYY-MM-DD（不用 toISOString，那是 UTC 日期，凌晨会差一天）
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
// 现在是今天的第几分钟（本地时间）
function nowMin() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
// "HH:MM" 转分钟，非法返回 null
function parseHM(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}
// 分钟转 "HH:MM"
function fmtHM(min) {
  const h = Math.floor(min / 60), mi = min % 60;
  return String(h).padStart(2, "0") + ":" + String(mi).padStart(2, "0");
}
// 今天的目标签到时间（分钟）。未启用或配置非法时回落到 09:00
function todayTargetMin() {
  if (!isTrue(read(TIME_ENABLED_KEY))) return DEFAULT_TIME_MIN;
  const mode = (read(TIME_MODE_KEY) || "").trim();
  if (mode === "fixed") {
    const t = parseHM(read(TIME_KEY));
    return t === null ? DEFAULT_TIME_MIN : t;
  }
  if (mode === "random") {
    const range = (read(TIME_RANGE_KEY) || "").trim();
    const parts = range.split("-");
    if (parts.length !== 2) return DEFAULT_TIME_MIN;
    const start = parseHM(parts[0]), end = parseHM(parts[1]);
    if (start === null || end === null || end <= start) return DEFAULT_TIME_MIN;
    const today = todayStr();
    const stored = read(TIME_TARGET_KEY);
    if (stored) {
      const sp = stored.split("|");
      if (sp.length === 2 && sp[0].slice(0, 10) === today && sp[1] === range) {
        const t = parseHM(sp[0].slice(11));
        if (t !== null) return t;
      }
    }
    const pick = start + Math.floor(Math.random() * (end - start + 1));
    $persistentStore.write(today + " " + fmtHM(pick) + "|" + range, TIME_TARGET_KEY);
    return pick;
  }
  return DEFAULT_TIME_MIN;
}
// 自动定时是否该跑：目标时间起 60 分钟内且今天还没跑过（窗口外不跑，避免打开 Loon 时补跑）
// 手动运行开关：没传参数时默认关
function manualOn() {
  try {
    if (typeof $argument === "undefined" || !$argument) return false;
    const v = $argument["manualRun"];
    return v === true || v === "true";
  } catch (e) { return false; }
}
function shouldRunAuto() {
  const today = todayStr();
  if (read(TIME_DONE_KEY) === today) return false;
  const target = todayTargetMin();
  const now = nowMin();
  return now >= target && now < target + 60;
}

// 收集全部账号：账号1（单独的键）+ 多账号文本框（每行一个 账号 密码）
// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个 账号；密码）
function collectAccounts() {
  var list = [];
  var slots = [
    { u: USER_KEY, p: PASS_KEY },
    { u: USER_KEY + "2", p: PASS_KEY + "2" },
    { u: USER_KEY + "3", p: PASS_KEY + "3" }
  ];
  for (var n = 0; n < 3; n++) {
    var u = read(slots[n].u), pw = read(slots[n].p);
    if (u && pw) list.push({ label: "账号" + (n + 1), user: u, pass: pw });
  }
  var lines = (read(EXTRA_KEY) || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var p = line.indexOf("；");
    if (p === -1) p = line.indexOf(";");
    if (p === -1) continue;
    var u = line.slice(0, p).trim(), pw = line.slice(p + 1).trim();
    if (!u || !pw) continue;
    list.push({ label: "账号" + (list.length + 1), user: u, pass: pw });
  }
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
    $notification.post('ChilledMelon 签到', '还没填账号', '在 BoxJs 里填账号密码，多账号每行一个 账号；密码');
  } else {
    // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
    $persistentStore.write(todayStr(), TIME_DONE_KEY);
    $notification.post('ChilledMelon 签到', '共 ' + results.length + ' 个账号', results.join('\n'));
  }
  if (manualOn()) $persistentStore.write(todayStr(), MANUAL_DONE_KEY);
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

if (manualOn()) {
  // 手动运行不拦截：手动权限大于自动，只要开了手动开关就跑（跑完需手动关开关）
  processNext();
} else if (!shouldRunAuto()) {
  $done();
} else {
  processNext();
}
