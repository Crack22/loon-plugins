// FlixPilot 每日签到：账号密码登录 或 Cookie 两种方式
// 账号1/2/3：flixpilot_cookie(+2/+3) 或 flixpilot_username(+2/+3) + flixpilot_password(+2/+3)，二选一，都填优先账号密码登录
// 多账号：flixpilot_accounts，每行一个 Cookie，或 用户名；密码（中文分号隔开）；行首加 名字| 可自定义通知里的名字
// 通知：固定账号名 flixpilot_name(+2/+3)，不填显示 账号1/2/3
// 登录：POST /api/auth/login {username,password}，会话靠 Cookie auth-token，登录成功后从 Set-Cookie 取回存回对应 Cookie 栏位
// 状态：GET /api/auth/me，user = {lastSignIn, signInStreak, popcorn, balance}，lastSignIn 是当天日期即已签到
// 签到：POST /api/auth/sign-in（无请求体），成功 {success, message, popcorn, balance, streak}，已签过 message 为“今天已签到”
// 认证：Cookie 请求头（auth-token），没有 Authorization 头
// 网络异常自动重试 2 次（间隔 3 秒，单次超时 60 秒），通知里只显示简短原因
const BASE = "https://flixpilot.wybcs.work";
const API = BASE + "/api/auth";
const COOKIE_KEY = "flixpilot_cookie";
const USER_KEY = "flixpilot_username";
const PASS_KEY = "flixpilot_password";
const EXTRA_KEY = "flixpilot_accounts";
const NAME_KEY = "flixpilot_name";
const NAME = "FlixPilot";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// flixpilot_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// flixpilot_time_mode：fixed = 指定时间 / random = 时间区间随机
// flixpilot_time：指定时间 "HH:MM"，如 09:30
// flixpilot_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "flixpilot_time_enabled";
const TIME_MODE_KEY = "flixpilot_time_mode";
const TIME_KEY = "flixpilot_time";
const TIME_RANGE_KEY = "flixpilot_time_range";
const TIME_TARGET_KEY = "flixpilot_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "flixpilot_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "flixpilot_manual_done"; // 手动运行一次今天已跑过的日期
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
// Cookie 栏位里可能是完整 Cookie（带 auth-token=），也可能只贴了 auth-token 的值，都归一成 Cookie 请求头
function normalizeCookie(v) {
  var s = (v || "").trim();
  if (!s) return "";
  if (s.indexOf("auth-token=") !== -1) return s;
  return "auth-token=" + s;
}
// 从登录响应的 Set-Cookie 里取出 auth-token（响应头键名大小写不定，值可能是字符串或数组）
function extractAuthToken(headers) {
  if (!headers) return "";
  var vals = [];
  for (var k in headers) {
    if (String(k).toLowerCase() === "set-cookie") {
      var v = headers[k];
      if (v instanceof Array) {
        for (var i = 0; i < v.length; i++) vals.push(String(v[i]));
      } else {
        vals.push(String(v));
      }
    }
  }
  for (var j = 0; j < vals.length; j++) {
    var m = vals[j].match(/auth-token=([^;,\s]+)/);
    if (m && m[1]) return "auth-token=" + m[1];
  }
  return "";
}
function isExpired(resp, body) {
  if (resp && (resp.status === 401 || resp.status === 403)) return true;
  if (body && body.authenticated === false) return true;
  return false;
}
// 网络异常时重试：最多 2 次，间隔 3 秒；HTTP 响应（哪怕是 401）不重试
function httpReq(method, opts, cb) {
  var tries = 0;
  opts.timeout = 60000; // Loon 的 timeout 单位是毫秒，不是秒
  function go() {
    function done(e, r, d) {
      if (e) {
        tries++;
        if (tries <= 2) { console.log("[FlixPilot签到] 请求异常，第 " + tries + " 次重试"); setTimeout(go, 3000); return; }
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

// 收集全部账号：账号1/2/3（固定栏位，账号密码和 Cookie 二选一）+ 多账号文本框（每行一个 Cookie，或 用户名；密码）
function collectAccounts() {
  var list = [];
  for (var n = 0; n < 3; n++) {
    var suf = n === 0 ? "" : String(n + 1);
    var cookie = normalizeCookie(read(COOKIE_KEY + suf));
    var user = (read(USER_KEY + suf) || "").trim();
    var pass = (read(PASS_KEY + suf) || "").trim();
    var name = (read(NAME_KEY + suf) || "").trim();
    var label = name || ("账号" + (n + 1));
    if (user && pass) {
      list.push({ label: label, user: user, pass: pass, cookieKey: COOKIE_KEY + suf });
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
      if (u && pw) list.push({ label: label, user: u, pass: pw });
    } else if (cred.indexOf("auth-token=") !== -1) {
      list.push({ label: label, cookie: cred });
    } else if (cred.length >= 10) {
      list.push({ label: label, cookie: "auth-token=" + cred });
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
  httpReq("POST", {
    url: API + "/login",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA },
    body: JSON.stringify({ username: acct.user, password: acct.pass })
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：登录网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    var st = r && r.status;
    var ok = (st >= 200 && st < 300) || (st === undefined && body && !body.error);
    if (!ok) {
      var msg = (body && (body.error || body.message)) || "";
      if (!msg) {
        if (st === 401 || st === 403) msg = "账号或密码错误";
        else msg = "HTTP " + st;
      }
      results.push(acct.label + "：登录失败，" + msg);
      next(); return;
    }
    var cookie = extractAuthToken(r && r.headers);
    if (cookie && acct.cookieKey) $persistentStore.write(cookie, acct.cookieKey);
    checkStatus(acct, cookie, next);
  });
}

function checkStatus(acct, cookie, next) {
  var headers = { "Accept": "application/json", "User-Agent": UA };
  if (cookie) headers["Cookie"] = cookie;
  httpReq("GET", {
    url: API + "/me",
    headers: headers
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：查询签到状态网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (!body) { results.push(acct.label + "：查询签到状态失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); next(); return; }
    if (isExpired(r, body) || !body.user) {
      if (acct.user) {
        results.push(acct.label + "：登录成功但会话未生效，请打开本站一次自动抓取 Cookie");
      } else {
        results.push(acct.label + "：Cookie 已过期，打开本站重新抓取 Cookie");
      }
      next(); return;
    }
    var u = body.user;
    var last = u.lastSignIn ? String(u.lastSignIn).slice(0, 10) : "";
    if (last === todayStr()) {
      var tail = "";
      if (typeof u.signInStreak === "number") tail += "，连签 " + u.signInStreak + " 天";
      if (typeof u.popcorn === "number") tail += "，爆米花 " + u.popcorn;
      results.push(acct.label + "：今日已签到" + tail);
      next(); return;
    }
    claim(acct, cookie, next);
  });
}

function claim(acct, cookie, next) {
  var headers = { "Accept": "application/json", "User-Agent": UA };
  if (cookie) headers["Cookie"] = cookie;
  httpReq("POST", {
    url: API + "/sign-in",
    headers: headers,
    body: ""
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
    var msg = body.message || "";
    if (body.success) {
      var tail = "";
      if (typeof body.streak === "number") tail += "，连签 " + body.streak + " 天";
      if (typeof body.popcorn === "number") tail += "，爆米花 " + body.popcorn;
      results.push(acct.label + "：" + (msg || "签到成功") + tail);
    } else if (msg === "今天已签到") {
      var tail2 = "";
      if (typeof body.streak === "number") tail2 += "，连签 " + body.streak + " 天";
      if (typeof body.popcorn === "number") tail2 += "，爆米花 " + body.popcorn;
      results.push(acct.label + "：今日已签到" + tail2);
    } else if (body.disabled) {
      results.push(acct.label + "：签到未开启，" + (msg || ("HTTP " + (r && r.status))));
    } else {
      results.push(acct.label + "：签到失败，" + (msg || body.error || ("HTTP " + (r && r.status))));
    }
    next();
  });
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "在 BoxJs 里填用户名和密码，或打开本站一次自动抓取 Cookie");
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
