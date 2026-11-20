// 星驰 Token 抓取：两种方式互为补充，只存到账号1
// ① http-response（登录/刷新接口）：从 /api/v1/auth/login、/api/v1/auth/refresh、
//    /api/v1/auth/oauth/pending/exchange 的响应 JSON 里取 access_token 和 refresh_token
//    （响应形如 {"code":0,"data":{"access_token":"...","refresh_token":"...","expires_in":...}}，
//    也兼容不带 data 包装的 {"access_token":"...","refresh_token":"..."}）
// ② http-request（站内接口）：从 /api/v1/user/* 请求的 Authorization: Bearer <token> 头里保存 access_token
// Token 没变时不重复通知
const ACCESS_KEY = "xingchi_access_token";
const REFRESH_KEY = "xingchi_refresh_token";

function saveTokens(access, refresh) {
  var changed = false;
  if (access) {
    var a = String(access).trim();
    if (a && ($persistentStore.read(ACCESS_KEY) || "") !== a) {
      $persistentStore.write(a, ACCESS_KEY);
      changed = true;
    }
  }
  if (refresh) {
    var t = String(refresh).trim();
    if (t && ($persistentStore.read(REFRESH_KEY) || "") !== t) {
      $persistentStore.write(t, REFRESH_KEY);
      changed = true;
    }
  }
  if (changed) {
    var name = ($persistentStore.read("xingchi_name") || "").trim();
    var label = name || "账号1";
    $notification.post("星驰签到", "Token 获取成功", "已保存到" + label + "，明天自动签到");
  }
}

function parseBody(data) {
  try { return JSON.parse(data); } catch (e) { return null; }
}

function main() {
  // http-response：$response.body 是登录/刷新接口的响应
  if (typeof $response !== "undefined" && $response && $response.body) {
    var body = parseBody($response.body);
    if (body) {
      var data = (body.code === 0 && body.data) ? body.data : body;
      if (data && (data.access_token || data.refresh_token)) {
        saveTokens(data.access_token || "", data.refresh_token || "");
      }
    }
    $done({});
    return;
  }
  // http-request：从 Authorization 头取 Bearer token
  var headers = (typeof $request !== "undefined" && $request && $request.headers) || {};
  var auth = headers["Authorization"] || headers["authorization"] || "";
  if (!auth) { $done({}); return; }
  var token = String(auth).trim();
  if (token.toLowerCase().indexOf("bearer ") === 0) token = token.slice(7).trim();
  if (!token) { $done({}); return; }
  saveTokens(token, "");
  $done({});
}
main();
