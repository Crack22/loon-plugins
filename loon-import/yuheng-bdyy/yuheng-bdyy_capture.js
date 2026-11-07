// yuheng-bdyy_capture.js — 波点音乐专用抓取（許諾签到合集）
// 从 URL 取 uid/token，从请求头取 qimei36/devid，按 uid 合并进 bdyy_account JSON 数组。
// 只在值变化时保存并通知一次
(function () {
  var title = "波点音乐";
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
  if (!$request || ($request.method || "GET").toUpperCase() !== "GET") { $done({}); return; }
  var url = $request.url || "";
  var um = url.match(/uid=(\d+)/);
  var tm = url.match(/token=(\w+)/);
  if (!um || !tm) { $done({}); return; }
  var uid = um[1], token = tm[1];
  var qimei36 = getHeader($request.headers, "qimei36");
  var devid = getHeader($request.headers, "devid");
  var list = [];
  try { list = JSON.parse($persistentStore.read("bdyy_account") || "[]"); } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  var idx = -1;
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].uid) === uid) { idx = i; break; }
  }
  if (idx === -1) list.push({ uid: uid, token: token, qimei36: qimei36, devid: devid });
  else { list[idx].token = token; list[idx].qimei36 = qimei36; list[idx].devid = devid; }
  var value = JSON.stringify(list);
  var old = "";
  try { old = $persistentStore.read("bdyy_account") || ""; } catch (e) {}
  if (old === value) { $done({}); return; }
  try { $persistentStore.write(value, "bdyy_account"); } catch (e) {}
  try { $notification.post("✅ " + title + " Cookie 获取成功", "", "bdyy_account 已保存，用户ID: " + uid); } catch (e) {}
  $done({});
})();
