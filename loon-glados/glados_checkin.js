// GLaDOS 每日签到：Cookie 方式，账号数量不限
// 账号1：glados_cookie（抓包自动保存，UA 一起保存到 glados_ua）
// 更多账号：glados_accounts，每行一个 Cookie
// 登录数量：glados_max_accounts，填数字只签前 N 个账号，空着就是全部都签
// 自动兑换：glados_exchange，填 100 / 200 / 500，积分够了自动换 10 / 30 / 100 天，空着不兑换
// 签到接口：POST https://glados.rocks/api/user/checkin（body {"token":"glados.rocks"}），成功 code=0，message "Checkin! Got N Points"
// 状态接口：GET https://glados.rocks/api/user/status（data.leftDays 剩余天数，data.email 邮箱）
// 积分接口：GET https://glados.rocks/api/user/points（points 积分）
// 兑换接口：POST https://glados.rocks/api/user/exchange（body {"planType":"plan100"|"plan200"|"plan500"}），成功 code=0
// 注意：GLaDOS 校验抓包时的设备，签到必须用抓包时同一个 UA，否则报 device-mismatch；没抓到 UA 时默认用 iOS Safari UA
const NAME = "GLaDOS";
const DOMAIN = "glados.rocks";
const DEFAULT_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const PLANS = { "100": "plan100", "200": "plan200", "500": "plan500" };
const PLAN_DAYS = { "100": 10, "200": 30, "500": 100 };

function read(k) { return $persistentStore.read(k) || ""; }
function parseJson(d) { try { return JSON.parse(d); } catch (e) { return null; } }
function parsePoints(v) { var n = parseInt(parseFloat(v), 10); return isNaN(n) ? 0 : n; }
function parseDays(v) { var n = parseInt(parseFloat(v), 10); return isNaN(n) ? "?" : n + " 天"; }

function collectAccounts() {
  var list = [];
  var c1 = read("glados_cookie");
  if (c1) list.push({ cookie: c1, label: "账号1" });
  var lines = (read("glados_accounts") || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    list.push({ cookie: line, label: "账号" + (list.length + 1) });
  }
  var max = parseInt(read("glados_max_accounts") || "0", 10);
  if (max > 0) list = list.slice(0, max);
  return list;
}

var accounts = collectAccounts();
var ua = read("glados_ua") || DEFAULT_UA;
var exchangePlan = (read("glados_exchange") || "").trim();
var results = [];
var idx = 0;

function headers(cookie) {
  return {
    "Cookie": cookie,
    "User-Agent": ua,
    "Origin": "https://" + DOMAIN,
    "Referer": "https://" + DOMAIN + "/console/checkin",
    "Content-Type": "application/json;charset=UTF-8",
    "Accept": "application/json, text/plain, */*"
  };
}

function getStatus(cookie, cb) {
  $httpClient.get({ url: "https://" + DOMAIN + "/api/user/status", headers: headers(cookie) }, function (error, response, data) {
    var r = parseJson(data);
    if (!r || r.code !== 0 || !r.data) { cb(null); return; }
    cb({ email: r.data.email || "", days: parseDays(r.data.leftDays) });
  });
}

function getPoints(cookie, cb) {
  $httpClient.get({ url: "https://" + DOMAIN + "/api/user/points", headers: headers(cookie) }, function (error, response, data) {
    var r = parseJson(data);
    if (!r || r.code !== 0) { cb(0); return; }
    cb(parsePoints(r.points));
  });
}

function doExchange(cookie, cb) {
  $httpClient.post({
    url: "https://" + DOMAIN + "/api/user/exchange",
    headers: headers(cookie),
    body: JSON.stringify({ planType: PLANS[exchangePlan] })
  }, function (error, response, data) {
    var r = parseJson(data);
    if (r && r.code === 0) {
      cb("已兑换 " + PLANS[exchangePlan] + "（+" + PLAN_DAYS[exchangePlan] + " 天）");
    } else {
      cb("兑换失败，" + ((r && r.message) || "未知错误"));
    }
  });
}

function doCheckin(acct, next) {
  var email = "", daysBefore = "?";
  getStatus(acct.cookie, function (st) {
    if (st) { email = st.email; daysBefore = st.days; }
    var who = email ? acct.label + "（" + email + "）" : acct.label;
    $httpClient.post({
      url: "https://" + DOMAIN + "/api/user/checkin",
      headers: headers(acct.cookie),
      body: JSON.stringify({ token: DOMAIN })
    }, function (error, response, data) {
      var r = parseJson(data);
      var msg = (r && r.message) || "";
      var code = r ? r.code : -1;
      var earned = 0;
      var m = msg.match(/Got\s+(\d+)\s+Points/i);
      if (m) earned = parseInt(m[1], 10);
      else if (r && r.points !== undefined) earned = parsePoints(r.points);
      if (code === 0) {
        afterCheckin(acct, who, "签到成功 +" + earned + " 积分", daysBefore, next);
      } else if (code === 1 || /repeat|already|重复|已签到|签到过/i.test(msg)) {
        afterCheckin(acct, who, "今日已签到", daysBefore, next);
      } else if (code === 4 || /device-mismatch|Automated check-in detected/i.test(msg)) {
        results.push(who + "：设备校验失败，请重新抓取 Cookie（换设备登录后要重新抓）");
        next();
      } else {
        results.push(who + "：签到失败，" + (msg || "请重新抓取 Cookie"));
        next();
      }
    });
  });
}

function afterCheckin(acct, who, statusText, daysBefore, next) {
  getPoints(acct.cookie, function (points) {
    var need = parseInt(exchangePlan || "0", 10);
    if (PLANS[exchangePlan] && points >= need) {
      doExchange(acct.cookie, function (ex) {
        getStatus(acct.cookie, function (st) {
          var daysAfter = st ? st.days : "?";
          results.push(who + "：" + statusText + "，剩余 " + daysBefore + " → " + daysAfter + "，积分 " + points + "，" + ex);
          next();
        });
      });
    } else {
      getStatus(acct.cookie, function (st) {
        var daysAfter = st ? st.days : "?";
        results.push(who + "：" + statusText + "，剩余 " + daysBefore + " → " + daysAfter + "，积分 " + points);
        next();
      });
    }
  });
}

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  doCheckin(acct, processNext);
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填 Cookie", "打开 glados.rocks/console/account 停 1 秒自动抓取");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

processNext();
