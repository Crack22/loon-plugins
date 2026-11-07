// tuhu_capture.js — 途虎养车签到：authorization + blackbox 请求头（許諾签到合集）
// http-request ^https://api\.tuhu\.cn/User/GetInternalCenterInfo
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
  changed = save("tuhu_blackbox", getHeader($request.headers, "blackbox")) || changed;
  var token = getHeader($request.headers, "authorization");
  if (token) {
    var list = loadList("tuhu_token");
    if (list.indexOf(token) === -1) {
      list.push(token);
      changed = saveList("tuhu_token", list) || changed;
    }
  }
  if (changed) notify("途虎养车 Token 获取成功");
  $done({});
})();
