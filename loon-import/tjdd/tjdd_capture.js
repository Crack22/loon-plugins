// tjdd_capture.js — 唐机豆豆专用抓取（許諾签到合集）
// 从 URL 取 access_token，从 Extra-Data 请求头取 sid/uuid，拼成 access_token&sid&uuid 存到 tjdd_data，
// 多账号用 @ 分隔，重复账号不重复保存。只在值变化时保存并通知一次
(function () {
  var title = "唐机豆豆";
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
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var url = $request.url || "";
  var m = url.match(/[?&]access_token=([^&]+)/);
  if (!m) { $done({}); return; }
  var sid = "", uuid = "";
  try {
    var extra = JSON.parse(getHeader($request.headers, "extra-data") || "{}");
    sid = extra.sid || "";
    uuid = extra.uuid || "";
  } catch (e) {}
  if (!sid || !uuid) { $done({}); return; }
  var account = "";
  try { account = decodeURIComponent(m[1]) + "&" + sid + "&" + uuid; } catch (e) { account = m[1] + "&" + sid + "&" + uuid; }
  var saved = "";
  try { saved = $persistentStore.read("tjdd_data") || ""; } catch (e) {}
  var parts = saved ? saved.split("@") : [];
  if (parts.indexOf(account) >= 0) { $done({}); return; }
  parts.push(account);
  var value = parts.join("@");
  try { $persistentStore.write(value, "tjdd_data"); } catch (e) {}
  try { $notification.post("✅ " + title + " 数据获取成功", "", "tjdd_data 已保存，共 " + parts.length + " 个账号"); } catch (e) {}
  $done({});
})();
