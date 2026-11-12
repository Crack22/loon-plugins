// 宸宇每日签到：Cookie 方式（登录要验证码，账号密码登不上去）
// 账号1/2/3：dylan_cookie(+2/+3)，填完整 Cookie（打开 https://vip.dylan.xin/ 自动抓取）
// 多账号：dylan_accounts，每行一个完整 Cookie
// 签到接口：POST /checkin（表单，无隐藏字段），带 Cookie + Origin + Referer
// 成功/已签到：302 跳转到 /?k=info&m=<消息>，或跟随跳转后首页 <div class="msg info">消息</div>
// 积分：GET /me，当前积分 N
const SITE = "https://vip.dylan.xin";
const COOKIE_KEY = "dylan_cookie";
const EXTRA_KEY = "dylan_accounts";
const NAME = "宸宇";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// dylan_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// dylan_time_mode：fixed = 指定时间 / random = 时间区间随机
// dylan_time：指定时间 "HH:MM"，如 09:30
// dylan_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "dylan_time_enabled";
const TIME_MODE_KEY = "dylan_time_mode";
const TIME_KEY = "dylan_time";
const TIME_RANGE_KEY = "dylan_time_range";
const TIME_TARGET_KEY = "dylan_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "dylan_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "dylan_manual_done"; // 手动运行一次今天已跑过的日期
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

function headers(cookie) {
  return {
    "Cookie": cookie,
    "Origin": SITE,
    "Referer": SITE + "/",
    "User-Agent": UA
  };
}
// 跳转 Location 里的 m= 参数就是签到结果消息
function msgFromLocation(loc) {
  if (!loc) return "";
  var m = loc.match(/[?&]m=([^&]*)/);
  if (!m) return "";
  try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
}
// 跟随跳转后首页会渲染 <div class="msg info">消息</div>
function msgFromHtml(html) {
  if (!html) return "";
  var m = html.match(/<div class="msg[^"]*">([^<]*)<\/div>/);
  return m ? m[1].trim() : "";
}
function getLocation(resp) {
  if (!resp || !resp.headers) return "";
  var h = resp.headers;
  return h["Location"] || h["location"] || "";
}
// /me 页：当前积分 + 今天有没有签到记录
function pointsFromMe(html) {
  if (!html) return "";
  var m = html.match(/当前积分<\/span><b>(\d+)<\/b>/);
  if (m) return m[1];
  var p = html.match(/◈\s*(\d+)\s*积分/);
  return p ? p[1] : "";
}
function checkedInToday(html) {
  if (!html) return false;
  return html.indexOf(todayStr()) !== -1 && html.indexOf("每日签到") !== -1;
}

// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个完整 Cookie）
function collectAccounts() {
  var list = [];
  var keys = [COOKIE_KEY, COOKIE_KEY + "2", COOKIE_KEY + "3"];
  for (var n = 0; n < 3; n++) {
    var c = (read(keys[n]) || "").trim();
    if (c && c.indexOf("sid=") !== -1) list.push({ cookie: c, label: "账号" + (n + 1) });
  }
  var lines = (read(EXTRA_KEY) || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.indexOf("sid=") === -1) continue;
    list.push({ cookie: line, label: "账号" + (list.length + 1) });
  }
  return list;
}

var accounts = collectAccounts();
var results = [];
var idx = 0;

function doCheckin(acct, next) {
  var h = headers(acct.cookie);
  $httpClient.post({ url: SITE + "/checkin", headers: h, body: "" }, function (e, r, d) {
    if (e) {
      results.push(acct.label + "：签到失败，" + e);
      next();
      return;
    }
    var loc = getLocation(r);
    if (loc && loc.indexOf("/login") !== -1) {
      results.push(acct.label + "：Cookie 已过期，打开本站重新抓取");
      next();
      return;
    }
    var msg = msgFromLocation(loc);
    if (!msg) msg = msgFromHtml(d);
    if (!msg && d && d.indexOf('action="/login"') !== -1) {
      results.push(acct.label + "：Cookie 已过期，打开本站重新抓取");
      next();
      return;
    }
    // 拿到消息后，再读一次 /me 确认当前积分
    $httpClient.get({ url: SITE + "/me", headers: h }, function (e2, r2, d2) {
      var points = pointsFromMe(d2);
      var suffix = points ? "，当前积分 " + points : "";
      if (msg) {
        if (msg.indexOf("已经签到") !== -1) {
          results.push(acct.label + "：今日已签到" + suffix);
        } else {
          results.push(acct.label + "：" + msg + suffix);
        }
      } else if (checkedInToday(d2)) {
        results.push(acct.label + "：今日已签到" + suffix);
      } else {
        results.push(acct.label + "：签到结果未知" + suffix + "，请打开本站确认");
      }
      next();
    });
  });
}

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  doCheckin(acct, processNext);
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填 Cookie", "打开 https://vip.dylan.xin/ 一次自动抓取，或在 BoxJs 里粘贴完整 Cookie");
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
