// erke_capture.js — 鸿星尔克专用抓取（許諾签到合集）
// 把完整请求 URL 存到 erke_data，多账号用 @ 分隔，相同 memberId 的 URL 会被覆盖。
// 只在值变化时保存并通知一次
(function () {
  var title = "鸿星尔克";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var url = $request.url || "";
  if (!url) { $done({}); return; }
  function memberId(u) {
    var m = u.match(/[?&]memberId=([^&]+)/);
    return m ? m[1] : "";
  }
  var mid = memberId(url);
  var saved = "";
  try { saved = $persistentStore.read("erke_data") || ""; } catch (e) {}
  var parts = saved ? saved.split("@") : [];
  var idx = -1;
  if (mid) {
    for (var i = 0; i < parts.length; i++) {
      if (memberId(parts[i]) === mid) { idx = i; break; }
    }
  }
  if (idx >= 0) parts[idx] = url;
  else parts.push(url);
  var value = parts.join("@");
  if (value === saved) { $done({}); return; }
  try { $persistentStore.write(value, "erke_data"); } catch (e) {}
  try { $notification.post("✅ " + title + " URL 获取成功", "", "erke_data 已保存，共 " + parts.length + " 个账号"); } catch (e) {}
  $done({});
})();
