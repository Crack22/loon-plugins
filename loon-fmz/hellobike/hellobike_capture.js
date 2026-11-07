// hellobike_capture.js — 哈啰出行 Token 抓取（許諾签到合集）
// 匹配 gameapi.hellobike.com/api 的请求，从请求体 JSON 的 token 字段保存到 hellobike
(function () {
  var KEY = "hellobike";
  var title = "哈啰出行";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || !$request.body) { $done({}); return; }
  var token = "";
  try {
    var body = JSON.parse($request.body);
    if (body && body.token) token = body.token;
  } catch (e) {}
  if (!token) { $done({}); return; }
  var old = "";
  try { old = $persistentStore.read(KEY) || ""; } catch (e) {}
  if (old === token) { $done({}); return; }
  try { $persistentStore.write(token, KEY); } catch (e) {}
  try { $notification.post("✅ " + title + " Token 获取成功", "", KEY + " 已保存"); } catch (e) {}
  $done({});
})();
