// zsfc_capture.js — 掌上飞车签到数据抓取（許諾签到合集）
// 匹配 comm.ams.game.qq.com/ams/ame/amesvr 的请求，
// 从 Cookie 取 accessToken / openId / tokenParams（内含 roleId / uin / areaId），
// 从请求体取 iActivityId / iFlowId，共保存 7 个键
(function () {
  var title = "掌上飞车";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  function matchParam(str, name) {
    if (!str) return "";
    var m = str.match(new RegExp(name + "=([^&;]+)"));
    if (!m) return "";
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }
  if (!$request) { $done({}); return; }
  var cookie = getHeader($request.headers, "Cookie");
  var body = $request.body || "";
  var tokenParams = "";
  try { tokenParams = decodeURIComponent(matchParam(cookie, "tokenParams")); } catch (e) {}
  var vals = {
    zsfc_accessToken: matchParam(cookie, "accessToken"),
    zsfc_openid: matchParam(cookie, "openId"),
    zsfc_roleId: matchParam(tokenParams, "roleId"),
    zsfc_uin: matchParam(tokenParams, "uin"),
    zsfc_areaId: matchParam(tokenParams, "areaId"),
    zsfc_iActivityId: matchParam(body, "iActivityId"),
    zsfc_iFlowId: matchParam(body, "iFlowId")
  };
  var changed = false;
  var saved = [];
  for (var k in vals) {
    if (!vals[k]) continue;
    var old = "";
    try { old = $persistentStore.read(k) || ""; } catch (e) {}
    if (old !== vals[k]) {
      try { $persistentStore.write(vals[k], k); } catch (e) {}
      changed = true;
      saved.push(k);
    }
  }
  if (changed) {
    try { $notification.post("✅ " + title + " 签到数据获取成功", "", saved.join(", ") + " 已保存"); } catch (e) {}
  }
  $done({});
})();
