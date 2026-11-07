// hzh_capture.js — 华住会签到：signIn 请求的 Cookie + User-Token 请求头（許諾签到合集）
// http-request ^https://hweb-mbf\.huazhu\.com/api/signIn
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
  changed = save("evil_hzhCookie", getHeader($request.headers, "Cookie")) || changed;
  changed = save("evil_hzhUserToken", getHeader($request.headers, "User-Token")) || changed;
  if (changed) notify("华住会签到数据获取成功");
  $done({});
})();
