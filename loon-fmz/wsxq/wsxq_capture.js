// wsxq_capture.js — 微商星球每日签到专用抓取（許諾签到合集）
// 签到脚本需多值（URL + 请求头 + 请求体），通用 Cookie 抓取无法覆盖，故专用抓取。
// 只在值变化时保存并通知一次
(function () {
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  var title = "微商星球每日签到";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var url = $request.url || "";
  var changed = [];
  function save(key, value) {
    value = (value || "").trim();
    if (!value) return;
    var old = "";
    try { old = $persistentStore.read(key) || ""; } catch (e) {}
    if (old === value) return;
    try { $persistentStore.write(value, key); changed.push(key); } catch (e) {}
  }
  if (url.indexOf("taskweidou?do=daily_sign&") >= 0) {
    save("wsxqurlname", url);
    save("wsxqhdname", JSON.stringify($request.headers || {}));
  } else if (url.indexOf("taskweidou?do=reward_weidou&task_id=2&") >= 0) {
    save("wsxqspurlname", url);
  } else if (url.indexOf("taskweidou?do=reward_weidou&task_id=3&") >= 0) {
    save("wsxqdturlname", url);
  } else if (url.indexOf("&task_id=4&") >= 0) {
    save("wsxqkkurlname", url);
  } else if (url.indexOf("taskweidou?do=reward_weidou&task_id=5&") >= 0) {
    save("wsxqppurlname", url);
  } else if (url.indexOf("taskweidou?do=reward_weidou&task_id=6&") >= 0) {
    save("wsxqssurlname", url);
  } else if (url.indexOf("v1/user/weidou?") >= 0) {
    save("wsxqwdurlname", url);
  }
  if (changed.length) {
    try { $notification.post("✅ " + title + " Cookie 获取成功", "", changed.join("、") + " 已保存"); } catch (e) {}
  }
  $done({});
})();
