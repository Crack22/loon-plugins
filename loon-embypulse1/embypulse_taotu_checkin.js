// 乐蛙每日签到：session_id 或账号密码登录（二选一），账号数量不限
// 账号1：embypulse1_session_id / embypulse1_username + embypulse1_password
// 更多账号：embypulse1_accounts，每行一个，填 session_id 或 账号----密码（四个短横线隔开）
// 登录数量：embypulse1_max_accounts，填数字只签前 N 个账号，空着就是全部都签
// 登录接口：POST /api/requests/auth（JSON {username, password}），成功 status=success，登录后从 Set-Cookie 取 session_id 保存
// 签到接口：GET /api/user/points/info + POST /api/user/points/checkin，需带 Cookie session_id 和 Origin 头
const SITE = "https://ue2.taotu.ink";
const SESSION_KEY = "embypulse1_session_id";
const USER_KEY = "embypulse1_username";
const PASS_KEY = "embypulse1_password";
const EXTRA_KEY = "embypulse1_accounts";
const MAX_KEY = "embypulse1_max_accounts";
const NAME = "乐蛙";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const REFERER = SITE + "/";

function read(k) { return $persistentStore.read(k) || ""; }
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
function collectAccounts() {
  var list = [];
  var a1 = { cookieKey: SESSION_KEY, cookie: read(SESSION_KEY), user: read(USER_KEY), pass: read(PASS_KEY) };
  if (a1.cookie || (a1.user && a1.pass)) {
    a1.label = "账号1";
    list.push(a1);
  }
  var lines = (read(EXTRA_KEY) || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var a = { cookieKey: "", cookie: "", user: "", pass: "" };
    var p = line.indexOf("----");
    if (p !== -1) {
      a.user = line.slice(0, p).trim();
      a.pass = line.slice(p + 4).trim();
      if (!a.user || !a.pass) continue;
    } else {
      a.cookie = line;
    }
    a.label = "账号" + (list.length + 1);
    list.push(a);
  }
  var max = parseInt(read(MAX_KEY) || "0", 10);
  if (max > 0) list = list.slice(0, max);
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
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

processNext();
