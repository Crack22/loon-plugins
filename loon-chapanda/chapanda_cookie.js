// ChaPanda Token 抓取：打开门户时，从 /api/auth/me* 请求里保存 x-admin-token 请求头
// 只存到账号1（chapanda_token），多账号在 BoxJs 里粘贴；没变时不重复通知
const TOKEN_KEY = "chapanda_token";

function main() {
  var url = ($request && $request.url) || "";
  var headers = ($request && $request.headers) || {};
  var token = headers["x-admin-token"] || headers["X-Admin-Token"] || "";
  if (!token || !String(token).trim()) { $done({}); return; }
  token = String(token).trim();
  var oldToken = $persistentStore.read(TOKEN_KEY) || "";
  if (oldToken === token) { $done({}); return; }
  $persistentStore.write(token, TOKEN_KEY);
  var name = ($persistentStore.read("chapanda_name") || "").trim();
  var label = name || "账号1";
  $notification.post("ChaPanda签到", "Token 获取成功", "已获取 ChaPanda Token，已保存到" + label + "，明天自动签到");
  $done({});
}
main();
