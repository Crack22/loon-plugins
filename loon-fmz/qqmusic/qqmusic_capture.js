// qqmusic_capture.js — QQ音乐专用抓取（許諾签到合集）
// 上游 qqmusic.cookie.js：请求体含 receive_score 且带 Cookie 时，存签到地址/请求头/请求体/签到类型；响应体含 totalDays 时通知手动签到结果
// 只在值变化时保存并通知一次
(function () {
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  function parseQuery(url) {
    var params = {};
    var q = (url || "").split("?")[1] || "";
    if (!q) return params;
    var parts = q.split("&");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split("=");
      if (kv[0]) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
    }
    return params;
  }
  function save(key, value, label, title) {
    if (!value) return false;
    var old = "";
    try { old = $persistentStore.read(key) || ""; } catch (e) {}
    if (old === value) return false;
    try { $persistentStore.write(value, key); } catch (e) { return false; }
    try { $notification.post("✅ " + title + " " + label + "获取成功", "", key + " 已保存"); } catch (e) {}
    return true;
  }
  var title = "QQ音乐";
  try {
    if (typeof $argument !== "undefined" && $argument) {
      if ($argument.title) title = $argument.title;
    }
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  if (typeof $response !== "undefined" && $response && $response.body) {
    var savedUrl = "";
    var flag = "";
    try { savedUrl = $persistentStore.read("chavy_signurl_qqmusic") || ""; } catch (e) {}
    try { flag = $persistentStore.read("chavy_flag_qqmusic") || ""; } catch (e) {}
    if (($request.url || "") === savedUrl && savedUrl) {
      try {
        var obj = JSON.parse($response.body);
        if (obj && obj.req_0 && obj.req_0.data && obj.req_0.data.totalDays) {
          var label = flag === "MonthScore" ? "每月首签" : (flag === "sign_record" ? "签到记录" : "每日签到");
          $notification.post("✅ QQ音乐手动签到成功（" + label + "）", "", "共签 " + obj.req_0.data.totalDays + " 天，今天积分 +" + obj.req_0.data.todayScore);
        }
      } catch (e) {}
    }
    $done({});
    return;
  }
  var body = $request.body || "";
  var cookie = getHeader($request.headers, "Cookie");
  if (cookie && body.indexOf("receive_score") >= 0) {
    var flagVal = "";
    if (body.indexOf("receive_score") >= 0) flagVal = "receive_score";
    if (body.indexOf("MonthScore") >= 0) flagVal = "MonthScore";
    if (body.indexOf("sign_record") >= 0) flagVal = "sign_record";
    save("chavy_signurl_qqmusic", $request.url || "", "签到地址", title);
    save("chavy_header_qqmusic", JSON.stringify($request.headers || {}), "签到请求头", title);
    save("chavy_body_qqmusic", body, "签到请求体", title);
    save("chavy_flag_qqmusic", flagVal, "签到类型", title);
  }
  $done({});
})();
