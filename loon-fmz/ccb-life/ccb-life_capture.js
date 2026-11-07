// ccb-life_capture.js — 建行生活签到：抓取签到 body 与自动登录信息（許諾签到合集）
// http-request script-request-body ^https://yunbusiness.ccb.com/(clp_coupon|clp_service)/txCtrl?txcode=(A3341A038|autoLogin)
(function () {
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  function save(key, val) {
    var old = "";
    try { old = $persistentStore.read(key) || ""; } catch (e) {}
    if (old === val) return false;
    try { $persistentStore.write(val, key); } catch (e) {}
    return true;
  }
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var url = $request.url || "";
  var changed = false;
  if (/A3341A038/.test(url)) {
    var bodyObj = null;
    try { bodyObj = JSON.parse($request.body || "{}"); } catch (e) {}
    if (bodyObj) {
      var mid = getHeader($request.headers, "mid");
      if (mid) bodyObj.MID = mid;
      changed = save("JHSH_BODY", JSON.stringify(bodyObj)) || changed;
    }
  } else if (/autoLogin/.test(url)) {
    var deviceId = getHeader($request.headers, "deviceid");
    var ua = getHeader($request.headers, "mbc-user-agent");
    if (deviceId && ua && $request.body) {
      changed = save("JHSH_LOGIN_INFO", JSON.stringify({ DeviceId: deviceId, MBCUserAgent: ua, Body: $request.body })) || changed;
    }
  }
  if (changed) {
    try { $notification.post("✅ 建行生活签到 数据获取成功", "", "签到数据已保存"); } catch (e) {}
  }
  $done({});
})();
