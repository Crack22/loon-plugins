// pdd_capture.js — 拼多多果园：从 Cookie 请求头提取 PDDAccessToken（許諾签到合集）
// http-request ^https://mobile.yangkeduo.com/proxy/api/api/server/_stm
(function () {
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
  if (!cookie) { $done({}); return; }
  var m = cookie.match(/PDDAccessToken=([^;]+)/);
  if (!m || !m[1]) { $done({}); return; }
  var token = m[1].trim();
  var changed = false;
  ["ddgyck", "fmz200_pdd_token"].forEach(function (k) {
    var old = "";
    try { old = $persistentStore.read(k) || ""; } catch (e) {}
    if (old !== token) {
      try { $persistentStore.write(token, k); } catch (e) {}
      changed = true;
    }
  });
  if (changed) {
    try { $notification.post("✅ 拼多多果园 token 获取成功", "", "ddgyck 已保存"); } catch (e) {}
  }
  $done({});
})();
