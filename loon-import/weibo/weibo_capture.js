// weibo_capture.js — 新浪微博签到：users/show 的 URL 组合 Token + logservice 的 SUB Cookie（許諾签到合集）
// http-request ^https://api\.weibo\.cn/\d/users/show
// http-request ^https://api\.weibo\.cn/2/logservice/attach
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
  if (url.indexOf("gsid=") > -1) {
    var from = url.match(/from=\w+/);
    var uid = url.match(/&uid=\d+/);
    var gsid = url.match(/&gsid=[_a-zA-Z0-9-]+/);
    var s = url.match(/&s=\w+/);
    if (!from || !uid || !gsid || !s) { $done({}); return; }
    var token = from[0] + uid[0] + gsid[0] + s[0];
    var old = read("sy_token_wb");
    if (old && old.indexOf(uid[0]) > -1) { $done({}); return; }
    var val = old ? old + "#" + token : token;
    try { $persistentStore.write(val, "sy_token_wb"); } catch (e) {}
    notify("新浪微博签到 Token 获取成功");
  } else {
    var cookie = getHeader($request.headers, "Cookie");
    var m = cookie.match(/SUB=[\w\-]+/);
    if (!m) { $done({}); return; }
    var old2 = read("wb_cookie");
    if (old2 && old2.indexOf(m[0]) > -1) { $done({}); return; }
    var val2 = old2 ? old2 + "#" + m[0] : m[0];
    try { $persistentStore.write(val2, "wb_cookie"); } catch (e) {}
    notify("新浪微博 Cookie 获取成功");
  }
  $done({});
})();
