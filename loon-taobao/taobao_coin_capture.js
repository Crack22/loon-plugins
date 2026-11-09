// 淘宝淘金币签到抓取
// 匹配 mtop.coingame.sign.supply 请求，保存完整 URL + 请求头
// 之后 cron 每天重放该请求完成签到
// 作者：許諾

var KEY = "taobao_coin_req";

function main() {
  if (typeof $request === "undefined" || !$request || !$request.url) {
    $done({});
    return;
  }
  var url = $request.url || "";
  if (url.indexOf("mtop.coingame.sign.supply") === -1) {
    $done({});
    return;
  }
  var headers = $request.headers || {};
  var record = { url: url, headers: headers };
  var val;
  try {
    val = JSON.stringify(record);
  } catch (e) {
    $done({});
    return;
  }
  var old = $persistentStore.read(KEY);
  $persistentStore.write(val, KEY);
  if (old === val) {
    $notification.post("淘宝淘金币签到", "签到请求已更新", "之后每天 09:00 自动签到");
  } else {
    $notification.post("淘宝淘金币签到", "签到请求已抓取", "之后每天 09:00 自动签到");
  }
  $done({});
}

main();
