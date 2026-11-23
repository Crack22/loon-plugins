// Thxnk 每日签到（练习生的日常 https://thxnk.cc）：账号密码登录 或 Cookie 两种方式
// 账号1/2/3：thxnk_cookie(+2/+3) 或 thxnk_username(+2/+3) + thxnk_password(+2/+3)，二选一，都填优先账号密码登录
// 多账号：thxnk_accounts，每行一个 Cookie，或 账号；密码（中文分号隔开）；行首加 名字| 可自定义通知里的名字
// 通知：固定账号名 thxnk_name(+2/+3)，不填显示 账号1/2/3
// 登录：POST /api/v1/auth/login {account_name,password,device_id}，可选 otp_code；会话靠 Cookie，登录成功后从 Set-Cookie 取回存回对应 Cookie 栏位
// 状态：GET /api/v1/finance/wallet/me?limit=35，流水里 reference_type=finance.checkin 且 reference_id=当天日期即已签到
// 签到：POST /api/v1/finance/checkins（请求体 {}），成功返回 {wallet,entry,checkin:{checkin_date,reward_minor},idempotent}，已签过 idempotent=true
// 认证：Cookie 请求头；POST 时若 Cookie 里有 next_csrf 再带 X-CSRF-Token 头，并带 X-Requested-With: next-portal
// 网络异常自动重试 2 次（间隔 3 秒，单次超时 60 秒），通知里只显示简短原因
const BASE = "https://thxnk.cc";
const COOKIE_KEY = "thxnk_cookie";
const USER_KEY = "thxnk_username";
const PASS_KEY = "thxnk_password";
const OTP_KEY = "thxnk_otp";
const EXTRA_KEY = "thxnk_accounts";
const NAME_KEY = "thxnk_name";
const DEVICE_KEY = "thxnk_device_id";
const NAME = "Thxnk";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// thxnk_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// thxnk_time_mode：fixed = 指定时间 / random = 时间区间随机
// thxnk_time：指定时间 "HH:MM"，如 09:30
// thxnk_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "thxnk_time_enabled";
const TIME_MODE_KEY = "thxnk_time_mode";
const TIME_KEY = "thxnk_time";
const TIME_RANGE_KEY = "thxnk_time_range";
const TIME_TARGET_KEY = "thxnk_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "thxnk_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "thxnk_manual_done"; // 手动运行一次今天已跑过的日期
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
function getData(body) {
  if (!body) return null;
  if (body.data) return body.data;
  return body;
}
function errMsg(body, st) {
  if (body && body.error) {
    if (body.error.message) return body.error.message;
    if (body.error.code) return body.error.code;
  }
  if (body && (body.message || body.error)) return body.message || body.error;
  if (st === 401 || st === 403) return "账号或密码错误";
  return "HTTP " + st;
}
function isExpired(resp, body) {
  if (resp && (resp.status === 401 || resp.status === 403)) return true;
  if (body && body.ok === false && body.error && (body.error.code === "identity.unauthenticated" || body.error.code === "identity.invalid_session")) return true;
  return false;
}
// 从登录响应的 Set-Cookie 里取出全部 Cookie（名=值；名=值），会话 Cookie 名由服务端定，不硬编码
function extractCookie(headers) {
  if (!headers) return "";
  var vals = [];
  for (var k in headers) {
    if (String(k).toLowerCase() === "set-cookie") {
      var v = headers[k];
      if (Array.isArray(v)) {
        for (var i = 0; i < v.length; i++) vals.push(String(v[i]));
      } else {
        vals.push(String(v));
      }
    }
  }
  var parts = [];
  for (var j = 0; j < vals.length; j++) {
    var first = vals[j].split(";")[0].trim();
    if (first && first.indexOf("=") !== -1) parts.push(first);
  }
  return parts.join("; ");
}
// Cookie 里 next_csrf 的值，POST 时当 X-CSRF-Token 发
function csrfToken(cookie) {
  if (!cookie) return "";
  var m = cookie.match(/(?:^|;\s*)next_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
function withCsrf(headers, cookie) {
  var t = csrfToken(cookie);
  if (t) headers["X-CSRF-Token"] = t;
  return headers;
}
function fmtMinor(minor) {
  if (typeof minor !== "number") return "";
  return (minor / 100).toFixed(2);
}
// 稳定的 device_id：前端存在 localStorage next.portal.device_id，Loon 里存一份复用
function deviceId() {
  var d = (read(DEVICE_KEY) || "").trim();
  if (d) return d;
  function hex(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }
  d = hex(8) + "-" + hex(4) + "-" + hex(4) + "-" + hex(4) + "-" + hex(12);
  $persistentStore.write(d, DEVICE_KEY);
  return d;
}
// 网络异常时重试：最多 2 次，间隔 3 秒；HTTP 响应（哪怕是 401）不重试
function httpReq(method, opts, cb) {
  var tries = 0;
  opts.timeout = 60000; // Loon 的 timeout 单位是毫秒，不是秒
  function go() {
    function done(e, r, d) {
      if (e) {
        tries++;
        if (tries <= 2) { console.log("[Thxnk签到] 请求异常，第 " + tries + " 次重试"); setTimeout(go, 3000); return; }
      }
      cb(e, r, d);
    }
    if (method === "POST") $httpClient.post(opts, done); else $httpClient.get(opts, done);
  }
  go();
}
// 把 Loon 的长错误串缩成一句人话
function shortErr(e) {
  var s = String(e || "");
  if (/timeout/i.test(s)) return "请求超时";
  if (/cancel/i.test(s)) return "请求被取消";
  if (/not connected|offline|network connection/i.test(s)) return "网络未连接";
  if (/dns|host/i.test(s)) return "域名解析失败";
  return s.length > 30 ? s.slice(0, 30) + "…" : s;
}

// 收集全部账号：账号1/2/3（固定栏位，账号密码和 Cookie 二选一）+ 多账号文本框（每行一个 Cookie，或 账号；密码）
function collectAccounts() {
  var list = [];
  for (var n = 0; n < 3; n++) {
    var suf = n === 0 ? "" : String(n + 1);
    var cookie = (read(COOKIE_KEY + suf) || "").trim();
    var user = (read(USER_KEY + suf) || "").trim();
    var pass = (read(PASS_KEY + suf) || "").trim();
    var otp = (read(OTP_KEY + suf) || "").trim();
    var name = (read(NAME_KEY + suf) || "").trim();
    var label = name || ("账号" + (n + 1));
    if (user && pass) {
      list.push({ label: label, user: user, pass: pass, otp: otp, cookieKey: COOKIE_KEY + suf });
    } else if (cookie) {
      list.push({ label: label, cookie: cookie });
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
      if (u && pw) list.push({ label: label, user: u, pass: pw, otp: "" });
    } else if (cred.indexOf("=") !== -1) {
      list.push({ label: label, cookie: cred });
    }
  }
  return list;
}

var accounts = collectAccounts();
var results = [];
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
    checkStatus(acct, acct.cookie, next);
  }
}

