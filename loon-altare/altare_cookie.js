// Altare Cookie 抓取：打开每日奖励页时，从 /api/tenants/<id>/rewards* 请求里保存 Cookie、Authorization 和 Tenant ID
// 只存到账号1（altare_cookie / altare_auth / altare_tenant），多账号在 BoxJs 里粘贴；没变时不重复通知
const COOKIE_KEY = "altare_cookie";
const AUTH_KEY = "altare_auth";
const TENANT_KEY = "altare_tenant";

function main() {
  var url = ($request && $request.url) || "";
  var headers = ($request && $request.headers) || {};
  var cookie = headers["Cookie"] || headers["cookie"] || "";
  var auth = headers["Authorization"] || headers["authorization"] || "";
  var m = String(url).match(/\/api\/tenants\/([^\/\?]+)\/rewards/);
  var tenant = m ? m[1] : "";
  if (!cookie || String(cookie).indexOf("altare_session=") === -1) { $done({}); return; }
  cookie = String(cookie).trim();
  auth = String(auth || "").trim();
  var oldCookie = $persistentStore.read(COOKIE_KEY) || "";
  var oldAuth = $persistentStore.read(AUTH_KEY) || "";
  var oldTenant = $persistentStore.read(TENANT_KEY) || "";
  if (oldCookie === cookie && oldAuth === auth && oldTenant === tenant) { $done({}); return; }
  $persistentStore.write(cookie, COOKIE_KEY);
  if (auth) $persistentStore.write(auth, AUTH_KEY);
  if (tenant) $persistentStore.write(tenant, TENANT_KEY);
  var name = ($persistentStore.read("altare_name") || "").trim();
  var label = name || "账号1";
  $notification.post("Altare签到", "Cookie 获取成功", "已保存到" + label + "，明天自动签到");
  $done({});
}
main();
