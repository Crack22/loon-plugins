// sliverkiss-mxbc_capture.js — 蜜雪冰城 Access-Token 抓取（許諾签到合集）
// 签到脚本的抓取逻辑是 http-response：从请求头取 access-token，
// 从响应体取 data.mobilePhone，拼成 {userId, token, userName} 后按手机号
// 合并进 mxbc_data 数组（JSON）。通用抓取脚本只读请求头，做不了这套逻辑，
// 所以用这个专用脚本。
// 触发（http-response）：^https://mxsa.mxbc.net/api/v1/customer/info
(function () {
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }

  var key = "mxbc_data";
  var title = "蜜雪冰城每日签到";
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  if (typeof $response === "undefined" || !$response || !$response.body) { $done({}); return; }

  var token = (getHeader($request.headers, "access-token") || "").trim();
  var phone = "";
  try {
    var body = JSON.parse($response.body);
    phone = (body && body.data && body.data.mobilePhone) || "";
  } catch (e) { $done({}); return; }
  if (!token || !phone) { $done({}); return; }

  var entry = { userId: phone, token: token, userName: phone };
  var arr = [];
  try {
    var old = $persistentStore.read(key) || "";
    arr = old ? JSON.parse(old) : [];
    if (!Array.isArray(arr)) arr = [];
  } catch (e) { arr = []; }
  var idx = -1;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] && arr[i].userId === phone) { idx = i; break; }
  }
  if (idx >= 0) arr[idx] = entry; else arr.push(entry);
  try { $persistentStore.write(JSON.stringify(arr), key); } catch (e) {}
  try { $notification.post("✅ " + title + " Token 获取成功", "", phone + " 已保存"); } catch (e) {}
  $done({});
})();
