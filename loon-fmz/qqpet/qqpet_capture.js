// qqpet_capture.js — QQ 萌宠 Token 抓取（許諾签到合集）
// http-response 脚本：匹配 qqpet.jwetech.com/api/authorizations 的授权响应，
// 从响应体 JSON 的 id / token 字段保存 lkQQPetId 与 lkQQPetToken（"Bearer " + token）
// 注意：Token 有效期不足半天，需经常打开 QQ 萌宠重新抓取
(function () {
  var title = "QQ萌宠";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (typeof $response === "undefined" || !$response || !$response.body) { $done({}); return; }
  var obj = null;
  try { obj = JSON.parse($response.body); } catch (e) {}
  if (!obj || !obj.token || obj.id === undefined || obj.id === null) { $done({}); return; }
  var token = "Bearer " + obj.token;
  var id = String(obj.id);
  var changed = false;
  var oldToken = "";
  try { oldToken = $persistentStore.read("lkQQPetToken") || ""; } catch (e) {}
  if (oldToken !== token) {
    try { $persistentStore.write(token, "lkQQPetToken"); } catch (e) {}
    changed = true;
  }
  var oldId = "";
  try { oldId = $persistentStore.read("lkQQPetId") || ""; } catch (e) {}
  if (oldId !== id) {
    try { $persistentStore.write(id, "lkQQPetId"); } catch (e) {}
    changed = true;
  }
  if (changed) {
    try { $notification.post("✅ " + title + " Token 获取成功", "", "lkQQPetToken、lkQQPetId 已保存"); } catch (e) {}
  }
  $done({});
})();
