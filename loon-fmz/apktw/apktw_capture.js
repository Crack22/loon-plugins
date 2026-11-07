// apktw_capture.js — APK.TW专用抓取（許諾签到合集）
// apktw.cookie.js：把登录请求整个存为 JSON（地址+请求体+请求头，去掉 Content-Length 和 Cookie）到 chavy_cookie_apktw，签到脚本直接重放该请求
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
  var title = "APK.TW";
  try {
    if (typeof $argument !== "undefined" && $argument) {
      if ($argument.title) title = $argument.title;
    }
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var hs = $request.headers || {};
  var headers = {};
  for (var k in hs) {
    var lk = k.toLowerCase();
    if (lk === "content-length" || lk === "cookie") continue;
    headers[k] = hs[k];
  }
  var session = { url: $request.url || "", body: $request.body || "", headers: headers };
  save("chavy_cookie_apktw", JSON.stringify(session), "登录会话", title);
  $done({});
})();
