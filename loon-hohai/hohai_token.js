// HoHai Token 抓取：两种方式互为补充，只存到账号1（hohai_token）
// ① http-response（登录/刷新接口）：从 /api/auth/login、/api/auth/refresh-token 的响应 JSON 里取 token
//    （响应形如 {"token":"...","user":{...}}，也兼容不带包装的 {"data":{"token":"..."}}）
// ② http-request（站内接口）：从 /api/* 请求的 Authorization: Bearer <token> 头里保存 token
// Token 没变时不重复通知
const TOKEN_KEY = "hohai_token";

function saveToken(token) {
  var t = String(token || "").trim();
  if (!t) return;
  if (t.toLowerCase().indexOf("bearer ") === 0) t = t.slice(7).trim();
  if (!t) return;
  if (($persistentStore.read(TOKEN_KEY) || "") === t) return;
  $persistentStore.write(t, TOKEN_KEY);
  var name = ($persistentStore.read("hohai_name") || "").trim();
  var label = name || "账号1";
  $notification.post("HoHai签到", "Token 获取成功", "已保存到" + label + "，明天自动签到");
}

function parseBody(data) {
  try { return JSON.parse(data); } catch (e) { return null; }
}

function main() {
  // http-response：$response.body 是登录/刷新接口的响应
  if (typeof $response !== "undefined" && $response && $response.body) {
    var body = parseBody($response.body);
    if (body) {
      var token = "";
      if (body.token) token = String(body.token);
      else if (body.data && body.data.token) token = String(body.data.token);
      if (token) saveToken(token);
    }
    $done({});
    return;
  }
  // http-request：从 Authorization 头取 Bearer <token>
  var headers = (typeof $request !== "undefined" && $request && $request.headers) || {};
  var auth = headers["Authorization"] || headers["authorization"] || "";
  if (!auth) { $done({}); return; }
  saveToken(auth);
  $done({});
}
main();
