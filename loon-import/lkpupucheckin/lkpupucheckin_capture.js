// lkpupucheckin_capture.js — 朴朴签到专用抓取（許諾签到合集）
// 拦截朴朴短信登录响应，从响应体 JSON 的 data.refresh_token 保存到 lkPuPuRefreshTokenKey。
// 只在值变化时保存并通知一次
(function () {
  var title = "朴朴签到";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (typeof $response === "undefined" || !$response || !$response.body) { $done({}); return; }
  var token = "";
  try {
    var data = JSON.parse($response.body);
    if (data && data.data && data.data.refresh_token) token = data.data.refresh_token;
  } catch (e) {}
  if (!token) { $done({}); return; }
  var old = "";
  try { old = $persistentStore.read("lkPuPuRefreshTokenKey") || ""; } catch (e) {}
  if (old === token) { $done({}); return; }
  try { $persistentStore.write(token, "lkPuPuRefreshTokenKey"); } catch (e) {}
  try { $notification.post("✅ " + title + " Token 获取成功", "", "lkPuPuRefreshTokenKey 已保存"); } catch (e) {}
  $done({});
})();
