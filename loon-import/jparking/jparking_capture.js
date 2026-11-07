// jparking_capture.js — 捷停车签到：请求体 JSON 里的 userId + token（許諾签到合集）
// http-request ^https://sytgate\.jslife\.com\.cn/core-gateway/order/carno/pay/info
(function () {

  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  function read(key) {
    try { return $persistentStore.read(key) || ""; } catch (e) { return ""; }
  }
  function save(key, value) {
    value = (value || "").trim();
    if (!value) return false;
    if (read(key) === value) return false;
    try { $persistentStore.write(value, key); } catch (e) {}
    return true;
  }
  function loadList(key) {
    var list = [];
    try { list = JSON.parse(read(key) || "[]") || []; } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    return list;
  }
  function saveList(key, list) {
    var val = JSON.stringify(list);
    if (read(key) === val) return false;
    try { $persistentStore.write(val, key); } catch (e) {}
    return true;
  }
  function notify(title) {
    try { $notification.post("✅ " + title, "", "签到数据已保存"); } catch (e) {}
  }
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }

  var body = null;
  try { body = JSON.parse($request.body || ""); } catch (e) {}
  if (!body || !body.userId) { $done({}); return; }
  var old = read("jtc_userId");
  var parts = old ? old.split("@") : [];
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].split(",")[0] === String(body.userId)) { $done({}); return; }
  }
  var val = old ? old + "@" + body.userId + "," + (body.token || "") : body.userId + "," + (body.token || "");
  try { $persistentStore.write(val, "jtc_userId"); } catch (e) {}
  notify("捷停车签到数据获取成功");
  $done({});
})();
