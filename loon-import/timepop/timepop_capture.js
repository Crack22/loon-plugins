// timepop_capture.js — Timepop签到：有赞签到/积分请求的 URL + Extra-Data 请求头（許諾签到合集）
// http-request ^https://h5\.youzan\.com/wscump/checkin/checkin\.json
// http-request ^https://h5\.youzan\.com/wscuser/membercenter/stats\.json
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
  if (url.indexOf("checkin_id") > -1 && url.indexOf("wx4a1af22a88a99386") > -1) {
    changed = save("evil_timepopurl", url) || changed;
    changed = save("evil_timepopcookie", getHeader($request.headers, "Extra-Data")) || changed;
  } else if (url.indexOf("stats") > -1 && url.indexOf("wx4a1af22a88a99386") > -1) {
    changed = save("evil_timepopstatusurl", url) || changed;
    changed = save("evil_timepopstatuscookie", getHeader($request.headers, "Extra-Data")) || changed;
  }
  if (changed) notify("Timepop签到数据获取成功");
  $done({});
})();
