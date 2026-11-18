// 法拉利 Token 抓取：打开本站时，从 /api/v1/user/* 请求的 Authorization 头里保存 Token
// 这个 Token 就是登录后用的 auth_data，请求头里直接放原值，没有 Bearer 前缀
// 只存到账号1（falali_token），多账号在 BoxJs 里粘贴 Token；Token 没变时不重复通知
const KEY = "falali_token";

function main() {
  var headers = ($request && $request.headers) || {};
  var auth = headers["Authorization"] || headers["authorization"] || "";
  if (!auth) { $done({}); return; }
  var token = String(auth).trim();
  if (token.toLowerCase().indexOf("bearer ") === 0) token = token.slice(7).trim();
  if (!token) { $done({}); return; }
  var old = $persistentStore.read(KEY) || "";
  if (old === token) { $done({}); return; }
  $persistentStore.write(token, KEY);
  $notification.post("法拉利签到", "Token 获取成功", "已保存到账号1，明天自动签到");
  $done({});
}
main();
