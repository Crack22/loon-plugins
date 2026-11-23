// Thxnk Cookie 抓取：打开本站时，从 /api/v1/* 请求的 Cookie 头里保存完整 Cookie
// 会话靠 Cookie，只存到账号1（thxnk_cookie），多账号在 BoxJs 里粘贴 Cookie；Cookie 没变时不重复通知
const KEY = "thxnk_cookie";

function main() {
  var headers = ($request && $request.headers) || {};
  var cookie = headers["Cookie"] || headers["cookie"] || "";
  if (!cookie) { $done({}); return; }
  if (cookie.indexOf("=") === -1) { $done({}); return; }
  var old = $persistentStore.read(KEY) || "";
  if (old === cookie) { $done({}); return; }
  $persistentStore.write(cookie, KEY);
  var name = ($persistentStore.read("thxnk_name") || "").trim();
  var label = name || "账号1";
  $notification.post("Thxnk签到", "Cookie 获取成功", "已保存到" + label + "，明天自动签到");
  $done({});
}
main();
