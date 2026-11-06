// 蜗牛每日签到：Cookie 或账号密码登录（二选一），账号数量不限
// 账号1：woniu_cookie / woniu_username + woniu_password
// 更多账号：woniu_accounts，每行一个，填 Cookie 或 账号----密码（四个短横线隔开）
// 登录数量：woniu_max_accounts，填数字只签前 N 个账号，空着就是全部都签
// 登录接口：POST https://www.wn4k.com/user/login.html（user_name + user_pwd），成功 code=1，登录后从 Set-Cookie 取 user_check 保存
// 签到接口：POST https://www.wn4k.com/user/checkin.html，成功 code=1（info.points 积分），已签到 code=1001
const NAME = "蜗牛";
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

// 收集全部账号：账号1（单独的键）+ 多账号文本框（每行一个）
function collectAccounts() {
  var list = [];
  var a1 = {
    cookieKey: "woniu_cookie",
    cookie: read("woniu_cookie"),
    user: read("woniu_username"),
    pass: read("woniu_password")
  };
  if (a1.cookie || (a1.user && a1.pass)) {
    a1.label = "账号1";
    list.push(a1);
  }
  var lines = (read("woniu_accounts") || "").split("\n");
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
  var max = parseInt(read("woniu_max_accounts") || "0", 10);
  if (max > 0) list = list.slice(0, max);
  return list;
}

var accounts = collectAccounts();
var results = [];
var idx = 0;

function doCheckin(acct, cookie, triedLogin, next) {
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
      results.push(acct.label + "：签到成功 +" + points + " 积分");
      next();
    } else if (r && r.code === 1001) {
      results.push(acct.label + "：今日已签到");
      next();
    } else if (!triedLogin && acct.user && acct.pass) {
      // 可能是 Cookie 过期，用账号密码重新登录一次再试
      doLogin(acct, next);
    } else {
      results.push(acct.label + "：签到失败，" + ((r && r.msg) || "请重新抓取 Cookie 或检查账号密码"));
      next();
    }
  });
}

function doLogin(acct, next) {
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
      results.push(acct.label + "：登录失败，" + ((r && r.msg) || "请检查账号密码"));
      next();
      return;
    }
    var cookie = buildCookie(getSetCookie(response));
    if (!cookie || cookie.indexOf("user_check=") === -1) {
      results.push(acct.label + "：登录成功但没拿到 Cookie，请用 Cookie 方式");
      next();
      return;
    }
    if (acct.cookieKey) $persistentStore.write(cookie, acct.cookieKey);
    doCheckin(acct, cookie, true, next);
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
    $notification.post(NAME + "签到", "还没填账号", "在 BoxJs 里填 Cookie 或账号密码，多账号每行一个");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

processNext();
