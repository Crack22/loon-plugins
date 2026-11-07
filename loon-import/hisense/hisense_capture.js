// hisense_capture.js — 海信爱家签到：请求 Cookie + 响应里的 TOKEN_ACTIVITY（許諾签到合集）
// http-response ^https://sweixin\.hisense\.com/ecrp/member/initMember
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

  var changed = false;
  changed = save("HISENSE_SWEIXIN", getHeader($request.headers, "Cookie")) || changed;
  var body = ($response && $response.body) || "";
  var m = body.match(/TOKEN_ACTIVITY=\w+/);
  if (m) changed = save("HISENSE_CPS", m[0]) || changed;
  if (changed) notify("海信爱家签到数据获取成功");
  $done({});
})();
