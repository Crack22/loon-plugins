// sliverkiss-zmhy_capture.js — 中免会员 x-access-token 抓取（許諾签到合集）
// 签到脚本读请求头 x-access-token，通用抓取脚本只支持 Cookie / Authorization /
// URL 参数，存不了这个头，所以用这个专用脚本。
// 触发：中免会员小程序「我的」→「积分明细」的 paymentList 请求
// 存到 zmhy_data；只在值变化时保存并通知一次
(function () {
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }

  var key = "zmhy_data";
  var title = "中免会员每日签到";
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }

  var value = (getHeader($request.headers, "x-access-token") || "").trim();
  if (!value) { $done({}); return; }

  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === value) { $done({}); return; }
  try { $persistentStore.write(value, key); } catch (e) {}
  try { $notification.post("✅ " + title + " Cookie 获取成功", "", key + " 已保存"); } catch (e) {}
  $done({});
})();
