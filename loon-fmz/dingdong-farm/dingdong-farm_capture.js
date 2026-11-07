// dingdong-farm_capture.js — 叮咚农场 Cookie 抓取（許諾签到合集）
// 匹配 maicai.api.ddxq.mobi/user/checkLogin 的请求，
// 保存 Cookie 请求头到 CookieDDXQfarm，并从 URL 的 station_id 参数保存到 CookieDDXQfarmStationId
(function () {
  var title = "叮咚农场";
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
  if (!$request || !$request.url) { $done({}); return; }
  var m = $request.url.match(/[?&]station_id=(\w+)/);
  if (!m) { $done({}); return; }
  var cookie = getHeader($request.headers, "Cookie");
  if (!cookie) { $done({}); return; }
  var changed = false;
  var oldCookie = "";
  try { oldCookie = $persistentStore.read("CookieDDXQfarm") || ""; } catch (e) {}
  if (oldCookie !== cookie) {
    try { $persistentStore.write(cookie, "CookieDDXQfarm"); } catch (e) {}
    changed = true;
  }
  var oldStation = "";
  try { oldStation = $persistentStore.read("CookieDDXQfarmStationId") || ""; } catch (e) {}
  if (oldStation !== m[1]) {
    try { $persistentStore.write(m[1], "CookieDDXQfarmStationId"); } catch (e) {}
    changed = true;
  }
  if (changed) {
    try { $notification.post("✅ " + title + " Cookie 获取成功", "", "CookieDDXQfarm、CookieDDXQfarmStationId 已保存"); } catch (e) {}
  }
  $done({});
})();
