// tsl_sign_capture.js — 谢瑞麟 TSL签到：登录响应的 user_info（許諾签到合集）
// http-response ^https://tslmember-crm\.tslj\.com\.cn/api/auth/login
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
  var u = body && body.data && body.data.user_info;
  if (!u || !u.token || !u.openid) { $done({}); return; }
  var list = loadList("tsl_data");
  var idx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].openid === u.openid) { idx = i; break; }
  }
  var entry = { openid: u.openid, mobile: u.mobile || "", token: u.token };
  if (idx >= 0) { list[idx] = entry; } else { list.push(entry); }
  if (saveList("tsl_data", list)) notify("谢瑞麟 Token 获取成功");
  $done({});
})();
