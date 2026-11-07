// wanda_capture.js — 万达电影 _mi_ 抓取（許諾签到合集）
// 匹配 user-api-prd-mx.wandafilm.com 的请求，从 MX-API 请求头 JSON 的 _mi_ 字段保存到 senku_wanda_mi_
(function () {
  var KEY = "senku_wanda_mi_";
  var title = "万达电影";
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
  var raw = getHeader($request.headers, "MX-API");
  if (!raw) { $done({}); return; }
  var mi = "";
  try {
    var obj = JSON.parse(raw);
    if (obj && obj._mi_) mi = obj._mi_;
  } catch (e) {}
  if (!mi) { $done({}); return; }
  var old = "";
  try { old = $persistentStore.read(KEY) || ""; } catch (e) {}
  if (old === mi) { $done({}); return; }
  try { $persistentStore.write(mi, KEY); } catch (e) {}
  try { $notification.post("✅ " + title + " 会话获取成功", "", KEY + " 已保存"); } catch (e) {}
  $done({});
})();
