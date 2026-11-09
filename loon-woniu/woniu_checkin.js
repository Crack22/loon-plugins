// 蜗牛每日签到：Cookie 或账号密码登录（二选一），账号数量不限
// 账号1/2/3：woniu_cookie(+2/+3) / woniu_username(+2/+3) + woniu_password(+2/+3)
// 多账号：woniu_accounts，每行一个，填 Cookie 或 账号；密码（中文分号隔开）
// 登录接口：POST https://www.wn4k.com/user/login.html（user_name + user_pwd），成功 code=1，登录后从 Set-Cookie 取 user_check 保存
// 签到接口：POST https://www.wn4k.com/user/checkin.html，成功 code=1（info.points 积分），已签到 code=1001
const NAME = "蜗牛";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const LOGIN_URL = "https://www.wn4k.com/user/login.html";
const CHECKIN_URL = "https://www.wn4k.com/user/checkin.html";

// ---------- 自定义签到时间（区间签到） ----------
// BoxJs 设置：
// woniu_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// woniu_time_mode：fixed = 指定时间 / random = 时间区间随机
// woniu_time：指定时间 "HH:MM"，如 09:30
// woniu_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "woniu_time_enabled";
const TIME_MODE_KEY = "woniu_time_mode";
const TIME_KEY = "woniu_time";
const TIME_RANGE_KEY = "woniu_time_range";
const TIME_TARGET_KEY = "woniu_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "woniu_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "woniu_manual_done"; // 手动运行一次今天已跑过的日期
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
    // 当天已挑过且区间没变 → 用存好的；否则重新随机挑一个
    const stored = read(TIME_TARGET_KEY);
    if (stored) {
      const sp = stored.split("|");
      if (sp.length === 2 && sp[0].slice(0, 10) === today && sp[1] === range) {
        const t = parseHM(sp[0].slice(11));
        if (t !== null) return t;
      }
    }
    const pick = start + Math.floor(Math.random() * (end - start + 1));
    write(TIME_TARGET_KEY, today + " " + fmtHM(pick) + "|" + range);
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

function read(k) { return $persistentStore.read(k) || ""; }
function write(k, v) { $persistentStore.write(v, k); }
function parseJson(d) { try { return JSON.parse(d); } catch (e) { return null; } }
function getSetCookie(resp) {
  if (!resp || !resp.headers) return "";
  var h = resp.headers;
  var v = h["Set-Cookie"] || h["set-cookie"] || h["SET-COOKIE"] || "";
  if (Array.isArray(v)) return v.join("\n");
  return v || "";
}
// 从 Set-Cookie 里拼出 Cookie 头（跳过 Expires/Path 等属性）
function buildCookie(setCookieStr) {
  var pairs = [], seen = {};
  var skip = { "expires": 1, "max-age": 1, "path": 1, "domain": 1, "samesite": 1, "secure": 1, "httponly": 1 };
  var re = /([A-Za-z0-9_\-]+)=([^;,\s]+)/g, m;
  while ((m = re.exec(setCookieStr)) !== null) {
    if (skip[m[1].toLowerCase()] || seen[m[1]]) continue;
    seen[m[1]] = 1;
    pairs.push(m[1] + "=" + m[2]);
  }
  return pairs.join("; ");
}

// 收集全部账号：账号1（单独的键）+ 多账号文本框（每行一个）
// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个）
function collectAccounts() {
  var list = [];
  var slots = [
    { ck: "woniu_cookie", u: "woniu_username", p: "woniu_password" },
    { ck: "woniu_cookie2", u: "woniu_username2", p: "woniu_password2" },
    { ck: "woniu_cookie3", u: "woniu_username3", p: "woniu_password3" }
  ];
  for (var n = 0; n < 3; n++) {
    var k = slots[n];
    var a = { cookieKey: k.ck, cookie: read(k.ck), user: read(k.u), pass: read(k.p) };
    if (a.cookie || (a.user && a.pass)) { a.label = "账号" + (n + 1); list.push(a); }
  }
  var lines = (read("woniu_accounts") || "").split("\n");
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

// 从签到返回里找总积分（字段名各站点不统一，都试一遍；找不到就返回 ""）
function findTotal(r) {
  if (!r) return "";
  var info = r.info || {};
  var cands = [
    info.total, info.totalPoints, info.total_points, info.sum, info.all,
    info.pointsTotal, info.balance, info.score, info.credit, info.userPoints,
    r.total, r.totalPoints, r.total_points, r.sum, r.balance, r.score
  ];
  for (var i = 0; i < cands.length; i++) {
    var v = cands[i];
    if (v !== undefined && v !== null && v !== "" && !isNaN(Number(v))) return String(v);
  }
  return "";
}

function doCheckin(acct, cookie, triedLogin, next) {
  $httpClient.post({
    url: CHECKIN_URL,
    headers: {
      "Cookie": cookie,
      "User-Agent": UA,
      "Referer": CHECKIN_URL,
      "X-Requested-With": "XMLHttpRequest"
    },
    body: ""
  }, function (error, response, data) {
    var r = parseJson(data);
    if (r && r.code === 1) {
      var points = (r.info && r.info.points) || "10";
      var total = findTotal(r);
      var suffix = total ? "，总积分 " + total : "";
      results.push(acct.label + "：签到成功 +" + points + " 积分" + suffix);
      next();
    } else if (r && r.code === 1001) {
      var total2 = findTotal(r);
      var suffix2 = total2 ? "，总积分 " + total2 : "";
      results.push(acct.label + "：今日已签到" + suffix2);
      next();
    } else if (!triedLogin && acct.user && acct.pass) {
      // 可能是 Cookie 过期，用账号密码重新登录一次再试
      doLogin(acct, next);
    } else {
      results.push(acct.label + "：签到失败，" + ((r && r.msg) || "请重新抓取 Cookie 或检查账号密码"));
      next();
    }
  });
}

function doLogin(acct, next) {
  $httpClient.post({
    url: LOGIN_URL,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
      "Referer": LOGIN_URL,
      "X-Requested-With": "XMLHttpRequest"
    },
    body: "user_name=" + encodeURIComponent(acct.user) + "&user_pwd=" + encodeURIComponent(acct.pass)
  }, function (error, response, data) {
    var r = parseJson(data);
    if (!r || r.code !== 1) {
      results.push(acct.label + "：登录失败，" + ((r && r.msg) || "请检查账号密码"));
      next();
      return;
    }
    var cookie = buildCookie(getSetCookie(response));
    if (!cookie || cookie.indexOf("user_check=") === -1) {
      results.push(acct.label + "：登录成功但没拿到 Cookie，请用 Cookie 方式");
      next();
      return;
    }
    if (acct.cookieKey) $persistentStore.write(cookie, acct.cookieKey);
    doCheckin(acct, cookie, true, next);
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
  // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
  if (results.length > 0) write(TIME_DONE_KEY, todayStr());
  if (manualOn()) write(MANUAL_DONE_KEY, todayStr());
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "在 BoxJs 里填 Cookie 或账号密码，多账号每行一个");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

if (manualOn()) {
  // 手动运行一次：今天已跑过就悄悄退出
  if (read(MANUAL_DONE_KEY) === todayStr()) {
    $done({});
  } else {
    processNext();
  }
} else if (shouldRunAuto()) {
  processNext();
} else {
  $done({});
}
