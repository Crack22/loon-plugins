// ChaPanda 每日签到：x-admin-token 抓取方式（登录还要 Telegram 二次确认，脚本不做账号密码登录）
// 账号1/2/3：chapanda_token(+2/+3)，打开门户自动抓取到账号1，或在 BoxJs 里粘贴 x-admin-token
// 多账号：chapanda_accounts，每行一个 x-admin-token；行首加 名字| 可自定义通知里的名字
// 通知：固定账号名 chapanda_name(+2/+3)，不填显示 账号1/2/3
// 状态：GET /api/auth/me/checkin?year={YYYY}&month={M}（本地日期，month 1-12）
//   返回 {"enabled":true,"balance":7,"checkedInToday":true,"todayReward":3,"rewardMin":2,"rewardMax":5,"days":[...]}
//   checkedInToday 为 true 表示今日已签到
// 验证：GET /api/auth/me/checkin/captcha，返回 {"question":"2 + 8 = ?","token":"...","expiresAt":"..."}
//   题目是数学加减法，token 有效期约 3 分钟；解析题目算出答案后立即签到
// 签到：POST /api/auth/me/checkin，JSON 体 {"captchaToken":"...","captchaAnswer":"10"}
//   成功返回 {"checkedIn":true,"reward":3,"balance":7,"date":"2026-11-29"}
// 认证：x-admin-token 请求头；401 表示 Token 已过期，打开门户重新抓取
// 奖励每天随机 +2~5 积分；页面未见连续签到奖励规则
// 网络异常自动重试 2 次（间隔 3 秒，单次超时 60 秒），通知里只显示简短原因，不写 Token 值
const HOST = "https://app.chapanda.us.ci";
const PORTAL = HOST + "/#/portal";
const TOKEN_KEY = "chapanda_token";
const EXTRA_KEY = "chapanda_accounts";
const NAME_KEY = "chapanda_name";
const NAME = "ChaPanda";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.3 Mobile/15E148 Safari/604.1";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// chapanda_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// chapanda_time_mode：fixed = 指定时间 / random = 时间区间随机
// chapanda_time：指定时间 "HH:MM"，如 09:30
// chapanda_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "chapanda_time_enabled";
const TIME_MODE_KEY = "chapanda_time_mode";
const TIME_KEY = "chapanda_time";
const TIME_RANGE_KEY = "chapanda_time_range";
const TIME_TARGET_KEY = "chapanda_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "chapanda_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "chapanda_manual_done"; // 手动运行一次今天已跑过的日期
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
// 网络异常时重试：最多 2 次，间隔 3 秒；HTTP 响应（哪怕是业务失败）不重试
function httpReq(method, opts, cb) {
  var tries = 0;
  opts.timeout = 60000; // Loon 的 timeout 单位是毫秒，不是秒
  function go() {
    function done(e, r, d) {
      if (e) {
        tries++;
        if (tries <= 2) { console.log("[ChaPanda签到] 请求异常，第 " + tries + " 次重试"); setTimeout(go, 3000); return; }
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
  return { "Accept": "application/json, text/plain, */*", "User-Agent": UA, "Referer": PORTAL, "x-admin-token": acct.token };
}
function statusUrl() {
  const d = new Date();
  return HOST + "/api/auth/me/checkin?year=" + d.getFullYear() + "&month=" + (d.getMonth() + 1);
}
// 解析数学验证题："2 + 8 = ?" / "9 - 4 = ?"，也兼容 ×/x（乘法）；非法返回 null
function solveQuestion(q) {
  var m = String(q || "").match(/(\d+)\s*([+\-×x*])\s*(\d+)/);
  if (!m) return null;
  var a = parseInt(m[1], 10), b = parseInt(m[3], 10);
  if (m[2] === "+") return a + b;
  if (m[2] === "-") return a - b;
  return a * b;
}
// 判断响应是不是“已经签过”：只看 checkedInToday 和文案；注意签到成功响应里
// checkedIn:true 表示本次签成功，不是已签过，不能当成已签处理
function isAlreadySigned(body) {
  if (!body) return false;
  if (body.checkedInToday === true) return true;
  var msg = String(body.msg || body.message || body.error || "");
  return msg.indexOf("已签") !== -1 || msg.indexOf("already") !== -1;
}

// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个 x-admin-token）
function collectAccounts() {
  var list = [];
  for (var n = 0; n < 3; n++) {
    var suf = n === 0 ? "" : String(n + 1);
    var token = (read(TOKEN_KEY + suf) || "").trim();
    var name = (read(NAME_KEY + suf) || "").trim();
    var label = name || ("账号" + (n + 1));
    if (!token) continue;
    list.push({ label: label, token: token });
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
    list.push({ label: label, token: cred });
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
  if (!acct.token) {
    results.push(acct.label + "：Token 为空，打开门户重新抓取");
    next(); return;
  }
  checkStatus(acct, next);
}

function checkStatus(acct, next) {
  httpReq("GET", {
    url: statusUrl(),
    headers: headersFor(acct)
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：查询签到状态网络异常，" + shortErr(e)); next(); return; }
    if (r && r.status === 401) { results.push(acct.label + "：Token 已过期，打开门户重新抓取"); next(); return; }
    var body = parseBody(d);
    if (!body || typeof body.checkedInToday === "undefined") {
      results.push(acct.label + "：查询签到状态失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
      next(); return;
    }
    if (body.checkedInToday) {
      var tail = "";
      if (typeof body.todayReward === "number") tail += "，+" + body.todayReward + " 积分";
      if (typeof body.balance === "number") tail += "，余额 " + body.balance + " 积分";
      results.push(acct.label + "：今日已签到" + tail);
      next(); return;
    }
    fetchCaptcha(acct, next, 0);
  });
}

// 拿验证题并签到；验证失败时重新拿一次题再试（token 只有约 3 分钟有效期）
function fetchCaptcha(acct, next, retry) {
  httpReq("GET", {
    url: HOST + "/api/auth/me/checkin/captcha",
    headers: headersFor(acct)
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：获取验证题网络异常，" + shortErr(e)); next(); return; }
    if (r && r.status === 401) { results.push(acct.label + "：Token 已过期，打开门户重新抓取"); next(); return; }
    var body = parseBody(d);
    if (!body || !body.token || !body.question) {
      results.push(acct.label + "：获取验证题失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
      next(); return;
    }
    var answer = solveQuestion(body.question);
    if (answer === null) {
      results.push(acct.label + "：验证题无法解析（" + body.question + "），请手动签到");
      next(); return;
    }
    // token 快过期就重新拿一题（有效期约 3 分钟）
    if (body.expiresAt) {
      var exp = Date.parse(body.expiresAt);
      if (!isNaN(exp) && exp - Date.now() < 30000) {
        if (retry < 1) { fetchCaptcha(acct, next, retry + 1); return; }
      }
    }
    claim(acct, body.token, String(answer), next, retry);
  });
}

function claim(acct, captchaToken, captchaAnswer, next, retry) {
  httpReq("POST", {
    url: HOST + "/api/auth/me/checkin",
    headers: (function () {
      var h = headersFor(acct);
      h["Content-Type"] = "application/json";
      return h;
    })(),
    body: JSON.stringify({ captchaToken: captchaToken, captchaAnswer: captchaAnswer })
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：签到网络异常，" + shortErr(e)); next(); return; }
    if (r && r.status === 401) { results.push(acct.label + "：Token 已过期，打开门户重新抓取"); next(); return; }
    var body = parseBody(d);
    if (isAlreadySigned(body)) {
      var tail = "";
      if (body && typeof body.reward === "number") tail += "，+" + body.reward + " 积分";
      if (body && typeof body.balance === "number") tail += "，余额 " + body.balance + " 积分";
      results.push(acct.label + "：今日已签到" + tail);
      next(); return;
    }
    if (body && body.checkedIn === true) {
      var tail2 = "";
      if (typeof body.reward === "number") tail2 += "，+" + body.reward + " 积分";
      if (typeof body.balance === "number") tail2 += "，余额 " + body.balance + " 积分";
      results.push(acct.label + "：签到成功" + tail2);
      next(); return;
    }
    // 验证失败（答案错或 token 过期）时重新拿一题再试一次
    var msg = body ? String(body.msg || body.message || body.error || "") : "";
    if (retry < 1 && /captcha|验证|过期|expired/i.test(msg)) {
      fetchCaptcha(acct, next, retry + 1); return;
    }
    if (!body) {
      results.push(acct.label + "：签到失败，服务器返回无法解析（HTTP " + (r && r.status) + "）");
    } else {
      results.push(acct.label + "：签到失败，" + (msg || ("HTTP " + (r && r.status))));
    }
    next();
  });
}

function finish() {
  // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
  $persistentStore.write(todayStr(), TIME_DONE_KEY);
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "打开门户一次自动抓取 Token，或在 BoxJs 里粘贴 x-admin-token");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  if (manualOn()) $persistentStore.write(todayStr(), MANUAL_DONE_KEY);
  $done({});
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
function runAll() {
  if (accounts.length === 0) { finish(); return; }
  processNext();
}
main();
