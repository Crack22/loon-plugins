// 胖乖商城每日签到：Cookie 抓取方式（登录有滑块拼图验证，脚本不做账号密码登录）
// 账号1/2/3：pangguai_cookie(+2/+3)，打开签到页自动抓取到账号1，或在 BoxJs 里粘贴完整 Cookie
// 多账号：pangguai_accounts，每行一个完整 Cookie；行首加 名字| 可自定义通知里的名字
// 通知：固定账号名 pangguai_name(+2/+3)，不填显示 账号1/2/3
// 店铺：胖乖商城，kdt_id=104032310，checkin_id 在签到页 HTML 里（"checkin_id":2176822），取不到时用 2176822 兜底
// 状态：GET /wscump/checkin/get_activity_by_yzuid_v2.json?checkinId={id}&kdt_id=104032310
//   返回 {code:0, data:{continuesDay, isCheckin, dailyRewards:[{desc:"+10积分"}]}}；isCheckin 为 true 表示今日已签到
// 签到：GET /wscump/checkin/checkinV2.json?checkinId={id}&kdt_id=104032310（无请求体）
//   返回 {code:0, data:{success:true, list:[{infos:{title:"10积分"}, isSuccess:true}], times:2}}；times 为签到后的新连签天数
// 认证：Cookie 请求头（完整 Cookie 字符串，须含 KDTSESSIONID）；code 非 0 表示 Cookie 已过期
// 奖励每天 10 积分；周期 2026.10.26-2026.12.04：3天50、7天100、15天300、20天400、30天800积分+胖乖周边法兰绒毯子&杯子
// 网络异常自动重试 2 次（间隔 3 秒，单次超时 60 秒），通知里只显示简短原因，不写 Cookie 值
const HOST = "https://shop104224478.youzan.com";
const CHECKIN_PAGE = HOST + "/wscump/checkin/result?shopAutoEnter=1&kdtId=104032310";
const KDT_ID = "104032310";
const DEFAULT_CHECKIN_ID = "2176822";
const COOKIE_KEY = "pangguai_cookie";
const EXTRA_KEY = "pangguai_accounts";
const NAME_KEY = "pangguai_name";
const NAME = "胖乖商城";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.3 Mobile/15E148 Safari/604.1";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// pangguai_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// pangguai_time_mode：fixed = 指定时间 / random = 时间区间随机
// pangguai_time：指定时间 "HH:MM"，如 09:30
// pangguai_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "pangguai_time_enabled";
const TIME_MODE_KEY = "pangguai_time_mode";
const TIME_KEY = "pangguai_time";
const TIME_RANGE_KEY = "pangguai_time_range";
const TIME_TARGET_KEY = "pangguai_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "pangguai_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "pangguai_manual_done"; // 手动运行一次今天已跑过的日期
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
// 网络异常时重试：最多 2 次，间隔 3 秒；HTTP 响应（哪怕是 code 非 0）不重试
function httpReq(method, opts, cb) {
  var tries = 0;
  opts.timeout = 60000; // Loon 的 timeout 单位是毫秒，不是秒
  function go() {
    function done(e, r, d) {
      if (e) {
        tries++;
        if (tries <= 2) { console.log("[胖乖商城签到] 请求异常，第 " + tries + " 次重试"); setTimeout(go, 3000); return; }
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
function headersFor(acct) {
  return { "Accept": "application/json, text/plain, */*", "User-Agent": UA, "Referer": CHECKIN_PAGE, "Cookie": acct.cookie };
}
function htmlHeaders(acct) {
  var h = { "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "User-Agent": UA, "Referer": CHECKIN_PAGE };
  if (acct && acct.cookie) h["Cookie"] = acct.cookie;
  return h;
}

// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个完整 Cookie）
function collectAccounts() {
  var list = [];
  for (var n = 0; n < 3; n++) {
    var suf = n === 0 ? "" : String(n + 1);
    var cookie = (read(COOKIE_KEY + suf) || "").trim();
    var name = (read(NAME_KEY + suf) || "").trim();
    var label = name || ("账号" + (n + 1));
    if (!cookie) continue;
    list.push({ label: label, cookie: cookie });
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
    if (!cred) continue;
    list.push({ label: label, cookie: cred });
  }
  return list;
}

var accounts = collectAccounts();
var results = [];
var idx = 0;
var checkinId = null; // 本次运行共用，先从签到页 HTML 取，取不到用固定值

// 从签到页 HTML 里取 checkin_id，失败用固定值 2176822 继续，不让一次 HTML 请求拖垮整轮签到
function ensureCheckinId(firstAcct, cb) {
  httpReq("GET", {
    url: CHECKIN_PAGE,
    headers: htmlHeaders(firstAcct)
  }, function (e, r, d) {
    var id = null;
    if (!e && d) {
      var m = String(d).match(/"checkin_id":(\d+)/);
      if (m) id = m[1];
    }
    checkinId = id || DEFAULT_CHECKIN_ID;
    cb();
  });
}

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  runAccount(acct, processNext);
}

function runAccount(acct, next) {
  if (!acct.cookie || acct.cookie.indexOf("KDTSESSIONID=") === -1) {
    results.push(acct.label + "：Cookie 无效或已过期，打开签到页重新抓取");
    next(); return;
  }
  checkStatus(acct, next);
}

function checkStatus(acct, next) {
  httpReq("GET", {
    url: HOST + "/wscump/checkin/get_activity_by_yzuid_v2.json?checkinId=" + checkinId + "&kdt_id=" + KDT_ID,
    headers: headersFor(acct)
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：查询签到状态网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (!body || typeof body.code === "undefined") {
      results.push(acct.label + "：查询签到状态失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
      next(); return;
    }
    if (body.code !== 0) {
      results.push(acct.label + "：Cookie 已过期，打开签到页重新抓取");
      next(); return;
    }
    if (!body.data) {
      results.push(acct.label + "：查询签到状态失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
      next(); return;
    }
    var data = body.data;
    if (data.isCheckin) {
      var tail = "";
      if (typeof data.continuesDay === "number") tail += "，连签 " + data.continuesDay + " 天";
      results.push(acct.label + "：今日已签到" + tail);
      next(); return;
    }
    claim(acct, next);
  });
}

function claim(acct, next) {
  httpReq("GET", {
    url: HOST + "/wscump/checkin/checkinV2.json?checkinId=" + checkinId + "&kdt_id=" + KDT_ID,
    headers: headersFor(acct)
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：签到网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (!body || typeof body.code === "undefined") {
      results.push(acct.label + "：签到失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
      next(); return;
    }
    if (body.code !== 0) {
      results.push(acct.label + "：Cookie 已过期，打开签到页重新抓取");
      next(); return;
    }
    if (!body.data) {
      results.push(acct.label + "：签到失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
      next(); return;
    }
    var data = body.data;
    if (data.success) {
      var reward = "";
      if (data.list && data.list.length > 0 && data.list[0].infos && data.list[0].infos.title) reward = data.list[0].infos.title;
      var tail = "";
      if (reward) tail += "，+" + reward;
      if (typeof data.times === "number") tail += "，连签 " + data.times + " 天";
      results.push(acct.label + "：签到成功" + tail);
    } else {
      results.push(acct.label + "：签到失败，" + (body.msg || body.message || ("HTTP " + (r && r.status))));
    }
    next();
  });
}

function finish() {
  // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
  $persistentStore.write(todayStr(), TIME_DONE_KEY);
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "打开签到页一次自动抓取 Cookie，或在 BoxJs 里粘贴完整 Cookie");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  if (manualOn()) $persistentStore.write(todayStr(), MANUAL_DONE_KEY);
  $done({});
}

function runAll() {
  if (accounts.length === 0) { finish(); return; }
  ensureCheckinId(accounts[0], processNext);
}

function main() {
  try {
    if (manualOn()) {
      // 手动运行不拦截：手动权限大于自动，只要开了手动开关就跑（跑完需手动关开关）
      runAll();
    } else if (!shouldRunAuto()) {
      $done({});
    } else {
      runAll();
    }
  } catch (err) {
    $persistentStore.write(todayStr(), TIME_DONE_KEY);
    $notification.post(NAME + "签到", "签到异常", String(err && err.message ? err.message : err));
    $done({});
  }
}
main();
