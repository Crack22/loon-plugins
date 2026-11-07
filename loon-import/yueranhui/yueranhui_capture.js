// yueranhui_capture.js — 悦然荟签到：userCenterDetail 请求头 bid/version + referer 里的 appId（許諾签到合集）
// http-request ^https?://wox2019\.woxshare\.com/clientApi/userCenterDetail
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
  if (url.indexOf("userCenterDetail") === -1) { $done({}); return; }
  var changed = false;
  changed = save("@yueranhui.bid", getHeader($request.headers, "bid")) || changed;
  changed = save("@yueranhui.version", getHeader($request.headers, "version")) || changed;
  var referer = getHeader($request.headers, "referer");
  var m = referer.match(/servicewechat\.com\/([a-zA-Z0-9]+)/);
  if (m) changed = save("@yueranhui.appid", m[1]) || changed;
  if (changed) notify("悦然荟小程序数据获取成功");
  $done({});
})();
