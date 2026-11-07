// chery_capture.js — 奇瑞汽车App签到：URL 里的 access_token + 响应里的账号信息（許諾签到合集）
// http-response script-response-body ^https://mobile-consumer-sapp.chery.cn/.*web/user/current/details?
(function () {
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var m = ($request.url || "").match(/access_token=([^&]*)/);
  var accessToken = m ? decodeURIComponent(m[1]) : "";
  var data = null;
  try { data = (JSON.parse(($response && $response.body) || "{}") || {}).data; } catch (e) {}
  if (!accessToken || !data || !data.accountId) { $done({}); return; }
  var key = "fmz200_chery_account";
  var list = [];
  try { list = JSON.parse($persistentStore.read(key) || "[]") || []; } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  var entry = { accountId: data.accountId, access_token: accessToken, displayName: data.displayName || "", avatarUrl: data.avatarUrl || "" };
  var idx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].accountId === entry.accountId) { idx = i; break; }
  }
  if (idx >= 0) { list[idx] = entry; } else { list.push(entry); }
  var val = JSON.stringify(list);
  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === val) { $done({}); return; }
  try { $persistentStore.write(val, key); } catch (e) {}
  try { $notification.post("✅ 奇瑞汽车App签到 token 获取成功", entry.displayName ? "账号：" + entry.displayName : "", key + " 已保存"); } catch (e) {}
  $done({});
})();
