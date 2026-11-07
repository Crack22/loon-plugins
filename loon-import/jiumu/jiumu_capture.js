// jiumu_capture.js — 九木杂物社签到：SignIn 请求的请求头 + 请求体（許諾签到合集）
// http-request ^https://wxavip-up\.ezrpro\.cn/Vip/SignIn/SignIn
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
  changed = save("evil_jiumuSignStr", getHeader($request.headers, "SignStr")) || changed;
  changed = save("evil_jiumuVip", getHeader($request.headers, "ezr-v-ip")) || changed;
  changed = save("evil_jiumuEncrypt", getHeader($request.headers, "ezr-encrypt")) || changed;
  changed = save("evil_jiumuReferer", getHeader($request.headers, "Referer")) || changed;
  changed = save("evil_jiumuBody", $request.body || "") || changed;
  if (changed) notify("九木杂物社签到数据获取成功");
  $done({});
})();
