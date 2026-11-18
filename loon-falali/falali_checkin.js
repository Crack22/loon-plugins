// 法拉利每日签到：账号密码登录 或 Token 两种方式
// 账号1/2/3：falali_token(+2/+3) 或 falali_username(+2/+3) + falali_password(+2/+3)，二选一，都填优先账号密码登录
// 多账号：falali_accounts，每行一个 Token，或 邮箱；密码（中文分号隔开）；行首加 名字| 可自定义通知里的名字
// 通知：固定账号名 falali_name(+2/+3)，不填显示 账号1/2/3；通知末尾汇总今天共领流量
// 登录：POST /api/v1/passport/auth/login {email,password}，取 data.auth_data 作 Token，登录成功后存回对应 Token 栏位
// 状态：GET /api/v1/user/falali-checkin，data = {eligible, checked_today, today_mb}
// 领取：POST /api/v1/user/falali-checkin {}，成功 data.mb = 本次领到的 MB 数
// 请求头 Authorization 直接放 Token，没有 Bearer 前缀
const BASE = "https://pop67xra.faalaa.cc";
const API = BASE + "/api/v1";
const TOKEN_KEY = "falali_token";
const USER_KEY = "falali_username";
const PASS_KEY = "falali_password";
const EXTRA_KEY = "falali_accounts";
const NAME_KEY = "falali_name";
const NAME = "法拉利";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// falali_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// falali_time_mode：fixed = 指定时间 / random = 时间区间随机
// falali_time：指定时间 "HH:MM"，如 09:30
// falali_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "falali_time_enabled";
const TIME_MODE_KEY = "falali_time_mode";
const TIME_KEY = "falali_time";
const TIME_RANGE_KEY = "falali_time_range";
const TIME_TARGET_KEY = "falali_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "falali_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "falali_manual_done"; // 手动运行一次今天已跑过的日期
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

function parseBody(data) {
  try { return JSON.parse(data); } catch (e) { return null; }
}
function isExpired(resp, body) {
  if (resp && (resp.status === 401 || resp.status === 403)) return true;
  var msg = (body && body.message) || "";
  return msg.indexOf("未登录") !== -1 || msg.indexOf("过期") !== -1 || msg.toLowerCase().indexOf("unauthenticated") !== -1;
}

// 收集全部账号：账号1/2/3（固定栏位，账号密码和 Token 二选一）+ 多账号文本框（每行一个 Token，或 邮箱；密码）
function collectAccounts() {
  var list = [];
  for (var n = 0; n < 3; n++) {
    var suf = n === 0 ? "" : String(n + 1);
    var token = (read(TOKEN_KEY + suf) || "").trim();
    var user = (read(USER_KEY + suf) || "").trim();
    var pass = (read(PASS_KEY + suf) || "").trim();
    var name = (read(NAME_KEY + suf) || "").trim();
    var label = name || ("账号" + (n + 1));
    if (user && pass) {
      list.push({ label: label, user: user, pass: pass, tokenKey: TOKEN_KEY + suf });
    } else if (token) {
      list.push({ label: label, token: token });
    }
  }
  var lines = (read(EXTRA_KEY) || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var label = "账号" + (list.length + 1);
    var cred = line;
    var bar = line.indexOf("|");
    if (bar > 0) {
      var nm = line.slice(0, bar).trim();
      var rest = line.slice(bar + 1).trim();
      if (nm && rest) { label = nm; cred = rest; }
    }
    var p = cred.indexOf("；");
    if (p === -1) p = cred.indexOf(";");
    if (p !== -1) {
      var u = cred.slice(0, p).trim(), pw = cred.slice(p + 1).trim();
      if (u && pw) list.push({ label: label, user: u, pass: pw });
    } else if (cred.length >= 10) {
      list.push({ label: label, token: cred });
    }
  }
  return list;
}

var accounts = collectAccounts();
var results = [];
var totalMb = 0;
var idx = 0;

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  runAccount(acct, processNext);
}

