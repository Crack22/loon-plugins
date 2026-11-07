// fmz_checkin_capture.js — 通用 Cookie 抓取（許諾签到合集）
// 插件的 http-request 行带 argument="key=<键名>&source=cookie&title=<服务名>"
// source：cookie（默认，存 Cookie 请求头）| authorization（存 Authorization 请求头）| query:<参数名>（存 URL 查询参数）
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
  function getQuery(url, name) {
    var m = url.match(/[?&]([^=#&]+)=([^&#]*)/g) || [];
    for (var i = 0; i < m.length; i++) {
      var kv = m[i].substring(1).split("=");
      if (decodeURIComponent(kv[0]) === name) return decodeURIComponent(kv[1] || "");
    }
    return "";
  }

  var key = "";
  var source = "cookie";
  var title = "签到";
  try {
    if (typeof $argument !== "undefined" && $argument) {
      if ($argument.key) key = $argument.key;
      if ($argument.source) source = $argument.source;
      if ($argument.title) title = $argument.title;
    }
  } catch (e) {}
  if (!key || !$request || $request.method === "OPTIONS") { $done({}); return; }

  var value = "";
  if (source === "authorization") {
    value = getHeader($request.headers, "Authorization");
  } else if (source.indexOf("query:") === 0) {
    value = getQuery($request.url || "", source.slice(6));
  } else {
    value = getHeader($request.headers, "Cookie");
  }
  value = (value || "").trim();
  if (!value) { $done({}); return; }

  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === value) { $done({}); return; }
  try { $persistentStore.write(value, key); } catch (e) {}
  try { $notification.post("✅ " + title + " Cookie 获取成功", "", key + " 已保存"); } catch (e) {}
  $done({});
})();
