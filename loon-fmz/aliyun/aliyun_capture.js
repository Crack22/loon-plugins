// aliyun_capture.js — 阿里云盘签到：抓取 refresh_token（許諾签到合集）
// http-request script-request-body ^https://(auth|aliyundrive).alipan.com/v2/account/token
// 请求体 JSON 含 refresh_token；用它换一次用户信息（昵称/device_id），按上游 aliyun_data 格式存入 JSON 数组
(function () {
  var key = "aliyun_data";
  function save(list, nick) {
    var old = "";
    try { old = $persistentStore.read(key) || ""; } catch (e) {}
    var val = JSON.stringify(list);
    if (old === val) { $done({}); return; }
    try { $persistentStore.write(val, key); } catch (e) {}
    try { $notification.post("✅ 阿里云盘签到 token 获取成功", nick ? "账号：" + nick : "", key + " 已保存"); } catch (e) {}
    $done({});
  }
  function upsert(nick, deviceId, rt) {
    var list = [];
    try { list = JSON.parse($persistentStore.read(key) || "[]") || []; } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    var found = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].refresh_token === rt) { found = list[i]; break; }
    }
    if (found) {
      found.refresh_token = rt;
      if (nick) found.name = nick;
      if (deviceId) found.device_id = deviceId;
    } else {
      list.push({ name: nick || "", refresh_token: rt, device_id: deviceId || "" });
    }
    save(list, nick);
  }
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var body = {};
  try { body = JSON.parse($request.body || "{}"); } catch (e) {}
  var rt = body.refresh_token || "";
  if (!rt) { $done({}); return; }
  try {
    $httpClient.post({
      url: "https://auth.aliyundrive.com/v2/account/token",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt, grant_type: "refresh_token" })
    }, function (err, resp, data) {
      var nick = "", deviceId = "";
      try { var j = JSON.parse(data || "{}"); nick = j.nick_name || ""; deviceId = j.device_id || ""; } catch (e) {}
      upsert(nick, deviceId, rt);
    });
  } catch (e) { upsert("", "", rt); }
})();
