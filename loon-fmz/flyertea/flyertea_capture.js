// flyertea_capture.js — 飞客茶馆专用抓取（許諾签到合集）
// 上游 flyertea.cookie.js：Cookie 请求头存 chavy_cookie_flyertea，签到请求 URL 的查询参数拼成 JSON 存 chavy_token_flyertea
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
  var title = "飞客茶馆";
  try {
    if (typeof $argument !== "undefined" && $argument) {
      if ($argument.title) title = $argument.title;
    }
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var cookie = getHeader($request.headers, "Cookie");
  if (cookie) save("chavy_cookie_flyertea", cookie, "Cookie", title);
  var params = parseQuery($request.url || "");
  if (params.formhash) save("chavy_token_flyertea", JSON.stringify(params), "Token", title);
  $done({});
})();