function login(acct, next) {
  var payload = { account_name: acct.user, password: acct.pass, device_id: deviceId() };
  if (acct.otp) payload.otp_code = acct.otp;
  httpReq("POST", {
    url: BASE + "/api/v1/auth/login",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "X-Requested-With": "next-portal", "User-Agent": UA },
    body: JSON.stringify(payload)
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：登录网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    var st = r && r.status;
    if (!body) { results.push(acct.label + "：登录失败，服务器返回无法解析（HTTP " + st + "）"); next(); return; }
    if (body.error && body.error.code === "identity.otp_required") {
      results.push(acct.label + "：登录需要验证码，在 BoxJs 填验证码后手动跑一次");
      next(); return;
    }
    var data = getData(body);
    var ok = body.ok !== false && data && data.authenticated !== false && (st >= 200 && st < 300);
    if (!ok) {
      results.push(acct.label + "：登录失败，" + errMsg(body, st));
      next(); return;
    }
    var cookie = extractCookie(r && r.headers);
    if (cookie && acct.cookieKey) $persistentStore.write(cookie, acct.cookieKey);
    checkStatus(acct, cookie || acct.cookie || "", next);
  });
}

function checkStatus(acct, cookie, next) {
  var headers = { "Accept": "application/json", "X-Requested-With": "next-portal", "User-Agent": UA };
  if (cookie) headers["Cookie"] = cookie;
  httpReq("GET", {
    url: BASE + "/api/v1/finance/wallet/me?limit=35",
    headers: headers
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：查询签到状态网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (!body) { results.push(acct.label + "：查询签到状态失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); next(); return; }
    if (isExpired(r, body) || body.ok === false) {
      if (acct.user) {
        results.push(acct.label + "：登录成功但会话未生效，请打开本站一次自动抓取 Cookie");
      } else {
        results.push(acct.label + "：Cookie 已过期，打开本站重新抓取 Cookie");
      }
      next(); return;
    }
    var data = getData(body) || {};
    var wallet = data.wallet || {};
    var items = (data.ledger && data.ledger.items) || [];
    var today = todayStr();
    var signed = false;
    for (var i = 0; i < items.length; i++) {
      var it = items[i] || {};
      var isCheckin = it.reference_type === "finance.checkin" || it.reason === "finance.checkin_reward";
      if (!isCheckin) continue;
      var dt = it.reference_id || String(it.created_at || "").slice(0, 10);
      if (dt === today) { signed = true; break; }
    }
    if (signed) {
      var bal = fmtMinor(wallet.balance_minor);
      results.push(acct.label + "：今日已签到" + (bal !== "" ? "，余额 " + bal + " 只因" : ""));
      next(); return;
    }
    claim(acct, cookie, next);
  });
}

function claim(acct, cookie, next) {
  var headers = { "Content-Type": "application/json", "Accept": "application/json", "X-Requested-With": "next-portal", "User-Agent": UA };
  if (cookie) headers["Cookie"] = cookie;
  withCsrf(headers, cookie);
  httpReq("POST", {
    url: BASE + "/api/v1/finance/checkins",
    headers: headers,
    body: JSON.stringify({})
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：签到网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (!body) { results.push(acct.label + "：签到失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); next(); return; }
    if (isExpired(r, body)) {
      if (acct.user) {
        results.push(acct.label + "：登录成功但会话未生效，请打开本站一次自动抓取 Cookie");
      } else {
        results.push(acct.label + "：Cookie 已过期，打开本站重新抓取 Cookie");
      }
      next(); return;
    }
    if (body.ok === false) {
      results.push(acct.label + "：签到失败，" + errMsg(body, r && r.status));
      next(); return;
    }
    var data = getData(body) || {};
    var checkin = data.checkin || {};
    var wallet = data.wallet || {};
    var reward = fmtMinor(checkin.reward_minor);
    var bal = fmtMinor(wallet.balance_minor);
    if (data.idempotent) {
      results.push(acct.label + "：今日已签到" + (bal !== "" ? "，余额 " + bal + " 只因" : ""));
    } else {
      results.push(acct.label + "：签到成功" + (reward !== "" ? "，+" + reward + " 只因" : "") + (bal !== "" ? "，余额 " + bal + " 只因" : ""));
    }
    next();
  });
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "在 BoxJs 里填账号和密码，或打开本站一次自动抓取 Cookie");
  } else {
    // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
    $persistentStore.write(todayStr(), TIME_DONE_KEY);
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
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
