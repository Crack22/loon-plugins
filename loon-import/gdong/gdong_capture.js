// gdong_capture.js — G动签到：getUInfo 的 Cookie + ShupUpV5 请求体里的 access_token（許諾签到合集）
// http-request ^https://gdongapi\.wo-ish\.com/user/getUInfo
// http-request ^https://gdongapi\.wo-ish\.com/MsgBoard/ShupUpV5
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

  var url = $request.url || "";
  var changed = false;
  if (url.indexOf("/user/getUInfo") > -1) {
    changed = save("gdCookie", getHeader($request.headers, "Cookie")) || changed;
  } else if (url.indexOf("/MsgBoard/ShupUpV5") > -1) {
    var m = ($request.body || "").match(/access_token=([^&]*)/);
    if (m) changed = save("gd_accessToken", decodeURIComponent(m[1])) || changed;
  }
  if (changed) notify("G动签到数据获取成功");
  $done({});
})();
