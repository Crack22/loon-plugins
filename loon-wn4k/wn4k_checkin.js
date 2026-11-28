// 蜗牛emby每日签到：Cookie session_id 或账号密码登录（二选一，登录优先，登录后把新 session_id 存回）
// 账号1/2/3：wn4k_cookie(+2/+3) / wn4k_username(+2/+3) + wn4k_password(+2/+3)
// 多账号：wn4k_accounts，每行一个完整 Cookie，或 用户名；密码（全角分号隔开）；行首加 名字| 可自定义通知里的名字
// 通知：固定账号名 wn4k_name(+2/+3)，不填显示 账号1/2/3
// 状态：GET /api/user/points/info，Cookie 认证
//   成功 {"status":"success","data":{"points":64,"has_checked_in":false,"config":{"checkin_min":"30","checkin_max":"50","enable_streak_bonus":"1","streak_7_days":"100","streak_30_days":"500"}}}
//   未登录 {"status":"error","message":"未登录"}；has_checked_in 为 true 表示今日已签到
// 签到：POST /api/user/points/checkin，无请求体
//   成功 {"status":"success","message":"签到成功，获得 36 积分","reward":36,"balance":100,"streak_count":2,"streak_bonus":0}
// 登录：POST /api/requests/auth，JSON 体 {"username":"...","password":"..."}，成功 {"status":"success"}，Set-Cookie 里取 session_id
// 奖励每天 30~50 积分浮动；连签 7 天 +100，30 天 +500
// 续期提醒（余额触发，当天 12:00 单独发，无 5 天定时）：
//   签到查到 balance >= 150 时记一个待发标记（按日期存，带余额）；之后每分钟的 cron 里，当前时间 >= 12:00 且当天还没发过，
//   就单独发一条“积分已满150分，可以去续期30天了”，发完记下当天已发，同一天不再重复发。
//   12:00 之前签到满 150，当天 12:00 发；签到本身在 12:00 之后（比如手动运行），签到当时直接发，不用等第二天。
//   余额 < 150 不发；开关 wn4k_renew_notify 关掉时不发；只通知，绝不自动续期
// 网络异常自动重试 2 次（间隔 3 秒，单次超时 60 秒），通知里只显示简短原因，不写 Cookie 值
const HOST = "https://wn4k.ykvip.net";
const PROFILE = HOST + "/request?tab=profile";
const INFO_URL = HOST + "/api/user/points/info";
const CHECKIN_URL = HOST + "/api/user/points/checkin";
const LOGIN_URL = HOST + "/api/requests/auth";
const COOKIE_KEY = "wn4k_cookie";
const USER_KEY = "wn4k_username";
const PASS_KEY = "wn4k_password";
const EXTRA_KEY = "wn4k_accounts";
const NAME_KEY = "wn4k_name";
const RENEW_NOTIFY_KEY = "wn4k_renew_notify"; // 续期提醒开关，默认开
const RENEW_PENDING_KEY = "wn4k_renew_pending"; // 待发续期提醒，格式 "YYYY-MM-DD|余额"
const RENEW_SENT_KEY = "wn4k_renew_sent"; // 当天已发过续期提醒的日期 "YYYY-MM-DD"
const RENEW_THRESHOLD = 150; // 续期 30 天要 150 积分
const RENEW_HOUR_MIN = 12 * 60; // 续期提醒 12:00 发
const NAME = "蜗牛emby";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.3 Mobile/15E148 Safari/604.1";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// wn4k_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// wn4k_time_mode：fixed = 指定时间 / random = 时间区间随机
// wn4k_time：指定时间 "HH:MM"，如 09:30
// wn4k_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "wn4k_time_enabled";
const TIME_MODE_KEY = "wn4k_time_mode";
const TIME_KEY = "wn4k_time";
const TIME_RANGE_KEY = "wn4k_time_range";
const TIME_TARGET_KEY = "wn4k_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "wn4k_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "wn4k_manual_done"; // 手动运行一次今天已跑过的日期
const DEFAULT_TIME_MIN = 9 * 60; // 默认 09:00

