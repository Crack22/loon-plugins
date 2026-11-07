// telecom-10000_capture.js — 电信营业厅专用抓取（許諾签到合集）
// 上游 10000.cookie.js 保存签到请求的请求头 JSON（chavy_signheader_10000）和请求体（chavy_signbody_10000）；手机号 chavy_mobile_10000 需手动填
// 只在值变化时保存并通知一次
(function () {
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  function parseQuery(url) {
    var params = {};
    var q = (url || "").split("?")[1] || "";
    if (!q) return params;
    var parts = q.split("&");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split("=");
      if (kv[0]) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
    }
    return params;
  }
  function save(key, value, label, title) {
    if (!value) return false;
    var old = "";
    try { old = $persistentStore.read(key) || ""; } catch (e) {}
    if (old === value) return false;
    try { $persistentStore.write(value, key); } catch (e) { return false; }
    try { $notification.post("✅ " + title + " " + label + "获取成功", "", key + " 已保存"); } catch (e) {}
    return true;
  }
  var title = "电信营业厅";
  try {
    if (typeof $argument !== "undefined" && $argument) {
      if ($argument.title) title = $argument.title;
    }
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var headers = $request.headers || {};
  var body = $request.body || "";
  if (headers && Object.keys(headers).length) save("chavy_signheader_10000", JSON.stringify(headers), "请求头", title);
  if (body) save("chavy_signbody_10000", body, "请求体", title);
  $done({});
})();
