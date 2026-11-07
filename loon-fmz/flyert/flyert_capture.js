// flyert_capture.js — 飞客-签到：保存 Cookie 与 URL 查询参数（許諾签到合集）
// http-request ^https://www.flyert.com.cn/api/mobile/index.php?module=getdata&.*
(function () {
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var cookie = getHeader($request.headers, "Cookie");
  var query = ($request.url || "").split("?")[1] || "";
  var changed = false;
  if (cookie) {
    var old = "";
    try { old = $persistentStore.read("Flyert_Cookie_Key") || ""; } catch (e) {}
    if (old !== cookie) {
      try { $persistentStore.write(cookie, "Flyert_Cookie_Key"); } catch (e) {}
      changed = true;
    }
  }
  if (query) {
    var params = {};
    query.split("&").forEach(function (pair) {
      var kv = pair.split("=");
      if (kv[0]) params[kv[0]] = kv[1] || "";
    });
    var val = JSON.stringify(params);
    var oldP = "";
    try { oldP = $persistentStore.read("Flyert_Param_Key") || ""; } catch (e) {}
    if (oldP !== val) {
      try { $persistentStore.write(val, "Flyert_Param_Key"); } catch (e) {}
      changed = true;
    }
  }
  if (changed) {
    try { $notification.post("✅ 飞客-签到 Cookie 获取成功", "", "签到数据已保存"); } catch (e) {}
  }
  $done({});
})();
