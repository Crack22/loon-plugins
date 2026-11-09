// 乐观每日签到：session_id 或账号密码登录（二选一），账号数量不限
// 账号1/2/3：embypulse2_session_id(+2/+3) / embypulse2_username(+2/+3) + embypulse2_password(+2/+3)
// 多账号：embypulse2_accounts，每行一个，填 session_id 或 账号；密码（中文分号隔开）
// 登录接口：POST /api/requests/auth（JSON {username, password}），成功 status=success，登录后从 Set-Cookie 取 session_id 保存
// 签到接口：GET /api/user/points/info + POST /api/user/points/checkin，需带 Cookie session_id 和 Origin 头
const SITE = "https://embyyh.dijia.de";
const SESSION_KEY = "embypulse2_session_id";
const USER_KEY = "embypulse2_username";
const PASS_KEY = "embypulse2_password";
const EXTRA_KEY = "embypulse2_accounts";
const NAME = "乐观";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const REFERER = SITE + "/?tab=explore";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// embypulse2_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// embypulse2_time_mode：fixed = 指定时间 / random = 时间区间随机
// embypulse2_time：指定时间 "HH:MM"，如 09:30
// embypulse2_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "embypulse2_time_enabled";
const TIME_MODE_KEY = "embypulse2_time_mode";
const TIME_KEY = "embypulse2_time";
const TIME_RANGE_KEY = "embypulse2_time_range";
const TIME_TARGET_KEY = "embypulse2_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "embypulse2_time_done"; // 自动签到今天已跑过的日期
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
// 自动定时是否该跑：到了目标时间且今天还没跑过
function shouldRunAuto() {
  const today = todayStr();
  if (read(TIME_DONE_KEY) === today) return false;
  return nowMin() >= todayTargetMin();
}
// 单条签到结果是否成功（成功或今日已签到）
function isOkResult(s) {
  return s.indexOf("签到成功") !== -1 || s.indexOf("今日已签到") !== -1;
}
function parseJson(d) { try { return JSON.parse(d); } catch (e) { return null; } }
function getSetCookie(resp) {
  if (!resp || !resp.headers) return "";
  var h = resp.headers;
  var v = h["Set-Cookie"] || h["set-cookie"] || h["SET-COOKIE"] || "";
  if (Array.isArray(v)) return v.join("\n");
  return v || "";
}
function extractSession(setCookieStr) {
  var m = setCookieStr.match(/session_id=([^;,\s]+)/);
  return m ? m[1] : "";
}
function headers(sessionId) {
  return {
    "Cookie": "session_id=" + sessionId,
    "Origin": SITE,
    "Referer": REFERER,
    "User-Agent": UA
  };
}

// 收集全部账号：账号1（单独的键）+ 多账号文本框（每行一个）
// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个）
function collectAccounts() {
  var list = [];
  var slots = [
    { ck: SESSION_KEY, u: USER_KEY, p: PASS_KEY },
    { ck: SESSION_KEY + "2", u: USER_KEY + "2", p: PASS_KEY + "2" },
    { ck: SESSION_KEY + "3", u: USER_KEY + "3", p: PASS_KEY + "3" }
  ];
  for (var n = 0; n < 3; n++) {
    var k = slots[n];
    var a = { cookieKey: k.ck, cookie: read(k.ck), user: read(k.u), pass: read(k.p) };
    if (a.cookie || (a.user && a.pass)) { a.label = "账号" + (n + 1); list.push(a); }
  }
  var lines = (read(EXTRA_KEY) || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var a = { cookieKey: "", cookie: "", user: "", pass: "" };
    var p = line.indexOf("；");
    if (p === -1) p = line.indexOf(";");
    if (p !== -1) {
      a.user = line.slice(0, p).trim();
      a.pass = line.slice(p + 1).trim();
      if (!a.user || !a.pass) continue;
    } else {
      a.cookie = line;
    }
    a.label = "账号" + (list.length + 1);
    list.push(a);
  }
  return list;
}

var accounts = collectAccounts();
var results = [];
var idx = 0;

function doCheckin(acct, sessionId, triedLogin, next) {
  var h = headers(sessionId);
  $httpClient.get({ url: SITE + "/api/user/points/info", headers: h }, function (e1, r1, d1) {
    var info = parseJson(d1);
    if (info && info.status === "success" && info.data && info.data.has_checked_in) {
      results.push(acct.label + "：今日已签到，积分 " + info.data.points);
      next();
      return;
    }
    $httpClient.post({ url: SITE + "/api/user/points/checkin", headers: h, body: "" }, function (e2, r2, d2) {
      var res = parseJson(d2);
      if (res && res.status === "success" && res.data) {
        results.push(acct.label + "：签到成功 +" + (res.data.reward || 0) + " 积分，当前 " + (res.data.balance || ""));
      } else if (res && res.message && res.message.indexOf("已经签到") !== -1) {
        results.push(acct.label + "：今日已签到");
      } else if (!triedLogin && acct.user && acct.pass) {
        // 可能是 session_id 过期，用账号密码重新登录一次再试
        doLogin(acct, next);
        return;
      } else if (res && res.message) {
        results.push(acct.label + "：签到失败，" + res.message);
      } else {
        results.push(acct.label + "：签到失败，" + (e2 || ("HTTP " + (r2 && r2.status))));
      }
      next();
    });
  });
}

function doLogin(acct, next) {
  $httpClient.post({
    url: SITE + "/api/requests/auth",
    headers: {
      "Content-Type": "application/json",
      "Origin": SITE,
      "Referer": REFERER,
      "User-Agent": UA
    },
    body: JSON.stringify({ username: acct.user, password: acct.pass })
  }, function (error, response, data) {
    var r = parseJson(data);
    if (!r || r.status !== "success") {
      results.push(acct.label + "：登录失败，" + ((r && r.message) || "请检查账号密码"));
      next();
      return;
    }
    var sessionId = extractSession(getSetCookie(response));
    if (!sessionId) {
      results.push(acct.label + "：登录成功但没拿到 session_id，请用 Cookie 方式");
      next();
      return;
    }
    if (acct.cookieKey) $persistentStore.write(sessionId, acct.cookieKey);
    doCheckin(acct, sessionId, true, next);
  });
}

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  if (acct.cookie) {
    doCheckin(acct, acct.cookie, false, processNext);
  } else {
    doLogin(acct, processNext);
  }
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "在 BoxJs 里填 session_id 或账号密码，多账号每行一个");
  } else {
    var allOk = true;
    for (var i = 0; i < results.length; i++) {
      if (!isOkResult(results[i])) { allOk = false; break; }
    }
    if (allOk) $persistentStore.write(todayStr(), TIME_DONE_KEY);
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

if (!shouldRunAuto()) {
  $done({});
} else {
  processNext();
}
