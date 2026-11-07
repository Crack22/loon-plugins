// nfzm_capture.js — 南方周末签到 URL 抓取（許諾签到合集）
// 匹配 api.infzm.com/mobile/pumpkin_task/complete 的签到请求，
// 保存完整请求 URL 到 senku_nfzm_url
(function () {
  var KEY = "senku_nfzm_url";
  var title = "南方周末";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || !$request.url) { $done({}); return; }
  var old = "";
  try { old = $persistentStore.read(KEY) || ""; } catch (e) {}
  if (old === $request.url) { $done({}); return; }
  try { $persistentStore.write($request.url, KEY); } catch (e) {}
  try { $notification.post("✅ " + title + " 会话获取成功", "", KEY + " 已保存"); } catch (e) {}
  $done({});
})();
