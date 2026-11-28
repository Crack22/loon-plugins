// 蜗牛emby Cookie 抓取：打开网站时，从 wn4k.ykvip.net 请求的 Cookie 头里保存 session_id
// 只存到账号1（wn4k_cookie），多账号在 BoxJs 里粘贴；没变时不重复通知；只保存 session_id 这一项
const COOKIE_KEY = "wn4k_cookie";

function main() {
  var url = ($request && $request.url) || "";
  var headers = ($request && $request.headers) || {};
  var cookie = headers["Cookie"] || headers["cookie"] || "";
  if (!cookie) { $done({}); return; }
  var m = String(cookie).match(/session_id=([^;\s]+)/);
  if (!m || !m[1]) { $done({}); return; }
  var value = "session_id=" + m[1];
  var oldCookie = $persistentStore.read(COOKIE_KEY) || "";
  if (oldCookie === value) { $done({}); return; }
  $persistentStore.write(value, COOKIE_KEY);
  var name = ($persistentStore.read("wn4k_name") || "").trim();
  var label = name || "账号1";
  $notification.post("蜗牛emby签到", "Cookie 获取成功", "已获取蜗牛emby Cookie，已保存到" + label + "，明天自动签到");
  $done({});
}
main();
