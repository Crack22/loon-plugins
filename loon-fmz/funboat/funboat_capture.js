// funboat_capture.js — Funboat签到：保存签到/积分请求的 URL 与 Extra-Data（許諾签到合集）
// http-request ^https?://h5.youzan.com/wsc.*app_id=wx9b5caf9d1669dc96
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
  var url = $request.url || "";
  var extra = getHeader($request.headers, "Extra-Data");
  if (!extra) { $done({}); return; }
  var urlKey = "", ckKey = "", title = "";
  if (/checkin_id/.test(url)) { urlKey = "evil_funkourl"; ckKey = "evil_funkocookie"; title = "签到"; }
  else if (/stats/.test(url)) { urlKey = "evil_funkostatusurl"; ckKey = "evil_funkostatuscookie"; title = "积分"; }
  else { $done({}); return; }
  var changed = false;
  [[urlKey, url], [ckKey, extra]].forEach(function (kv) {
    var old = "";
    try { old = $persistentStore.read(kv[0]) || ""; } catch (e) {}
    if (old !== kv[1]) {
      try { $persistentStore.write(kv[1], kv[0]); } catch (e) {}
      changed = true;
    }
  });
  if (changed) {
    try { $notification.post("✅ Funboat签到 获取" + title + "Cookie成功", "", "数据已保存"); } catch (e) {}
  }
  $done({});
})();
