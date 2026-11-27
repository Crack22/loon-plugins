// Altare 每日签到：Cookie 抓取方式（登录有多重验证，脚本不做账号密码登录）
// 账号1/2/3：altare_cookie(+2/+3) + altare_auth(+2/+3) + altare_tenant(+2/+3)，打开每日奖励页自动抓取到账号1，或在 BoxJs 里粘贴
// 多账号：altare_accounts，每行一个账号，格式 Cookie；Authorization；TenantID（中文分号隔开）；行首加 名字| 可自定义通知里的名字
// 通知：固定账号名 altare_name(+2/+3)，不填显示 账号1/2/3
// 状态：GET /api/tenants/{tenant}/rewards，daily = {canClaim, lastClaimISO, currentStreak, nextStreak, baseRewardCents, streakBonusCents, totalRewardCents}（金额单位是分，100 分 = 1 bolt）
// 签到：POST /api/tenants/{tenant}/rewards/claim（无请求体，需带 idempotency-key），成功 {ok, balanceCents, baseRewardCents, streakBonusCents, totalRewardCents, newStreak}
// 认证：Cookie 请求头（altare_session 等）+ Authorization 请求头，两者都要带
// 奖励按 UTC 日重置，北京时间每天 08:00 后可领新一天的；连续签到每天多 0.67 bolts，上限 10 天，漏签重新开始
// 网络异常自动重试 2 次（间隔 3 秒，单次超时 60 秒），通知里只显示简短原因
const BASE = "https://console.altare.gg";
const DAILY_PAGE = BASE + "/billing/rewards/daily";
const COOKIE_KEY = "altare_cookie";
const AUTH_KEY = "altare_auth";
const TENANT_KEY = "altare_tenant";
const EXTRA_KEY = "altare_accounts";
const NAME_KEY = "altare_name";
const NAME = "Altare";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// altare_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// altare_time_mode：fixed = 指定时间 / random = 时间区间随机
// altare_time：指定时间 "HH:MM"，如 09:30
// altare_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "altare_time_enabled";
const TIME_MODE_KEY = "altare_time_mode";
const TIME_KEY = "altare_time";
const TIME_RANGE_KEY = "altare_time_range";
const TIME_TARGET_KEY = "altare_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "altare_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "altare_manual_done"; // 手动运行一次今天已跑过的日期
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
// 分转 bolts，保留两位小数
function fmtBolts(cents) {
  if (typeof cents !== "number") return "";
  return (cents / 100).toFixed(2);
}
// 每次领取生成一个新的 UUID v4，用作 idempotency-key
function uuidv4() {
  function h(n) { var s = ""; for (var i = 0; i < n; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)]; return s; }
  return h(8) + "-" + h(4) + "-4" + h(3) + "-" + "89ab"[Math.floor(Math.random() * 4)] + h(3) + "-" + h(12);
}
function isExpired(resp, body) {
  if (resp && (resp.status === 401 || resp.status === 403)) return true;
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
        if (tries <= 2) { console.log("[Altare签到] 请求异常，第 " + tries + " 次重试"); setTimeout(go, 3000); return; }
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
function headersFor(acct, extra) {
  var h = { "Accept": "application/json", "User-Agent": UA, "Referer": DAILY_PAGE, "Origin": BASE };
  if (acct.cookie) h["Cookie"] = acct.cookie;
  if (acct.auth) h["Authorization"] = acct.auth;
  if (extra) for (var k in extra) h[k] = extra[k];
  return h;
}

// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行 Cookie；Authorization；TenantID，中文分号隔开）
function collectAccounts() {
  var list = [];
  for (var n = 0; n < 3; n++) {
    var suf = n === 0 ? "" : String(n + 1);
    var cookie = (read(COOKIE_KEY + suf) || "").trim();
    var auth = (read(AUTH_KEY + suf) || "").trim();
    var tenant = (read(TENANT_KEY + suf) || "").trim();
    var name = (read(NAME_KEY + suf) || "").trim();
    var label = name || ("账号" + (n + 1));
    if (!cookie && !tenant) continue;
    list.push({ label: label, cookie: cookie, auth: auth, tenant: tenant });
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
    var parts = cred.split("；");
    if (parts.length < 3) continue;
    var cookie = (parts[0] || "").trim();
    var auth = (parts[1] || "").trim();
    var tenant = (parts[2] || "").trim();
    if (!cookie || !tenant) continue;
    list.push({ label: label, cookie: cookie, auth: auth, tenant: tenant });
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
  if (!acct.tenant) {
    results.push(acct.label + "：缺少 Tenant ID，打开每日奖励页重新抓取");
    next(); return;
  }
  if (!acct.cookie || acct.cookie.indexOf("altare_session=") === -1) {
    results.push(acct.label + "：Cookie 无效或已过期，打开每日奖励页重新抓取");
    next(); return;
  }
  checkStatus(acct, next);
}

function checkStatus(acct, next) {
  httpReq("GET", {
    url: BASE + "/api/tenants/" + acct.tenant + "/rewards",
    headers: headersFor(acct)
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：查询签到状态网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (!body || !body.daily) {
      if (isExpired(r, body)) {
        results.push(acct.label + "：Cookie 已过期，打开每日奖励页重新抓取");
      } else {
        results.push(acct.label + "：查询签到状态失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
      }
      next(); return;
    }
    var day = body.daily;
    if (!day.canClaim) {
      var tail = "";
      if (typeof day.currentStreak === "number") tail += "，连签 " + day.currentStreak + " 天";
      results.push(acct.label + "：今日已领取" + tail);
      next(); return;
    }
    claim(acct, next);
  });
}

function claim(acct, next) {
  httpReq("POST", {
    url: BASE + "/api/tenants/" + acct.tenant + "/rewards/claim",
    headers: headersFor(acct, { "Content-Type": "application/json", "Idempotency-Key": uuidv4() }),
    body: ""
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：签到网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (!body) { results.push(acct.label + "：签到失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); next(); return; }
    if (isExpired(r, body)) {
      results.push(acct.label + "：Cookie 已过期，打开每日奖励页重新抓取");
      next(); return;
    }
    if (body.ok) {
      var tail = "";
      if (typeof body.totalRewardCents === "number") tail += "，+" + fmtBolts(body.totalRewardCents) + " bolts";
      if (typeof body.balanceCents === "number") tail += "，余额 " + fmtBolts(body.balanceCents);
      if (typeof body.newStreak === "number") tail += "，连签 " + body.newStreak + " 天";
      results.push(acct.label + "：签到成功" + tail);
    } else {
      results.push(acct.label + "：签到失败，" + (body.error || body.message || ("HTTP " + (r && r.status))));
    }
    next();
  });
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "打开每日奖励页一次自动抓取，或在 BoxJs 里粘贴 Cookie、Authorization 和 Tenant ID");
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
