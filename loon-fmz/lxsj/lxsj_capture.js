// lxsj_capture.js — 旅行世界购物版签到请求抓取（許諾签到合集）
// 匹配 ios-fenqu11.lxsjgo.com/dog/bug?ts 的请求，
// 保存完整请求 {url, headers, body} 的 JSON 到 lxsjCookie
(function () {
  var KEY = "lxsjCookie";
  var title = "旅行世界购物版";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || !$request.url) { $done({}); return; }
  var val = JSON.stringify({ url: $request.url, headers: $request.headers, body: $request.body });
  var old = "";
  try { old = $persistentStore.read(KEY) || ""; } catch (e) {}
  if (old === val) { $done({}); return; }
  try { $persistentStore.write(val, KEY); } catch (e) {}
  try { $notification.post("✅ " + title + " Cookie 获取成功", "", KEY + " 已保存"); } catch (e) {}
  $done({});
})();
