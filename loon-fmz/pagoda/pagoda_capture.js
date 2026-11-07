// pagoda_capture.js — 百果园签到请求抓取（許諾签到合集）
// 匹配微信小程序 wx-mini.pagoda.com.cn/api/v1/wxmini/signIn/customer 的签到请求，
// 保存完整请求 {url, headers} 的 JSON 到 chavy_sign_pagoda
(function () {
  var KEY = "chavy_sign_pagoda";
  var title = "百果园";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || !$request.url || !$request.headers) { $done({}); return; }
  var val = JSON.stringify({ url: $request.url, headers: $request.headers });
  var old = "";
  try { old = $persistentStore.read(KEY) || ""; } catch (e) {}
  if (old === val) { $done({}); return; }
  try { $persistentStore.write(val, KEY); } catch (e) {}
  try { $notification.post("✅ " + title + " 会话获取成功", "", KEY + " 已保存"); } catch (e) {}
  $done({});
})();
