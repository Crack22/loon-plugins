// GLaDOS 每日签到：Cookie 方式，账号数量不限
// 账号1/2/3：glados_cookie(+2/+3)（抓包自动保存，UA 一起保存到 glados_ua）
// 多账号：glados_accounts，每行一个 Cookie
// 自动兑换：glados_exchange，填 100 / 200 / 500，积分够了自动换 10 / 30 / 100 天，空着不兑换
// 签到接口：POST https://glados.rocks/api/user/checkin（body {"token":"glados.rocks"}），成功 code=0，message "Checkin! Got N Points"
// 状态接口：GET https://glados.rocks/api/user/status（data.leftDays 剩余天数，data.email 邮箱）
// 积分接口：GET https://glados.rocks/api/user/points（points 积分）
// 兑换接口：POST https://glados.rocks/api/user/exchange（body {"planType":"plan100"|"plan200"|"plan500"}），成功 code=0
// 注意：GLaDOS 校验抓包时的设备，签到必须用抓包时同一个 UA，否则报 device-mismatch；没抓到 UA 时默认用 iOS Safari UA
const NAME = "GLaDOS";
const DOMAIN = "glados.rocks";
const DEFAULT_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const PLANS = { "100": "plan100", "200": "plan200", "500": "plan500" };
const PLAN_DAYS = { "100": 10, "200": 30, "500": 100 };

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// glados_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// glados_time_mode：fixed = 指定时间 / random = 时间区间随机
// glados_time：指定时间 "HH:MM"，如 09:30
// glados_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "glados_time_enabled";
const TIME_MODE_KEY = "glados_time_mode";
const TIME_KEY = "glados_time";
const TIME_RANGE_KEY = "glados_time_range";
const TIME_TARGET_KEY = "glados_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "glados_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "glados_manual_done"; // 手动运行一次今天已跑过的日期
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
function parseJson(d) { try { return JSON.parse(d); } catch (e) { return null; } }
function parsePoints(v) { var n = parseInt(parseFloat(v), 10); return isNaN(n) ? 0 : n; }
function parseDays(v) { var n = parseInt(parseFloat(v), 10); return isNaN(n) ? "?" : n + " 天"; }

// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个 Cookie）
function collectAccounts() {
  var list = [];
  var c1 = read("glados_cookie");
  if (c1) list.push({ cookie: c1, label: "账号1" });
  var c2 = read("glados_cookie2");
  if (c2) list.push({ cookie: c2, label: "账号2" });
  var c3 = read("glados_cookie3");
  if (c3) list.push({ cookie: c3, label: "账号3" });
  var lines = (read("glados_accounts") || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    list.push({ cookie: line, label: "账号" + (list.length + 1) });
  }
  return list;
}

var accounts = collectAccounts();
var ua = read("glados_ua") || DEFAULT_UA;
var exchangePlan = (read("glados_exchange") || "").trim();
var results = [];
var idx = 0;

function headers(cookie) {
  return {
    "Cookie": cookie,
    "User-Agent": ua,
    "Origin": "https://" + DOMAIN,
    "Referer": "https://" + DOMAIN + "/console/checkin",
    "Content-Type": "application/json;charset=UTF-8",
    "Accept": "application/json, text/plain, */*"
  };
}

function getStatus(cookie, cb) {
  $httpClient.get({ url: "https://" + DOMAIN + "/api/user/status", headers: headers(cookie) }, function (error, response, data) {
    var r = parseJson(data);
    if (!r || r.code !== 0 || !r.data) { cb(null); return; }
    cb({ email: r.data.email || "", days: parseDays(r.data.leftDays) });
  });
}

function getPoints(cookie, cb) {
  $httpClient.get({ url: "https://" + DOMAIN + "/api/user/points", headers: headers(cookie) }, function (error, response, data) {
    var r = parseJson(data);
    if (!r || r.code !== 0) { cb(0); return; }
    cb(parsePoints(r.points));
  });
}

function doExchange(cookie, cb) {
  $httpClient.post({
    url: "https://" + DOMAIN + "/api/user/exchange",
    headers: headers(cookie),
    body: JSON.stringify({ planType: PLANS[exchangePlan] })
  }, function (error, response, data) {
    var r = parseJson(data);
    if (r && r.code === 0) {
      cb("已兑换 " + PLANS[exchangePlan] + "（+" + PLAN_DAYS[exchangePlan] + " 天）");
    } else {
      cb("兑换失败，" + ((r && r.message) || "未知错误"));
    }
  });
}

function doCheckin(acct, next) {
  var email = "", daysBefore = "?";
  getStatus(acct.cookie, function (st) {
    if (st) { email = st.email; daysBefore = st.days; }
    var who = email ? acct.label + "（" + email + "）" : acct.label;
    $httpClient.post({
      url: "https://" + DOMAIN + "/api/user/checkin",
      headers: headers(acct.cookie),
      body: JSON.stringify({ token: DOMAIN })
    }, function (error, response, data) {
      var r = parseJson(data);
      var msg = (r && r.message) || "";
      var code = r ? r.code : -1;
      var earned = 0;
      var m = msg.match(/Got\s+(\d+)\s+Points/i);
      if (m) earned = parseInt(m[1], 10);
      else if (r && r.points !== undefined) earned = parsePoints(r.points);
      if (code === 0) {
        afterCheckin(acct, who, "签到成功 +" + earned + " 积分", daysBefore, next);
      } else if (code === 1 || /repeat|already|重复|已签到|签到过/i.test(msg)) {
        afterCheckin(acct, who, "今日已签到", daysBefore, next);
      } else if (code === 4 || /device-mismatch|Automated check-in detected/i.test(msg)) {
        results.push(who + "：设备校验失败，请重新抓取 Cookie（换设备登录后要重新抓）");
        next();
      } else {
        results.push(who + "：签到失败，" + (msg || "请重新抓取 Cookie"));
        next();
      }
    });
  });
}

function afterCheckin(acct, who, statusText, daysBefore, next) {
  getPoints(acct.cookie, function (points) {
    var need = parseInt(exchangePlan || "0", 10);
    if (PLANS[exchangePlan] && points >= need) {
      doExchange(acct.cookie, function (ex) {
        getStatus(acct.cookie, function (st) {
          var daysAfter = st ? st.days : "?";
          results.push(who + "：" + statusText + "，剩余 " + daysBefore + " → " + daysAfter + "，积分 " + points + "，" + ex);
          next();
        });
      });
    } else {
      getStatus(acct.cookie, function (st) {
        var daysAfter = st ? st.days : "?";
        results.push(who + "：" + statusText + "，剩余 " + daysBefore + " → " + daysAfter + "，积分 " + points);
        next();
      });
    }
  });
}

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  doCheckin(acct, processNext);
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填 Cookie", "打开 glados.rocks/console/account 停 1 秒自动抓取");
  } else {
    // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
    $persistentStore.write(todayStr(), TIME_DONE_KEY);
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  if (manualOn()) $persistentStore.write(todayStr(), MANUAL_DONE_KEY);
  $done({});
}

if (manualOn()) {
  // 手动运行不拦截：手动权限大于自动，只要开了手动开关就跑（跑完需手动关开关）
  processNext();
} else if (!shouldRunAuto()) {
  $done({});
} else {
  processNext();
}
