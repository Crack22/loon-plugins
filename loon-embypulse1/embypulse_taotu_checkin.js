// 乐蛙每日签到：session_id 或账号密码登录（二选一），最多 3 个账号
// 账号1：embypulse1_session_id / embypulse1_username + embypulse1_password
// 账号2：embypulse1_session_id2 / embypulse1_username2 + embypulse1_password2
// 账号3：embypulse1_session_id3 / embypulse1_username3 + embypulse1_password3
// 登录接口：POST /api/requests/auth（JSON {username, password}），成功 status=success，登录后从 Set-Cookie 取 session_id 保存
// 签到接口：GET /api/user/points/info + POST /api/user/points/checkin，需带 Cookie session_id 和 Origin 头
const SITE = "https://ue2.taotu.ink";
const SESSION_BASE = "embypulse1_session_id";
const USER_BASE = "embypulse1_username";
const PASS_BASE = "embypulse1_password";
const NAME = "乐蛙";
const MAX_ACCOUNTS = 3;
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

function accountKeys(i) {
  var s = i === 1 ? "" : String(i);
  return {
    cookieKey: SESSION_BASE + s,
    cookie: read(SESSION_BASE + s),
    user: read(USER_BASE + s),
    pass: read(PASS_BASE + s)
  };
}

var results = [];

function doCheckin(acct, label, sessionId, triedLogin, next) {
  var h = headers(sessionId);
  $httpClient.get({ url: SITE + "/api/user/points/info", headers: h }, function (e1, r1, d1) {
    var info = parseJson(d1);
    if (info && info.status === "success" && info.data && info.data.has_checked_in) {
      results.push(label + "：今日已签到，积分 " + info.data.points);
      next();
      return;
    }
    $httpClient.post({ url: SITE + "/api/user/points/checkin", headers: h, body: "" }, function (e2, r2, d2) {
      var res = parseJson(d2);
      if (res && res.status === "success" && res.data) {
        results.push(label + "：签到成功 +" + (res.data.reward || 0) + " 积分，当前 " + (res.data.balance || ""));
      } else if (res && res.message && res.message.indexOf("已经签到") !== -1) {
        results.push(label + "：今日已签到");
      } else if (!triedLogin && acct.user && acct.pass) {
        // 可能是 session_id 过期，用账号密码重新登录一次再试
        doLogin(acct, label, next);
        return;
      } else if (res && res.message) {
        results.push(label + "：签到失败，" + res.message);
      } else {
        results.push(label + "：签到失败，" + (e2 || ("HTTP " + (r2 && r2.status))));
      }
      next();
    });
  });
}

function doLogin(acct, label, next) {
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
      results.push(label + "：登录失败，" + ((r && r.message) || "请检查账号密码"));
      next();
      return;
    }
    var sessionId = extractSession(getSetCookie(response));
    if (!sessionId) {
      results.push(label + "：登录成功但没拿到 session_id，请用 Cookie 方式");
      next();
      return;
    }
    $persistentStore.write(sessionId, acct.cookieKey);
    doCheckin(acct, label, sessionId, true, next);
  });
}

function processAccount(i) {
  if (i > MAX_ACCOUNTS) { finish(); return; }
  var acct = accountKeys(i);
  var label = "账号" + i;
  if (acct.cookie) {
    doCheckin(acct, label, acct.cookie, false, function () { processAccount(i + 1); });
  } else if (acct.user && acct.pass) {
    doLogin(acct, label, function () { processAccount(i + 1); });
  } else {
    processAccount(i + 1);
  }
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填账号", "在 BoxJs 里填 session_id 或账号密码（支持 3 个账号）");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

processAccount(1);
