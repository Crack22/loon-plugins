// 识日每日签到：Token 方式，账号数量不限
// 账号1/2/3：shiri_token(+2/+3)（打开识日 App 停 1 秒自动保存）
// 多账号：shiri_accounts，每行一个 Token
// 状态接口：GET https://shiri.jingqueyun.com/MobileHome/getHomeData（home.sign_data.flag：100 已签到，101 未签到；widget.sign_amount 累计天数）
// 签到接口：GET https://shiri.jingqueyun.com/MobileAccount/signIn，成功 flag=100，amount 累计天数，duobi 本次奖励读币
// 注意：请求头用 token（不是 Cookie）；Token 过期时重新打开 App 抓一次
var NAME = "识日";
var HOST = "https://shiri.jingqueyun.com";
var UA = "Dart/3.10 (dart:io)";

function read(k) { return $persistentStore.read(k) || ""; }
function parseJson(d) { try { return JSON.parse(d); } catch (e) { return null; } }

// 收集全部账号：账号1/2/3（固定栏位）+ 多账号文本框（每行一个 Token）
function collectAccounts() {
  var list = [];
  var t1 = read("shiri_token").trim();
  if (t1) list.push({ token: t1, label: "账号1" });
  var t2 = read("shiri_token2").trim();
  if (t2) list.push({ token: t2, label: "账号2" });
  var t3 = read("shiri_token3").trim();
  if (t3) list.push({ token: t3, label: "账号3" });
  var lines = (read("shiri_accounts") || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    list.push({ token: line, label: "账号" + (list.length + 1) });
  }
  return list;
}

var accounts = collectAccounts();
var results = [];
var idx = 0;

function headers(token) {
  return { "User-Agent": UA, "token": token, "accept-encoding": "gzip" };
}

function getHome(token, cb) {
  $httpClient.get({ url: HOST + "/MobileHome/getHomeData", headers: headers(token) }, function (error, response, data) {
    var r = parseJson(data);
    if (!r || r.flag !== 100) { cb(null); return; }
    var flag = (r.home && r.home.sign_data) ? r.home.sign_data.flag : null;
    var days = (r.widget && r.widget.sign_amount !== undefined) ? r.widget.sign_amount : "";
    cb({ signed: flag === 100, days: days });
  });
}

function doCheckin(acct, next) {
  getHome(acct.token, function (st) {
    if (st && st.signed) {
      results.push(acct.label + "：今日已签到" + (st.days !== "" ? "，累计 " + st.days + " 天" : ""));
      next();
      return;
    }
    $httpClient.get({ url: HOST + "/MobileAccount/signIn", headers: headers(acct.token) }, function (error, response, data) {
      var r = parseJson(data);
      if (!r) {
        results.push(acct.label + "：签到失败，返回异常（Token 可能过期，重新打开 App 抓一次）");
        next();
        return;
      }
      if (r.flag === 100) {
        results.push(acct.label + "：签到成功，累计 " + r.amount + " 天，+" + r.duobi + " 读币");
      } else if (/已签到|already/i.test(JSON.stringify(r))) {
        results.push(acct.label + "：今日已签到");
      } else {
        results.push(acct.label + "：签到失败，" + JSON.stringify(r).slice(0, 80));
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
    $notification.post(NAME + "签到", "还没填 Token", "打开识日 App 停 1 秒自动抓取");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

processNext();
