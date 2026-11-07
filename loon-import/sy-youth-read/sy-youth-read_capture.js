// sy-youth-read_capture.js — 中青看点文章请求体抓取（許諾签到合集）
// 签到脚本读 zqgetbody_body，里面是阅读文章的请求体，多个用 & 分隔。
// 通用抓取脚本只存请求头 / URL 参数，存不了请求体，所以用这个专用脚本：
// 把新抓到的请求体追加进去（已有的跳过）。
// 触发：^https://ios.baertt.com/v5/article/complete.json（requires-body=true）
(function () {
  var key = "zqgetbody_body";
  var title = "中青自动阅读每日签到";
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var body = ($request.body || "").trim();
  if (!body) { $done({}); return; }

  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  var list = old ? old.split("&") : [];
  for (var i = 0; i < list.length; i++) {
    if (list[i] === body) { $done({}); return; }
  }
  list.push(body);
  try { $persistentStore.write(list.join("&"), key); } catch (e) {}
  try { $notification.post("✅ " + title + " 请求体获取成功", "", "已保存 " + list.length + " 条请求体"); } catch (e) {}
  $done({});
})();
