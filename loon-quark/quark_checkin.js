// 夸克每日签到：夸克网盘 + 夸克浏览器，两个账号一起签
// 参数由 quark_capture.js 在打开 App 时自动保存（quark_drive_query / quark_browser_query）
// 也可以在 BoxJs 里手动粘贴签到请求的完整 query（? 后面的那串）
// 签到接口：POST drive-member.quark.cn/1/clouddrive/capacity/growth/sign，body {"sign_cyclic":true}
// 状态接口：GET drive-member.quark.cn/1/clouddrive/capacity/growth/info
// 响应：code=0 成功（data.sign_daily_reward 是本次奖励容量，单位字节）；code=44210 今日已签到
const HOST = "https://drive-member.quark.cn";
const ORIGIN = "https://b.quark.cn";
const DEFAULT_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 27_3 like Mac OS X; zh-cn) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/24C5037i Quark/10.20.5.1093 QKCloud/10.20.5.1093 Mobile";

const APPS = [
  { name: "夸克网盘", queryKey: "quark_drive_query", uaKey: "quark_drive_ua" },
  { name: "夸克", queryKey: "quark_browser_query", uaKey: "quark_browser_ua" }
];

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// quark_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// quark_time_mode：fixed = 指定时间 / random = 时间区间随机
// quark_time：指定时间 "HH:MM"，如 09:30
// quark_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "quark_time_enabled";
const TIME_MODE_KEY = "quark_time_mode";
const TIME_KEY = "quark_time";
const TIME_RANGE_KEY = "quark_time_range";
const TIME_TARGET_KEY = "quark_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "quark_time_done"; // 自动签到今天已跑过的日期
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
function mb(bytes) { return Math.round(bytes / 1048576); }

function headers(ua) {
  return {
    "Origin": ORIGIN,
    "Referer": ORIGIN + "/",
    "User-Agent": ua || DEFAULT_UA,
    "Accept": "*/*"
  };
}

var results = [];
var idx = 0;

function finish() {
  if (results.length > 0) {
    var allOk = true;
    for (var i = 0; i < results.length; i++) {
      if (!isOkResult(results[i])) { allOk = false; break; }
    }
    if (allOk) $persistentStore.write(todayStr(), TIME_DONE_KEY);
  }
  $notification.post("夸克每日签到", "", results.join("\n"));
  $done({});
}

// 查一次状态，返回 {ok, signed, progress, total}
function fetchInfo(query, ua, cb) {
  var url = HOST + "/1/clouddrive/capacity/growth/info?__t=" + Date.now() + "&sign_cyclic=true&" + query;
  $httpClient.get({ url: url, headers: headers(ua) }, function (e, r, d) {
    var info = parseJson(d);
    if (!info || info.code !== 0 || !info.data || !info.data.cap_sign) {
      cb(null);
      return;
    }
    var cap = info.data.cap_sign;
    var total = (info.data.cap_growth && info.data.cap_growth.cur_total_sign_day) || "";
    cb({ signed: !!cap.sign_daily, progress: cap.sign_progress, total: total });
  });
}

function checkOne(app, next) {
  var query = read(app.queryKey);
  if (!query) {
    results.push(app.name + "：未保存参数，打开一次 " + app.name + " App 自动获取");
    next();
    return;
  }
  var ua = read(app.uaKey);
  fetchInfo(query, ua, function (st) {
    if (!st) {
      results.push(app.name + "：状态查询失败，参数可能失效，打开一次 App 刷新");
      next();
      return;
    }
    var stat = "（连续第" + st.progress + "天，共" + st.total + "天）";
    if (st.signed) {
      results.push(app.name + "：今日已签到" + stat);
      next();
      return;
    }
    var hh = headers(ua);
    hh["Content-Type"] = "application/json";
    $httpClient.post({ url: HOST + "/1/clouddrive/capacity/growth/sign?" + query, headers: hh, body: '{"sign_cyclic":true}' }, function (e2, r2, d2) {
      var s = parseJson(d2);
      if (s && s.code === 0 && s.data) {
        var reward = mb(s.data.sign_daily_reward);
        fetchInfo(query, ua, function (st2) {
          if (st2) {
            results.push(app.name + "：签到成功 +" + reward + "MB（连续第" + st2.progress + "天，共" + st2.total + "天）");
          } else {
            results.push(app.name + "：签到成功 +" + reward + "MB");
          }
          next();
        });
      } else if (s && s.code === 44210) {
        results.push(app.name + "：今日已签到" + stat);
        next();
      } else {
        results.push(app.name + "：签到失败（" + (s ? (s.code + " " + (s.message || "")) : "无响应") + "），打开一次 App 刷新参数");
        next();
      }
    });
  });
}

function runNext() {
  if (idx >= APPS.length) { finish(); return; }
  var app = APPS[idx++];
  checkOne(app, runNext);
}
if (!shouldRunAuto()) {
  $done({});
} else {
  runNext();
}
