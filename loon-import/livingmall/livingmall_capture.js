// livingmall_capture.js — 丽影云街签到：Authorization 请求头 + 请求体里的 member_id（許諾签到合集）
// http-request ^https://rest\.zhimatech\.com/v3/api
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

  var token = getHeader($request.headers, "authorization");
  var memberId = null;
  try { memberId = JSON.parse($request.body || "{}").params.member_id; } catch (e) {}
  if (!token || !memberId) { $done({}); return; }
  var list = loadList("living_info");
  var idx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && String(list[i].member_id) === String(memberId)) { idx = i; break; }
  }
  var entry = { member_id: memberId, access_token: token };
  if (idx >= 0) { list[idx] = entry; } else { list.push(entry); }
  if (saveList("living_info", list)) notify("丽影云街签到数据获取成功");
  $done({});
})();
