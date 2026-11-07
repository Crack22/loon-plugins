// xxyx_capture.js — 晓晓优选每日任务：xx-token 请求头 + /my 响应里的用户信息（許諾签到合集）
// http-response script-response-body ^https://xxyx-client-api.xiaoxiaoyouxuan.com/my
(function () {
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var token = getHeader($request.headers, "xx-token");
  var data = null;
  try { data = (JSON.parse(($response && $response.body) || "{}") || {}).data; } catch (e) {}
  if (!token || !data) { $done({}); return; }
  var key = "fmz200_xxyx_token";
  var list = [];
  try { list = JSON.parse($persistentStore.read(key) || "[]") || []; } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  var entry = { mobile: data.mobile || "", username: data.nick || "", token: token, avatar: data.avatar || "" };
  var idx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].mobile && list[i].mobile === entry.mobile) { idx = i; break; }
  }
  if (idx >= 0) { list[idx] = entry; } else { list.push(entry); }
  var val = JSON.stringify(list);
  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === val) { $done({}); return; }
  try { $persistentStore.write(val, key); } catch (e) {}
  try { $notification.post("✅ 晓晓优选每日任务 token 获取成功", entry.username ? "账号：" + entry.username : "", key + " 已保存"); } catch (e) {}
  $done({});
})();
