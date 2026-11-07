// blackmatrix7-luka_capture.js — Luka阅读养成专用抓取（許諾签到合集）
// 从 Authorization 请求头（Bearer 开头）存 luka_signin_auth，从 Cookie 请求头存 luka_checkin_cookie。
// 只在值变化时保存并通知一次
(function () {
  var title = "Luka";
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
  var auth = getHeader($request.headers, "Authorization");
  if (!auth || auth.toLowerCase().indexOf("bearer") < 0) { $done({}); return; }
  var changed = [];
  function save(key, value) {
    value = (value || "").trim();
    if (!value) return;
    var old = "";
    try { old = $persistentStore.read(key) || ""; } catch (e) {}
    if (old === value) return;
    try { $persistentStore.write(value, key); changed.push(key); } catch (e) {}
  }
  save("luka_signin_auth", auth);
  save("luka_checkin_cookie", getHeader($request.headers, "Cookie"));
  if (changed.length) {
    try { $notification.post("✅ " + title + " Cookie 获取成功", "", changed.join("、") + " 已保存"); } catch (e) {}
  }
  $done({});
})();
