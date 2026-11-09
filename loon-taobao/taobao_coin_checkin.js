// 淘宝淘金币每日签到
// 重放抓取到的 mtop.coingame.sign.supply 请求完成签到
// 支持 3 个固定账号 + 多账号文本框（每行一个抓取到的请求 JSON）
// 作者：許諾

var KEYS = ["taobao_coin_req", "taobao_coin_req2", "taobao_coin_req3"];
var ACCOUNTS_KEY = "taobao_coin_accounts";
var TIMEOUT = 15000;

function collectAccounts() {
  var list = [];
  for (var i = 0; i < KEYS.length; i++) {
    var v = $persistentStore.read(KEYS[i]);
    if (v) {
      list.push({ name: "账号" + (i + 1), raw: v });
    }
  }
  var multi = $persistentStore.read(ACCOUNTS_KEY);
  if (multi) {
    var lines = multi.split("\n");
    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim();
      if (line) {
        list.push({ name: "多账号" + (j + 1), raw: line });
      }
    }
  }
  return list;
}

function parseResult(body) {
  var data = null;
  try {
    var obj = JSON.parse(body);
    data = obj && obj.data ? obj.data : obj;
  } catch (e) {
    return { ok: false, msg: "返回无法解析" };
  }
  if (!data) {
    return { ok: false, msg: "返回为空" };
  }
  var code = data.resultCode;
  var msg = data.resultMsg || "";
  var model = data.model || {};
  if (code === "SUCCESS" || code === 0 || code === "0") {
    var reward = "";
    if (model) {
      var coins = model.coinNum || model.gainCoin || model.rewardCoin || model.coin;
      if (coins) {
        reward = "，+" + coins + "金币";
      }
    }
    return { ok: true, msg: "签到成功" + reward };
  }
  if (msg && (msg.indexOf("已签") !== -1 || msg.indexOf("重复") !== -1 || msg.indexOf("已领") !== -1)) {
    return { ok: true, msg: "今日已签到" };
  }
  if (code && (String(code).indexOf("ALREADY") !== -1 || String(code).indexOf("SIGNED") !== -1)) {
    return { ok: true, msg: "今日已签到" };
  }
  return { ok: false, msg: (msg || ("resultCode=" + code)) + "，请重新抓取" };
}

function doSign(account, cb) {
  var rec = null;
  try {
    rec = JSON.parse(account.raw);
  } catch (e) {
    rec = null;
  }
  if (!rec || !rec.url) {
    cb("保存的签到数据损坏，请重新抓取");
    return;
  }
  var headers = rec.headers || {};
  delete headers["Host"];
  delete headers["host"];
  delete headers["Content-Length"];
  delete headers["content-length"];
  $httpClient.get({ url: rec.url, headers: headers, timeout: TIMEOUT }, function (error, response, body) {
    if (error) {
      cb("请求失败：" + error);
      return;
    }
    var r = parseResult(body || "");
    cb(r.msg);
  });
}

function main() {
  var accounts = collectAccounts();
  if (accounts.length === 0) {
    $notification.post("淘宝淘金币签到", "未抓取到签到请求", "打开淘宝 App → 淘金币 → 点一次签到");
    $done({});
    return;
  }
  var results = [];
  var idx = 0;
  function next() {
    if (idx >= accounts.length) {
      var title = "淘宝淘金币签到";
      var subtitle = results.length > 1 ? ("共 " + results.length + " 个账号") : "";
      $notification.post(title, subtitle, results.join("\n"));
      $done({});
      return;
    }
    var acc = accounts[idx];
    idx++;
    doSign(acc, function (msg) {
      results.push(acc.name + "：" + msg);
      next();
    });
  }
  next();
}

main();
