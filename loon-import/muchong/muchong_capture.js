// muchong_capture.js — 小木虫专用抓取（許諾签到合集）
// 把请求头 JSON 存到 muchong_headers。只在值变化时保存并通知一次
(function () {
  var title = "小木虫";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var value = JSON.stringify($request.headers || {});
  if (!value || value === "{}") { $done({}); return; }
  var old = "";
  try { old = $persistentStore.read("muchong_headers") || ""; } catch (e) {}
  if (old === value) { $done({}); return; }
  try { $persistentStore.write(value, "muchong_headers"); } catch (e) {}
  try { $notification.post("✅ " + title + " 会话获取成功", "", "muchong_headers 已保存"); } catch (e) {}
  $done({});
})();
