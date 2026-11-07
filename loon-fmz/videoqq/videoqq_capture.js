// videoqq_capture.js — 腾讯视频专用抓取（許諾签到合集）
// videoqq.cookie.js：URL 含 auth_refresh 时存 Cookie + 登录地址/请求头；含 mobile_checkin 时存签到地址/请求头并清空登录地址/请求头
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
  var title = "腾讯视频";
  try {
    if (typeof $argument !== "undefined" && $argument) {
      if ($argument.title) title = $argument.title;
    }
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var url = $request.url || "";
  var cookie = getHeader($request.headers, "Cookie");
  if (url.indexOf("auth_refresh") > 0) {
    if (cookie) save("chavy_cookie_videoqq", cookie, "Cookie", title);
    save("chavy_auth_url_videoqq", url, "登录地址", title);
    save("chavy_auth_header_videoqq", JSON.stringify($request.headers || {}), "登录请求头", title);
  } else if (url.indexOf("mobile_checkin") > 0) {
    save("chavy_msign_url_videoqq", url, "签到地址", title);
    save("chavy_msign_header_videoqq", JSON.stringify($request.headers || {}), "签到请求头", title);
    if (cookie) save("chavy_cookie_videoqq", cookie, "Cookie", title);
    try { $persistentStore.write("", "chavy_auth_url_videoqq"); } catch (e) {}
    try { $persistentStore.write("", "chavy_auth_header_videoqq"); } catch (e) {}
  }
  $done({});
})();