// 开关值可能是 "true"/true/"1"/1，都当作开
function isTrue(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}
// 续期提醒开关：没填（默认）当作开，只有明确关掉才不发
function renewNotifyOn() {
  var v = read(RENEW_NOTIFY_KEY);
  if (v === "" || v === null || typeof v === "undefined") return true;
  return isTrue(v);
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

// ---------- 续期提醒（余额触发，当天 12:00 单独发） ----------
// 今天待发的续期提醒余额；没有、不是今天的、或余额不够时返回 null
function pendingRenewBalance() {
  var p = read(RENEW_PENDING_KEY);
  if (!p) return null;
  var parts = String(p).split("|");
  if (parts.length !== 2 || parts[0] !== todayStr()) return null;
  var b = parseInt(parts[1], 10);
  if (isNaN(b) || b < RENEW_THRESHOLD) return null;
  return b;
}
// 现在该发续期提醒吗：开关开着 + 今天有待发标记 + 还没发过 + 已到 12:00
function shouldSendRenewal() {
  if (!renewNotifyOn()) return false;
  if (read(RENEW_SENT_KEY) === todayStr()) return false;
  if (pendingRenewBalance() === null) return false;
  return nowMin() >= RENEW_HOUR_MIN;
}
// 单独发一条续期提醒，发完记下当天已发
function sendRenewal() {
  var b = pendingRenewBalance();
  var body = "积分已满150分，可以去续期30天了";
  if (b !== null) body += "（当前余额 " + b + " Pts）";
  $notification.post(NAME + "续期提醒", "积分已满150分", body);
  $persistentStore.write(todayStr(), RENEW_SENT_KEY);
}
// 签到查到余额后记待发标记：满 150 就记下今天待发；不够 150 就清掉今天的待发标记（余额不够不发）
function noteBalance(acct, balance) {
  if (typeof balance !== "number") return;
  if (balance >= RENEW_THRESHOLD) {
    if (!renewNotifyOn()) return;
    $persistentStore.write(todayStr() + "|" + balance, RENEW_PENDING_KEY);
  } else {
    var p = read(RENEW_PENDING_KEY);
    if (p && String(p).split("|")[0] === todayStr()) $persistentStore.write("", RENEW_PENDING_KEY);
  }
}

function parseBody(data) {
  try { return JSON.parse(data); } catch (e) { return null; }
}
// 网络异常时重试：最多 2 次，间隔 3 秒；HTTP 响应（哪怕是业务失败）不重试
function httpReq(method, opts, cb) {
  var tries = 0;
  opts.timeout = 60000; // Loon 的 timeout 单位是毫秒，不是秒
  function go() {
    function done(e, r, d) {
      if (e) {
        tries++;
        if (tries <= 2) { console.log("[蜗牛emby签到] 请求异常，第 " + tries + " 次重试"); setTimeout(go, 3000); return; }
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
// Cookie 归一化：存的可能是完整 Cookie（含 session_id=）或裸 session_id 值；裸值补上 session_id=
function normalizeCookie(v) {
  var s = String(v || "").trim();
  if (!s) return "";
  if (s.indexOf("session_id=") !== -1) return s;
  return "session_id=" + s;
}
function headersFor(acct) {
  return { "Accept": "application/json, text/plain, */*", "User-Agent": UA, "Origin": HOST, "Referer": PROFILE, "Cookie": acct.cookie };
}
function getSetCookie(resp) {
  if (!resp || !resp.headers) return "";
  var h = resp.headers;
  var v = h["Set-Cookie"] || h["set-cookie"] || h["SET-COOKIE"] || "";
  if (Array.isArray(v)) return v.join("\n");
  return v || "";
}
// 从 Set-Cookie 里取 session_id 的值
function extractSessionId(setCookieStr) {
  var m = String(setCookieStr || "").match(/session_id=([^;,\s]+)/);
  return m ? m[1] : "";
}
// 响应是不是“未登录”
function isNotLoggedIn(r, body) {
  if (r && (r.status === 401 || r.status === 403)) return true;
  if (body && body.status === "error" && String(body.message || "").indexOf("未登录") !== -1) return true;
  return false;
}
// 从状态/签到返回里取连签天数（字段名可能不同，都试一遍）
function findStreak(data) {
  if (!data) return null;
  var cands = [data.streak_count, data.streak, data.continuesDay, data.continue_days, data.streak_days];
  for (var i = 0; i < cands.length; i++) {
    if (typeof cands[i] === "number") return cands[i];
  }
  return null;
}
function streakTail(data) {
  var s = findStreak(data);
  return s === null ? "" : "，连签 " + s + " 天";
}

// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个）
// 固定栏位：Cookie（wn4k_cookie）或 用户名+密码（wn4k_username/wn4k_password），有 Cookie 优先用 Cookie
// 多账号：每行一个完整 Cookie，或 用户名；密码（全角分号）；行首加 名字| 可自定义通知里的名字
function splitName(line) {
  var bar = line.indexOf("|");
  if (bar > 0) {
    var nm = line.slice(0, bar).trim();
    var rest = line.slice(bar + 1).trim();
    if (nm && rest && nm.length <= 20 && nm.indexOf("=") === -1 && nm.indexOf(";") === -1 && nm.indexOf("；") === -1) return { name: nm, rest: rest };
  }
  return { name: "", rest: line };
}
function collectAccounts() {
  var list = [];
  for (var n = 0; n < 3; n++) {
    var suf = n === 0 ? "" : String(n + 1);
    var cookie = normalizeCookie(read(COOKIE_KEY + suf));
    var user = (read(USER_KEY + suf) || "").trim();
    var pass = (read(PASS_KEY + suf) || "").trim();
    var name = (read(NAME_KEY + suf) || "").trim();
    var label = name || ("账号" + (n + 1));
    if (!cookie && !(user && pass)) continue;
    list.push({ label: label, cookie: cookie, user: user, pass: pass, cookieKey: COOKIE_KEY + suf, _triedLogin: false });
  }
  var lines = (read(EXTRA_KEY) || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var sn = splitName(line);
    line = sn.rest;
    var a = { label: "", cookie: "", user: "", pass: "", cookieKey: "", _triedLogin: false };
    var p = line.indexOf("；");
    if (p === -1) p = line.indexOf(";");
    if (p !== -1) {
      a.user = line.slice(0, p).trim();
      a.pass = line.slice(p + 1).trim();
      if (!a.user || !a.pass) continue;
    } else {
      a.cookie = normalizeCookie(line);
    }
    a.label = sn.name || ("账号" + (list.length + 1));
    list.push(a);
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
  if (acct.cookie) {
    checkStatus(acct, next);
  } else if (acct.user && acct.pass) {
    doLogin(acct, function (ok) {
      if (!ok) { next(); return; }
      checkStatus(acct, next);
    });
  } else {
    results.push(acct.label + "：Cookie 和账号密码都没填");
    next();
  }
}

// 账号密码登录：POST /api/requests/auth，成功后把新 session_id 存回该账号的 Cookie 栏位
function doLogin(acct, cb) {
  httpReq("POST", {
    url: LOGIN_URL,
    headers: { "Accept": "application/json, text/plain, */*", "User-Agent": UA, "Origin": HOST, "Referer": PROFILE, "Content-Type": "application/json" },
    body: JSON.stringify({ username: acct.user, password: acct.pass })
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：登录网络异常，" + shortErr(e)); cb(false); return; }
    var body = parseBody(d);
    if (!body || body.status !== "success") {
      var msg = body ? String(body.message || body.msg || "") : "";
      results.push(acct.label + "：登录失败，" + (msg || ("HTTP " + (r && r.status))));
      cb(false); return;
    }
    var sid = extractSessionId(getSetCookie(r));
    if (!sid) {
      results.push(acct.label + "：登录成功但没拿到 session_id，请打开网站重新抓取 Cookie");
      cb(false); return;
    }
    acct.cookie = "session_id=" + sid;
    if (acct.cookieKey) $persistentStore.write(acct.cookie, acct.cookieKey);
    cb(true);
  });
}

function checkStatus(acct, next) {
  httpReq("GET", {
    url: INFO_URL,
    headers: headersFor(acct)
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：查询签到状态网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (isNotLoggedIn(r, body)) {
      // Cookie 已过期：有账号密码就重新登录一次再试，没账号密码就报过期
      if (acct.user && acct.pass && !acct._triedLogin) {
        acct._triedLogin = true;
        doLogin(acct, function (ok) {
          if (!ok) { next(); return; }
          checkStatus(acct, next);
        });
        return;
      }
      results.push(acct.label + "：查询签到状态失败，Cookie 已过期，打开网站重新抓取");
      next(); return;
    }
    if (!body || body.status !== "success" || !body.data) {
      results.push(acct.label + "：查询签到状态失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
      next(); return;
    }
    var data = body.data;
    var balance = (typeof data.points === "number") ? data.points : null;
    if (data.has_checked_in) {
      var tail = "";
      if (balance !== null) tail += "，余额 " + balance + " Pts";
      tail += streakTail(data);
      results.push(acct.label + "：今日已签到" + tail);
      if (balance !== null) noteBalance(acct, balance);
      next(); return;
    }
    claim(acct, next);
  });
}

function claim(acct, next) {
  httpReq("POST", {
    url: CHECKIN_URL,
    headers: headersFor(acct),
    body: ""
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：签到网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (isNotLoggedIn(r, body)) {
      if (acct.user && acct.pass && !acct._triedLogin) {
        acct._triedLogin = true;
        doLogin(acct, function (ok) {
          if (!ok) { next(); return; }
          checkStatus(acct, next);
        });
        return;
      }
      results.push(acct.label + "：签到失败，Cookie 已过期，打开网站重新抓取");
      next(); return;
    }
    if (!body) {
      results.push(acct.label + "：签到失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
      next(); return;
    }
    var msg = String(body.message || body.msg || "");
    if (body.status === "success") {
      var tail = "";
      if (typeof body.reward === "number") tail += "，+" + body.reward + " Pts";
      if (typeof body.balance === "number") tail += "，余额 " + body.balance + " Pts";
      tail += streakTail(body);
      results.push(acct.label + "：签到成功" + tail);
      if (typeof body.balance === "number") noteBalance(acct, body.balance);
      next(); return;
    }
    if (msg.indexOf("已签") !== -1) {
      var tail2 = "";
      if (typeof body.balance === "number") tail2 += "，余额 " + body.balance + " Pts";
      tail2 += streakTail(body);
      results.push(acct.label + "：今日已签到" + tail2);
      if (typeof body.balance === "number") noteBalance(acct, body.balance);
      next(); return;
    }
    results.push(acct.label + "：签到失败，" + (msg || ("HTTP " + (r && r.status))));
    next();
  });
}

function finish() {
  // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
  $persistentStore.write(todayStr(), TIME_DONE_KEY);
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "打开网站一次自动抓取 Cookie，或在 BoxJs 里填账号密码");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  // 签到本身在 12:00 之后：余额满 150 的续期提醒签到当时直接发，不用等第二天
  if (results.length > 0 && shouldSendRenewal()) sendRenewal();
  if (manualOn()) $persistentStore.write(todayStr(), MANUAL_DONE_KEY);
  $done({});
}

function main() {
  try {
    if (manualOn()) {
      // 手动运行不拦截：手动权限大于自动，只要开了手动开关就跑（跑完需手动关开关）
      runAll();
    } else if (shouldRunAuto()) {
      runAll();
    } else if (shouldSendRenewal()) {
      // 不在签到窗口：只发 12:00 的续期提醒，不跑签到
      sendRenewal();
      $done({});
    } else {
      $done({});
    }
  } catch (err) {
    $persistentStore.write(todayStr(), TIME_DONE_KEY);
    $notification.post(NAME + "签到", "签到异常", String(err && err.message ? err.message : err));
    $done({});
  }
}
function runAll() {
  if (accounts.length === 0) { finish(); return; }
  processNext();
}
main();
