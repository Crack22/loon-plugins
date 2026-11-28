// 胖乖商城 Cookie 抓取：打开签到页时，从 /wscump/checkin/ 下的请求里保存完整 Cookie
// 只存到账号1（pangguai_cookie），多账号在 BoxJs 里粘贴；没变时不重复通知；只保存含 KDTSESSIONID 的 Cookie
const COOKIE_KEY = "pangguai_cookie";

function main() {
  var url = ($request && $request.url) || "";
  var headers = ($request && $request.headers) || {};
  var cookie = headers["Cookie"] || headers["cookie"] || "";
  if (!cookie || String(cookie).indexOf("KDTSESSIONID=") === -1) { $done({}); return; }
  cookie = String(cookie).trim();
  var oldCookie = $persistentStore.read(COOKIE_KEY) || "";
  if (oldCookie === cookie) { $done({}); return; }
  $persistentStore.write(cookie, COOKIE_KEY);
  var name = ($persistentStore.read("pangguai_name") || "").trim();
  var label = name || "账号1";
  $notification.post("胖乖商城签到", "Cookie 获取成功", "已获取胖乖商城 Cookie，已保存到" + label + "，明天自动签到");
  $done({});
}
main();
