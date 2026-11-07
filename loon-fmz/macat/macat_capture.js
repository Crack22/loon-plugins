// macat_capture.js — 马克喵签到：保存登录请求体（許諾签到合集）
// http-request script-request-body ^https://www.macat.vip/wp-admin/admin-ajax.php
// 登录请求体格式：action=user_login&username=邮箱&password=密码&rememberme=1
(function () {
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var body = $request.body || "";
  if (body.indexOf("action=user_login") < 0) { $done({}); return; }
  var key = "fmz200.macat_loginBody";
  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === body) { $done({}); return; }
  try { $persistentStore.write(body, key); } catch (e) {}
  try { $notification.post("✅ 马克喵签到 登录数据获取成功", "", key + " 已保存"); } catch (e) {}
  $done({});
})();