function runAccount(acct, next) {
  if (acct.user) {
    login(acct, next);
  } else {
    checkStatus(acct, acct.token, next);
  }
}

function login(acct, next) {
  $httpClient.post({
    url: API + "/passport/auth/login",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA },
    body: JSON.stringify({ email: acct.user, password: acct.pass })
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：登录网络异常，" + e); next(); return; }
    var body = parseBody(d);
    if (!body) { results.push(acct.label + "：登录失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); next(); return; }
    var data = body.data || {};
    if (body.status === "success" && data.auth_data) {
      if (acct.tokenKey) $persistentStore.write(data.auth_data, acct.tokenKey);
      checkStatus(acct, data.auth_data, next);
    } else {
      results.push(acct.label + "：登录失败，" + (body.message || ("HTTP " + (r && r.status))));
      next();
    }
  });
}

function checkStatus(acct, token, next) {
  $httpClient.get({
    url: API + "/user/falali-checkin",
    headers: { "Authorization": token, "Accept": "application/json", "User-Agent": UA }
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：查询签到状态网络异常，" + e); next(); return; }
    var body = parseBody(d);
    if (!body) { results.push(acct.label + "：查询签到状态失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); next(); return; }
    if (body.status === "fail") {
      if (isExpired(r, body)) {
        results.push(acct.label + "：登录已过期，" + (acct.user ? "请检查账号密码" : "打开本站重新抓取 Token"));
      } else {
        results.push(acct.label + "：查询签到状态失败，" + (body.message || ("HTTP " + (r && r.status))));
      }
      next(); return;
    }
    var st = body.data;
    if (!st) { results.push(acct.label + "：签到状态为空，可能不符合签到条件"); next(); return; }
    if (st.eligible === false) { results.push(acct.label + "：当前不符合签到条件"); next(); return; }
    if (st.checked_today) {
      var mb = (st.today_mb !== undefined && st.today_mb !== null) ? st.today_mb : "";
      var n = Number(st.today_mb);
      if (isFinite(n)) totalMb += n;
      results.push(acct.label + "：今日已签到" + (mb !== "" ? "，今天已领 " + mb + " MB" : ""));
      next(); return;
    }
    claim(acct, token, next);
  });
}

function claim(acct, token, next) {
  $httpClient.post({
    url: API + "/user/falali-checkin",
    headers: { "Authorization": token, "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA },
    body: "{}"
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：领取签到网络异常，" + e); next(); return; }
    var body = parseBody(d);
    if (!body) { results.push(acct.label + "：领取签到失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); next(); return; }
    if (body.status === "success" && body.data) {
      var mb = body.data.mb;
      var n = Number(mb);
      if (isFinite(n)) totalMb += n;
      results.push(acct.label + "：签到成功" + ((mb !== undefined && mb !== null) ? "，领到 " + mb + " MB 流量" : ""));
    } else if (isExpired(r, body)) {
      results.push(acct.label + "：登录已过期，" + (acct.user ? "请检查账号密码" : "打开本站重新抓取 Token"));
    } else {
      results.push(acct.label + "：签到失败，" + (body.message || ("HTTP " + (r && r.status))));
    }
    next();
  });
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "在 BoxJs 里填邮箱和密码，或打开本站一次自动抓取 Token");
  } else {
    // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
    $persistentStore.write(todayStr(), TIME_DONE_KEY);
    var body = results.join("\n");
    if (totalMb > 0) body += "\n今天共领 " + totalMb + " MB";
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", body);
  }
  if (manualOn()) $persistentStore.write(todayStr(), MANUAL_DONE_KEY);
  $done({});
}

function main() {
  if (manualOn()) {
    // 手动运行不拦截：手动权限大于自动，只要开了手动开关就跑（跑完需手动关开关）
    processNext();
  } else if (!shouldRunAuto()) {
    $done({});
  } else {
    processNext();
  }
}
main();
