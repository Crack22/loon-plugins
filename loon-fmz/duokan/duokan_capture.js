// duokan_capture.js — 多看阅读 Cookie 抓取（許諾签到合集）
// 匹配 www.duokan.com 的请求，Cookie 需同时含 token= 与 device_id=，
// 保存 Cookie 到 duokan_cookie，并从 Cookie 提取 device_id 到 duokan_device_id
(function () {
  var title = "多看";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  if (!$request) { $done({}); return; }
  var cookie = getHeader($request.headers, "Cookie");
  if (!cookie || cookie.indexOf("token=") === -1 || cookie.indexOf("device_id=") === -1) { $done({}); return; }
  var m = cookie.match(/device_id=([^;]+)/);
  if (!m) { $done({}); return; }
  var changed = false;
  var oldCookie = "";
  try { oldCookie = $persistentStore.read("duokan_cookie") || ""; } catch (e) {}
  if (oldCookie !== cookie) {
    try { $persistentStore.write(cookie, "duokan_cookie"); } catch (e) {}
    changed = true;
  }
  var oldId = "";
  try { oldId = $persistentStore.read("duokan_device_id") || ""; } catch (e) {}
  if (oldId !== m[1]) {
    try { $persistentStore.write(m[1], "duokan_device_id"); } catch (e) {}
    changed = true;
  }
  if (changed) {
    try { $notification.post("✅ " + title + " Cookie 获取成功", "", "duokan_cookie、duokan_device_id 已保存"); } catch (e) {}
  }
  $done({});
})();
