// neteasenews_capture.js — 网易新闻专用抓取（許諾签到合集）
// 上游 neteasenews.cookie.js：有请求体时把全部请求头存成 JSON（chavy_cookie_neteasenews）并存请求体（chavy_body_neteasenews）；无请求体时按固定字段拼请求头 JSON
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
  var title = "网易新闻";
  try {
    if (typeof $argument !== "undefined" && $argument) {
      if ($argument.title) title = $argument.title;
    }
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var body = $request.body || "";
  var cookieVal = "";
  if (body) {
    cookieVal = JSON.stringify($request.headers || {});
  } else {
    var h = $request.headers || {};
    var obj = {
      "Content-Length": "699",
      "isDirectRequest": "1",
      "X-NR-Trace-Id": getHeader(h, "X-NR-Trace-Id"),
      "User-DA": getHeader(h, "User-DA"),
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-D": getHeader(h, "User-D"),
      "User-U": getHeader(h, "User-U"),
      "User-id": getHeader(h, "User-id"),
      "User-C": getHeader(h, "User-C"),
      "User-tk": getHeader(h, "User-tk"),
      "User-N": getHeader(h, "User-N"),
      "User-Agent": "NewsApp/64.1 iOS/13.3 (iPhone10,1)",
      "Host": "c.m.163.com",
      "User-LC": getHeader(h, "User-LC"),
      "Accept-Language": "zh-cn",
      "Accept": "*/*",
      "User-L": getHeader(h, "User-L")
    };
    cookieVal = JSON.stringify(obj);
  }
  if (cookieVal) save("chavy_cookie_neteasenews", cookieVal, "请求头", title);
  if (body) save("chavy_body_neteasenews", body, "请求体", title);
  $done({});
})();
