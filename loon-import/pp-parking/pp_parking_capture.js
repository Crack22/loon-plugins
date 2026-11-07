// pp_parking_capture.js — PP 停车签到：user/token 请求头 rest_api_token（許諾签到合集）
// http-request ^https://api\.660pp\.com/rest/[\d.]+?/user/token
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

  var token = getHeader($request.headers, "rest_api_token");
  if (!token) { $done({}); return; }
  var list = loadList("pp_token");
  if (list.indexOf(token) > -1) { $done({}); return; }
  list.push(token);
  if (saveList("pp_token", list)) notify("PP 停车 Token 获取成功");
  $done({});
})();
