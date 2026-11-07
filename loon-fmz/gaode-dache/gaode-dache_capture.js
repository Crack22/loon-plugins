// gaode-dache_capture.js — 高德地图打车签到：APP 响应 / 小程序 _ENCRYPT 参数里取 userId/adiu/sessionid（許諾签到合集）
// http-response script-response-body ^https?://(m5(|-zb)|dache).amap.com/(ws/yuece/(act|openapi/activity/current)/query|common/(alipaymini|wxmini)?_ENCRYPT=)
(function () {
  function b64decode(input) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var str = input.replace(/-/g, "+").replace(/_/g, "/").replace(/[^A-Za-z0-9+/=]/g, "");
    var out = "";
    var i = 0;
    while (i < str.length) {
      var e1 = chars.indexOf(str.charAt(i++));
      var e2 = chars.indexOf(str.charAt(i++));
      var e3 = chars.indexOf(str.charAt(i++));
      var e4 = chars.indexOf(str.charAt(i++));
      var c1 = (e1 << 2) | (e2 >> 4);
      var c2 = ((e2 & 15) << 4) | (e3 >> 2);
      var c3 = ((e3 & 3) << 6) | e4;
      out += String.fromCharCode(c1);
      if (e3 >= 0) out += String.fromCharCode(c2);
      if (e4 >= 0) out += String.fromCharCode(c3);
    }
    return out;
  }
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var url = $request.url || "";
  var abc = { userId: "", adiu: "", sessionid: "" };
  if (/\/common\/(alipaymini|wxmini)\?_ENCRYPT=/.test(url)) {
    var enc = url.split("_ENCRYPT=")[1].split("&")[0];
    var decoded = "";
    try { decoded = b64decode(decodeURIComponent(enc)); } catch (e) {}
    decoded.split("&").forEach(function (item) {
      var kv = item.split("=");
      if (kv[0]) abc[kv[0]] = kv[1] || "";
    });
    abc.userId = abc.userId || "";
    abc.adiu = abc.deviceId || "";
    abc.sessionid = abc.sessionId || "";
  } else {
    var responseData = null;
    try { responseData = JSON.parse(($response && $response.body) || "{}"); } catch (e) {}
    if (responseData && responseData.content) {
      abc.userId = responseData.content.uid || "";
      abc.adiu = responseData.content.adiu || "";
    }
    var headers = {};
    for (var k in ($request.headers || {})) { headers[k.toLowerCase()] = $request.headers[k]; }
    var sid = headers["sessionid"] || "";
    if (!sid && headers["cookie"]) {
      var cm = headers["cookie"].match(/sessionid=([^;]+)/);
      if (cm) sid = cm[1];
    }
    abc.sessionid = sid;
  }
  if (!abc.sessionid || abc.sessionid.length <= 30) { $done({}); return; }
  var key = "GD_Val";
  var val = JSON.stringify({ userId: abc.userId, adiu: abc.adiu, sessionid: abc.sessionid });
  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === val) { $done({}); return; }
  try { $persistentStore.write(val, key); } catch (e) {}
  try { $notification.post("✅ 高德地图打车签到 sessionid 获取成功", "", key + " 已保存"); } catch (e) {}
  $done({});
})();
