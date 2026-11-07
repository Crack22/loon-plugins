// atstudydk_capture.js — 学掌门打卡专用抓取（許諾签到合集）
// 把请求头 JSON 存到 daka_hd。只在值变化时保存并通知一次
(function () {
  var title = "学掌门";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var value = JSON.stringify($request.headers || {});
  if (!value || value === "{}") { $done({}); return; }
  var old = "";
  try { old = $persistentStore.read("daka_hd") || ""; } catch (e) {}
  if (old === value) { $done({}); return; }
  try { $persistentStore.write(value, "daka_hd"); } catch (e) {}
  try { $notification.post("✅ " + title + " headers 获取成功", "", "daka_hd 已保存"); } catch (e) {}
  $done({});
})();
