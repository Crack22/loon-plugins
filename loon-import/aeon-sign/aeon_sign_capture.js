// aeon_sign_capture.js — 永旺 Aeon签到：登录响应的 mobile + token（許諾签到合集）
// http-response ^https://api\.aeonbuy\.com/api/access-auth-api/auth/third/silentWechatMiniLogin
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
  try { body = JSON.parse(($response && $response.body) || ""); } catch (e) {}
  var d = body && body.data;
  if (!d || !d.mobile || !d.token) { $done({}); return; }
  var list = loadList("aeon_data");
  var idx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && String(list[i].mobile) === String(d.mobile)) { idx = i; break; }
  }
  var entry = { mobile: d.mobile, token: d.token, nickname: d.nickname || "" };
  if (idx >= 0) { list[idx] = entry; } else { list.push(entry); }
  if (saveList("aeon_data", list)) notify("永旺 Aeon Token 获取成功");
  $done({});
})();
