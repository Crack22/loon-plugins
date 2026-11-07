// oclean_capture.js — 欧可林：从 Cookie 请求头提取 Shop-Member 的值（許諾签到合集）
// http-request ^https://mall.oclean.com/API/VshopProcess.ashx$
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
  var m = cookie.match(/Shop-Member=(\S*);/);
  if (!m || !m[1]) { $done({}); return; }
  var key = "Oclean";
  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === m[1]) { $done({}); return; }
  try { $persistentStore.write(m[1], key); } catch (e) {}
  try { $notification.post("✅ 欧可林 Cookie 获取成功", "", key + " 已保存"); } catch (e) {}
  $done({});
})();
