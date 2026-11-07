// huke_capture.js — 虎课网专用抓取（許諾签到合集）
// 从 Cookie 请求头提取 PHPSESSID 存到 huke_token，并把完整请求头 JSON 存到 huke_header。
// 只在值变化时保存并通知一次
(function () {
  var title = "虎课网";
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
  var cookie = getHeader($request.headers, "Cookie");
  var m = cookie.match(/PHPSESSID=([^;]+)/);
  if (!m) { $done({}); return; }
  var changed = [];
  function save(key, value) {
    value = (value || "").trim();
    if (!value) return;
    var old = "";
    try { old = $persistentStore.read(key) || ""; } catch (e) {}
    if (old === value) return;
    try { $persistentStore.write(value, key); changed.push(key); } catch (e) {}
  }
  save("huke_token", m[1]);
  save("huke_header", JSON.stringify($request.headers || {}));
  if (changed.length) {
    try { $notification.post("✅ " + title + " Token 获取成功", "", changed.join("、") + " 已保存"); } catch (e) {}
  }
  $done({});
})();
