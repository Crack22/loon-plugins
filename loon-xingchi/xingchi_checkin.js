// 星驰API公益站每日签到：Token 刷新登录签到（登录页有人机验证，脚本不做账号密码登录）
// 账号1/2/3：xingchi_access_token(+2/+3) + xingchi_refresh_token(+2/+3)，Token 在 Safari 打开本站登录时自动抓取
// 多账号：xingchi_accounts，每行一个 refresh_token；行首加 名字| 可自定义通知里的名字
// 通知：固定账号名 xingchi_name(+2/+3)，不填显示 账号1/2/3；通知末尾汇总今天共领额度
// 状态：GET /api/v1/user/checkin，data = {enabled, claimed_today, amount, total_count, total_amount}
// 领取：POST /api/v1/user/checkin {}，成功 data = {amount, status}；已领过 reason = CHECKIN_ALREADY_CLAIMED
// 刷新：POST /api/v1/auth/refresh {refresh_token}，取 data.access_token（refresh_token 轮换时存回对应栏位）
// 认证：Authorization: Bearer <access_token>；access_token 过期返回 401 时自动刷新重试一次
// 网络异常自动重试 2 次（间隔 3 秒，单次超时 60 秒），通知里只显示简短原因
const BASE = "https://xingchiapi.com";
const API = BASE + "/api/v1";
const ACCESS_KEY = "xingchi_access_token";
const REFRESH_KEY = "xingchi_refresh_token";
const EXTRA_KEY = "xingchi_accounts";
const NAME_KEY = "xingchi_name";
const NAME = "星驰";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function read(k) { return $persistentStore.read(k) || ""; }

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// xingchi_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// xingchi_time_mode：fixed = 指定时间 / random = 时间区间随机
// xingchi_time：指定时间 "HH:MM"，如 09:30
// xingchi_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "xingchi_time_enabled";
const TIME_MODE_KEY = "xingchi_time_mode";
const TIME_KEY = "xingchi_time";
const TIME_RANGE_KEY = "xingchi_time_range";
const TIME_TARGET_KEY = "xingchi_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "xingchi_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "xingchi_manual_done"; // 手动运行一次今天已跑过的日期
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
// 金额格式化：$25 / $0.5
function fmtMoney(x) {
  var n = Number(x);
  if (!isFinite(n)) return String(x);
  return "$" + Number(n.toFixed(2));
}
// 401 / 未授权：HTTP 401，或 body.code === "UNAUTHORIZED"
function isUnauthorized(resp, body) {
  if (resp && resp.status === 401) return true;
  if (body && body.code === "UNAUTHORIZED") return true;
  return false;
}
// refresh_token 失效：HTTP 401 且 reason 为 REFRESH_TOKEN_INVALID
function isRefreshInvalid(resp, body) {
  if (!isUnauthorized(resp, body)) return false;
  if (body && body.reason === "REFRESH_TOKEN_INVALID") return true;
  return resp && resp.status === 401;
}
// 网络异常时重试：最多 2 次，间隔 3 秒；HTTP 响应（哪怕是 401）不重试
function httpReq(method, opts, cb) {
  var tries = 0;
  opts.timeout = 60000; // Loon 的 timeout 单位是毫秒，不是秒
  function go() {
    function done(e, r, d) {
      if (e) {
        tries++;
        if (tries <= 2) { console.log("[星驰签到] 请求异常，第 " + tries + " 次重试"); setTimeout(go, 3000); return; }
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

// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个 refresh_token）
// 行首加 名字| 或 名字；可自定义通知里的名字
function collectAccounts() {
  var list = [];
  for (var n = 0; n < 3; n++) {
    var suf = n === 0 ? "" : String(n + 1);
    var access = (read(ACCESS_KEY + suf) || "").trim();
    var refresh = (read(REFRESH_KEY + suf) || "").trim();
    var name = (read(NAME_KEY + suf) || "").trim();
    var label = name || ("账号" + (n + 1));
    if (access || refresh) {
      list.push({ label: label, access: access, refresh: refresh, accessKey: ACCESS_KEY + suf, refreshKey: REFRESH_KEY + suf });
    }
  }
  var lines = (read(EXTRA_KEY) || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var label = "账号" + (list.length + 1);
    var cred = line;
    var bar = line.indexOf("|");
    if (bar === -1) bar = line.indexOf("；");
    if (bar === -1) bar = line.indexOf(";");
    if (bar > 0) {
      var nm = line.slice(0, bar).trim();
      var rest = line.slice(bar + 1).trim();
      if (nm && rest) { label = nm; cred = rest; }
    }
    if (cred.length >= 10) list.push({ label: label, access: "", refresh: cred });
  }
  return list;
}

var accounts = collectAccounts();
var results = [];
var totalAmount = 0;
var idx = 0;

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  runAccount(acct, processNext);
}

function runAccount(acct, next) {
  if (acct.access) {
    checkStatus(acct, acct.access, next, false);
  } else if (acct.refresh) {
    refreshToken(acct, function (ok, invalid, msg) {
      if (ok) checkStatus(acct, acct.access, next, false);
      else {
        if (invalid) results.push(acct.label + "：Token 已失效，请在 Safari 打开本站重新登录一次抓取");
        else if (msg) results.push(acct.label + "：" + msg);
        next();
      }
    });
  } else {
    next();
  }
}

// 用 refresh_token 换新的 access_token；轮换出新的 refresh_token 时，固定账号存回对应栏位
// 回调 cb(ok, invalid, msg)：invalid 为真表示 refresh_token 已失效；msg 为其他失败原因
function refreshToken(acct, cb) {
  httpReq("POST", {
    url: API + "/auth/refresh",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA },
    body: JSON.stringify({ refresh_token: acct.refresh })
  }, function (e, r, d) {
    if (e) { cb(false, false, "刷新登录网络异常，" + shortErr(e)); return; }
    var body = parseBody(d);
    if (!body) { cb(false, false, "刷新登录失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); return; }
    if (body.code === 0 && body.data && body.data.access_token) {
      acct.access = String(body.data.access_token).trim();
      if (acct.accessKey) $persistentStore.write(acct.access, acct.accessKey);
      if (body.data.refresh_token) {
        var rt = String(body.data.refresh_token).trim();
        if (rt && rt !== acct.refresh) {
          acct.refreshRotated = rt;
          acct.refresh = rt;
          if (acct.refreshKey) $persistentStore.write(rt, acct.refreshKey);
        }
      }
      cb(true); return;
    }
    if (isRefreshInvalid(r, body)) { cb(false, true, ""); return; }
    cb(false, false, "刷新登录失败，" + (body.message || ("HTTP " + (r && r.status))));
  });
}

function checkStatus(acct, access, next, retried) {
  httpReq("GET", {
    url: API + "/user/checkin",
    headers: { "Authorization": "Bearer " + access, "Accept": "application/json", "User-Agent": UA }
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：查询签到状态网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (!body) { results.push(acct.label + "：查询签到状态失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); next(); return; }
    if (isUnauthorized(r, body) && !retried && acct.refresh) {
      refreshToken(acct, function (ok, invalid, msg) {
        if (ok) { checkStatus(acct, acct.access, next, true); return; }
        if (invalid) results.push(acct.label + "：Token 已失效，请在 Safari 打开本站重新登录一次抓取");
        else if (msg) results.push(acct.label + "：" + msg);
        next();
      });
      return;
    }
    if (body.code !== 0) {
      if (isUnauthorized(r, body)) {
        results.push(acct.label + "：Token 已失效，请在 Safari 打开本站重新登录一次抓取");
      } else {
        results.push(acct.label + "：查询签到状态失败，" + (body.message || ("HTTP " + (r && r.status))));
      }
      next(); return;
    }
    var st = body.data || {};
    if (st.enabled === false) { results.push(acct.label + "：签到未开启"); next(); return; }
    var tail = "";
    if (typeof st.total_count === "number" && st.total_count > 0) {
      tail += "，累计签到 " + st.total_count + " 次";
      if (st.total_amount !== undefined && st.total_amount !== null) tail += "，共领 " + fmtMoney(st.total_amount);
    }
    if (st.claimed_today) {
      results.push(acct.label + "：今日已签到" + tail + rotatedNote(acct));
      next(); return;
    }
    claim(acct, access, next, false);
  });
}

function claim(acct, access, next, retried) {
  httpReq("POST", {
    url: API + "/user/checkin",
    headers: { "Authorization": "Bearer " + access, "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA },
    body: "{}"
  }, function (e, r, d) {
    if (e) { results.push(acct.label + "：领取签到网络异常，" + shortErr(e)); next(); return; }
    var body = parseBody(d);
    if (!body) { results.push(acct.label + "：领取签到失败，服务器返回无法解析（HTTP " + (r && r.status) + "）"); next(); return; }
    if (isUnauthorized(r, body) && !retried && acct.refresh) {
      refreshToken(acct, function (ok, invalid, msg) {
        if (ok) { claim(acct, acct.access, next, true); return; }
        if (invalid) results.push(acct.label + "：Token 已失效，请在 Safari 打开本站重新登录一次抓取");
        else if (msg) results.push(acct.label + "：" + msg);
        next();
      });
      return;
    }
    if (body.code === 0 && body.data) {
      var amt = body.data.amount;
      var n = Number(amt);
      if (isFinite(n)) totalAmount += n;
      results.push(acct.label + "：签到成功" + ((amt !== undefined && amt !== null) ? "，领到 " + fmtMoney(amt) : "") + rotatedNote(acct));
    } else if (body.reason === "CHECKIN_ALREADY_CLAIMED") {
      results.push(acct.label + "：今日已签到" + rotatedNote(acct));
    } else if (isUnauthorized(r, body)) {
      results.push(acct.label + "：Token 已失效，请在 Safari 打开本站重新登录一次抓取");
    } else {
      results.push(acct.label + "：签到失败，" + (body.message || ("HTTP " + (r && r.status))));
    }
    next();
  });
}

// 多账号的 refresh_token 被服务端轮换时，固定账号已自动存回，多账号只能提醒手动更新
function rotatedNote(acct) {
  if (!acct.refreshRotated || acct.refreshKey) return "";
  return "（refresh_token 已轮换，请把多账号里的旧值换成：" + acct.refreshRotated + "）";
}

function finish() {
  // 跑完一轮就写 done，不管成功失败、有没有账号（失败也不再每分钟重试）
  $persistentStore.write(todayStr(), TIME_DONE_KEY);
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "在 Safari 打开 https://xingchiapi.com 登录一次，Token 会自动抓取");
  } else {
    var body = results.join("\n");
    if (totalAmount > 0) body += "\n今天共领 " + fmtMoney(totalAmount);
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", body);
  }
  if (manualOn()) $persistentStore.write(todayStr(), MANUAL_DONE_KEY);
  $done({});
}

function main() {
  try {
    if (manualOn()) {
      // 手动运行不拦截：手动权限大于自动，只要开了手动开关就跑（跑完需手动关开关）
      processNext();
    } else if (!shouldRunAuto()) {
      $done({});
    } else {
      processNext();
    }
  } catch (e) {
    // 异常也要写 done，避免每分钟重复跑
    try { $persistentStore.write(todayStr(), TIME_DONE_KEY); } catch (e2) {}
    $notification.post(NAME + "签到", "脚本异常", String(e && e.message ? e.message : e));
    $done({});
  }
}
main();
