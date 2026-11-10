// 网易云音乐每日签到：Cookie 方式，账号1/2/3 + 多账号
// 账号1：netease_cookie（打开网易云音乐 App 停 1 秒自动保存）
// 账号2/3：netease_cookie2 / netease_cookie3（BoxJs 里手动粘贴完整 Cookie）
// 更多账号：netease_accounts，每行一个完整 Cookie
// 签到接口：GET https://music.163.com/api/point/dailyTask?type=1（网页端）
// 实测 2026-11-07：type=1 首次返回 {"code":200,"point":2}，重复返回 {"code":-2,"msg":"重复签到"}
// APP 端 type=0 已停用：/api 和 /weapi 都是 {"code":200,"msg":"功能暂不支持"}，所以只签网页端，每天 +2 成长值
// 云贝中心（/xeapi/pointmall/user/sign）和 VIP 签到（/xeapi/vip-center-bff/task/sign）是 xeapi 加密接口，
// 每次请求的密文都不一样，无法重放、也无法在 Loon 里重新加密，所以做不了自动签，只能在 App 里手动签
var NAME = "网易云音乐";
var URL = "https://music.163.com/api/point/dailyTask?type=1";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15";
var GROWTH_URL = "https://music.163.com/api/vipnewcenter/app/level/growhpoint/basic";

// ---------- 自定义签到时间（区间签到） ----------
// BoxJs 设置：
// netease_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// netease_time_mode：fixed = 指定时间 / random = 时间区间随机
// netease_time：指定时间 "HH:MM"，如 09:30
// netease_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "netease_time_enabled";
const TIME_MODE_KEY = "netease_time_mode";
const TIME_KEY = "netease_time";
const TIME_RANGE_KEY = "netease_time_range";
const TIME_TARGET_KEY = "netease_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "netease_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "netease_manual_done"; // 手动运行一次今天已跑过的日期
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
// 从成长值接口返回里找总数（字段名不统一，都试一遍；找不到返回 ""）
function findGrowthTotal(o) {
  if (!o) return "";
  var d = o.data || o;
  var cands = [
    d.growthPoint, d.growth_point, d.total, d.totalPoint, d.total_point,
    d.point, d.points, d.score, d.value, d.levelPoint,
    o.growthPoint, o.total, o.point
  ];
  for (var i = 0; i < cands.length; i++) {
    var v = cands[i];
    if (v !== undefined && v !== null && v !== "" && !isNaN(Number(v))) return String(v);
  }
  return "";
}
// 查一次总成长值，拿不到就回 ""（不阻塞签到结果）
function fetchGrowthTotal(cookie, cb) {
  $httpClient.get({
    url: GROWTH_URL,
    headers: { "Cookie": cookie, "User-Agent": UA, "Referer": "https://music.163.com/" }
  }, function (error, response, data) {
    var total = "";
    try {
      var o = parseJson(data);
      if (o) total = findGrowthTotal(o);
    } catch (e) {}
    cb(total);
  });
}

function collectAccounts() {
  var list = [];
  var c1 = read("netease_cookie").trim();
  if (c1) list.push({ cookie: c1, label: "账号1" });
  var c2 = read("netease_cookie2").trim();
  if (c2) list.push({ cookie: c2, label: "账号2" });
  var c3 = read("netease_cookie3").trim();
  if (c3) list.push({ cookie: c3, label: "账号3" });
  var lines = (read("netease_accounts") || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    list.push({ cookie: line, label: "账号" + (list.length + 1) });
  }
  return list;
}

var accounts = collectAccounts();
var results = [];
var idx = 0;

function doCheckin(acct, next) {
  $httpClient.get({
    url: URL,
    headers: { "Cookie": acct.cookie, "User-Agent": UA, "Referer": "https://music.163.com/", "Host": "music.163.com" }
  }, function (error, response, data) {
    var r = parseJson(data);
    if (!r) {
      results.push(acct.label + "：签到失败，返回异常（Cookie 可能过期，重新打开 App 抓一次）");
      next();
      return;
    }
    if (r.code === 200 && r.point !== undefined) {
      var gain = r.point;
      fetchGrowthTotal(acct.cookie, function (total) {
        var suffix = total ? "，总成长值 " + total : "";
        results.push(acct.label + "：签到成功，+" + gain + " 成长值" + suffix);
        next();
      });
    } else if (r.code === -2) {
      fetchGrowthTotal(acct.cookie, function (total) {
        var suffix = total ? "，总成长值 " + total : "";
        results.push(acct.label + "：今日已签到" + suffix);
        next();
      });
    } else if (r.code === 200 && r.msg) {
      results.push(acct.label + "：签到失败，" + r.msg + "（Cookie 可能过期，重新打开 App 抓一次）");
      next();
    } else {
      results.push(acct.label + "：签到失败，" + JSON.stringify(r).slice(0, 80));
      next();
    }
  });
}

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  doCheckin(acct, processNext);
}

function finish() {
  // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
  if (results.length > 0) write(TIME_DONE_KEY, todayStr());
  if (manualOn()) write(MANUAL_DONE_KEY, todayStr());
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填 Cookie", "打开网易云音乐 App 停 1 秒自动抓取");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

if (manualOn()) {
  // 手动运行不拦截：手动权限大于自动，只要开了手动开关就跑（跑完需手动关开关）
  processNext();
} else if (shouldRunAuto()) {
  processNext();
} else {
  $done({});
}
