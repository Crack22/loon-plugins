// 网易云音乐每日签到：Cookie 方式，账号1/2/3 + 多账号
// 账号1：netease_cookie（打开网易云音乐 App 停 1 秒自动保存）
// 账号2/3：netease_cookie2 / netease_cookie3（BoxJs 里手动粘贴完整 Cookie）
// 更多账号：netease_accounts，每行一个完整 Cookie
// 签到接口：GET https://music.163.com/api/point/dailyTask?type=1（网页端）
// 实测 2026-11-07：type=1 首次返回 {"code":200,"point":2}，重复返回 {"code":-2,"msg":"重复签到"}
// APP 端 type=0 已停用：/api 和 /weapi 都是 {"code":200,"msg":"功能暂不支持"}，所以只签网页端，每天 +2 成长值
// 云贝中心（/xeapi/pointmall/user/sign）和 VIP 签到（/xeapi/vip-center-bff/task/sign）是 xeapi 加密接口，
// 每次请求的密文都不一样，无法重放、也无法在 Loon 里重新加密，所以做不了自动签，只能在 App 里手动签
var NAME = "网易云音乐";
var URL = "https://music.163.com/api/point/dailyTask?type=1";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15";

function read(k) { return $persistentStore.read(k) || ""; }
function parseJson(d) { try { return JSON.parse(d); } catch (e) { return null; } }

function collectAccounts() {
  var list = [];
  var c1 = read("netease_cookie").trim();
  if (c1) list.push({ cookie: c1, label: "账号1" });
  var c2 = read("netease_cookie2").trim();
  if (c2) list.push({ cookie: c2, label: "账号2" });
  var c3 = read("netease_cookie3").trim();
  if (c3) list.push({ cookie: c3, label: "账号3" });
  var lines = (read("netease_accounts") || "").split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    list.push({ cookie: line, label: "账号" + (list.length + 1) });
  }
  return list;
}

var accounts = collectAccounts();
var results = [];
var idx = 0;

function doCheckin(acct, next) {
  $httpClient.get({
    url: URL,
    headers: { "Cookie": acct.cookie, "User-Agent": UA, "Referer": "https://music.163.com/", "Host": "music.163.com" }
  }, function (error, response, data) {
    var r = parseJson(data);
    if (!r) {
      results.push(acct.label + "：签到失败，返回异常（Cookie 可能过期，重新打开 App 抓一次）");
      next();
      return;
    }
    if (r.code === 200 && r.point !== undefined) {
      results.push(acct.label + "：签到成功，+" + r.point + " 成长值");
    } else if (r.code === -2) {
      results.push(acct.label + "：今日已签到");
    } else if (r.code === 200 && r.msg) {
      results.push(acct.label + "：签到失败，" + r.msg + "（Cookie 可能过期，重新打开 App 抓一次）");
    } else {
      results.push(acct.label + "：签到失败，" + JSON.stringify(r).slice(0, 80));
    }
    next();
  });
}

function processNext() {
  if (idx >= accounts.length) { finish(); return; }
  var acct = accounts[idx++];
  doCheckin(acct, processNext);
}

function finish() {
  if (results.length === 0) {
    $notification.post(NAME + "签到", "还没填 Cookie", "打开网易云音乐 App 停 1 秒自动抓取");
  } else {
    $notification.post(NAME + "签到", "共 " + results.length + " 个账号", results.join("\n"));
  }
  $done({});
}

processNext();
