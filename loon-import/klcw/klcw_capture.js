// klcw_capture.js — 酷乐潮玩小程序签到：SignIn 请求的请求头 + 请求体（許諾签到合集）
// http-request ^https://wxavip-tp\.ezrpro\.cn/Vip/SignIn/SignIn
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
  changed = save("evil_klcwSignStr", getHeader($request.headers, "SignStr")) || changed;
  changed = save("evil_klcwid", getHeader($request.headers, "uber-trace-id")) || changed;
  changed = save("evil_klcwVip", getHeader($request.headers, "ezr-v-ip")) || changed;
  changed = save("evil_klcwEncrypt", getHeader($request.headers, "ezr-encrypt")) || changed;
  changed = save("evil_klcwReferer", getHeader($request.headers, "Referer")) || changed;
  changed = save("evil_klcwBody", $request.body || "") || changed;
  if (changed) notify("酷乐潮玩小程序签到数据获取成功");
  $done({});
})();
