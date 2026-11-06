// 蜗牛每日签到：Cookie 或账号密码登录（二选一），最多 3 个账号
// 账号1：woniu_cookie / woniu_username + woniu_password
// 账号2：woniu_cookie2 / woniu_username2 + woniu_password2
// 账号3：woniu_cookie3 / woniu_username3 + woniu_password3
// 登录接口：POST https://www.wn4k.com/user/login.html（user_name + user_pwd），成功 code=1，登录后从 Set-Cookie 取 user_check 保存
// 签到接口：POST https://www.wn4k.com/user/checkin.html，成功 code=1（info.points 积分），已签到 code=1001
const NAME = "蜗牛";
const MAX_ACCOUNTS = 3;
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const LOGIN_URL = "https://www.wn4k.com/user/login.html";
const CHECKIN_URL = "https://www.wn4k.com/user/checkin.html";

function read(k) { return $persistentStore.read(k) || ""; }
function parseJson(d) { try { return JSON.parse(d); } catch (e) { return null; } }
function getSetCookie(resp) {
  if (!resp || !resp.headers) return "";
  var h = resp.headers;
  var v = h["Set-Cookie"] || h["set-cookie"] || h["SET-COOKIE"] || "";
  if (Array.isArray(v)) return v.join("\n");
  return v || "";
}
// 从 Set-Cookie 里拼出 Cookie 头（跳过 Expires/Path 等属性）
function buildCookie(setCookieStr) {
  var pairs = [], seen = {};
  var skip = { "expires": 1, "max-age": 1, "path": 1, "domain": 1, "samesite": 1, "secure": 1, "httponly": 1 };
  var re = /([A-Za-z0-9_\-]+)=([^;,\s]+)/g, m;
  while ((m = re.exec(setCookieStr)) !== null) {
    if (skip[m[1].toLowerCase()] || seen[m[1]]) continue;
    seen[m[1]] = 1;
    pairs.push(m[1] + "=" + m[2]);
  }
  return pairs.join("; ");
}

function accountKeys(i) {
  var s = i === 1 ? "" : String(i);
  return {
    cookieKey: "woniu_cookie" + s,
    cookie: read("woniu_cookie" + s),
    user: read("woniu_username" + s),
    pass: read("woniu_password" + s)
  };
}

var results = [];

function doCheckin(acct, label, cookie, triedLogin, next) {
  $httpClient.post({
    url: CHECKIN_URL,
    headers: {
      "Cookie": cookie,
      "User-Agent": UA,
      "Referer": CHECKIN_URL,
      "X-Requested-With": "XMLHttpRequest"
    },
    body: ""
  }, function (error, response, data) {
    var r = parseJson(data);
    if (r && r.code === 1) {
      var points = (r.info && r.info.points) || "10";
      results.push(label + "：签到成功 +" + points + " 积分");
      next();
    } else if (r && r.code === 1001) {
      results.push(label + "：今日已签到");
      next();
    } else if (!triedLogin && acct.user && acct.pass) {
      // 可能是 Cookie 过期，用账号密码重新登录一次再试
      doLogin(acct, label, next);
    } else {
      results.push(label + "：签到失败，" + ((r && r.msg) || "请重新抓取 Cookie 或检查账号密码"));
      next();
    }
  });
}

function doLogin(acct, label, next) {
  $httpClient.post({
    url: LOGIN_URL,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
      "Referer": LOGIN_URL,
      "X-Requested-With": "XMLHttpRequest"
    },
    body: "user_name=" + encodeURIComponent(acct.user) + "&user_pwd=" + encodeURIComponent(acct.pass)
  }, function (error, response, data) {
    var r = parseJson(data);
    if (!r || r.code !== 1) {
      results.push(label + "：登录失败，" + ((r && r.msg) || "请检查账号密码"));
      next();
      return;
    }
    var cookie = buildCookie(getSetCookie(response));
    if (!cookie || cookie.indexOf("user_check=") === -1) {
      results.push(label + "：登录成功但没拿到 Cookie，请用 Cookie 方式");
      next();
      return;
    }
    $persistentStore.write(cookie, acct.cookieKey);
    doCheckin(acct, label, cookie, true, next);
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
    $notification.post(NAME + "签到", "还没填账号", "在 BoxJs 里填 Cookie 或账号密码（支持 3 个账号）");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

processAccount(1);
