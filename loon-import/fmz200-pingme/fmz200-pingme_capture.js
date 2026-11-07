// fmz200-pingme_capture.js — PingMe 签到参数抓取（許諾签到合集）
// 签到脚本把抓到的内容当 JSON 读（{url, paramsRaw, headers}），
// 通用 fmz_checkin_capture.js 只存单个头字段，存不了这份 JSON，
// 所以用这个专用脚本：把请求 URL、原始查询参数和请求头原样存成 JSON。
// 触发：^https://api.pingmeapp.net/app/queryBalanceAndBonus
// 存到 pingme_capture_v3；只在内容变化时保存并通知一次
(function () {
  function parseRawQuery(url) {
    var query = (url.split("?")[1] || "").split("#")[0];
    var rawMap = {};
    query.split("&").forEach(function (pair) {
      if (!pair) return;
      var idx = pair.indexOf("=");
      if (idx < 0) return;
      rawMap[pair.slice(0, idx)] = pair.slice(idx + 1);
    });
    return rawMap;
  }

  var key = "pingme_capture_v3";
  var title = "PingMe每日签到";
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var url = $request.url || "";
  if (url.indexOf("/app/queryBalanceAndBonus") < 0) { $done({}); return; }

  var value = "";
  try {
    value = JSON.stringify({
      url: url,
      paramsRaw: parseRawQuery(url),
      headers: $request.headers || {}
    });
  } catch (e) { $done({}); return; }
  if (!value) { $done({}); return; }

  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === value) { $done({}); return; }
  try { $persistentStore.write(value, key); } catch (e) {}
  try { $notification.post("✅ " + title + " 参数获取成功", "", key + " 已保存"); } catch (e) {}
  $done({});
})();
