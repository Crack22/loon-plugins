// noteyoudao_capture.js — 有道云笔记签到会话抓取（許諾签到合集）
// 匹配 note.youdao.com/yws/mapi/user?method=checkin 的签到请求，
// 保存完整请求 URL / Body / Headers 到 chavy_signurl_noteyoudao、
// chavy_signbody_noteyoudao、chavy_signheaders_noteyoudao
(function () {
  var title = "有道云笔记";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || !$request.url || !$request.body || !$request.headers) { $done({}); return; }
  var vals = {
    chavy_signurl_noteyoudao: $request.url,
    chavy_signbody_noteyoudao: $request.body,
    chavy_signheaders_noteyoudao: JSON.stringify($request.headers)
  };
  var changed = false;
  for (var k in vals) {
    var old = "";
    try { old = $persistentStore.read(k) || ""; } catch (e) {}
    if (old !== vals[k]) {
      try { $persistentStore.write(vals[k], k); } catch (e) {}
      changed = true;
    }
  }
  if (changed) {
    try { $notification.post("✅ " + title + " 会话获取成功", "", "签到 URL、Body、Headers 已保存"); } catch (e) {}
  }
  $done({});
})();
