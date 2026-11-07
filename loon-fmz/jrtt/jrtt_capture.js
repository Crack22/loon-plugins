// jrtt_capture.js — 今日头条极速版 Cookie 抓取（許諾签到合集）
// 两条抓取规则共用本脚本，按请求路径区分保存：
//   is.snssdk.com/score_task/v1/task/sign_in        → jrttTaskCookie（签到）
//   is.snssdk.com/score_task/v1/task/get_read_bonus → jrttReadCookie（阅读）
//   i.snssdk.com/ttgame/game_farm/home_info        → jrttFarmCookie（农场）
// 值均为 JSON：{qs: 查询字符串, headers: {User-Agent, x-Tt-Token / Cookie, Referer}}
(function () {
  var title = "今日头条极速版";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  if (!$request || !$request.url) { $done({}); return; }
  var url = $request.url;
  var qIndex = url.indexOf("?");
  var qs = qIndex === -1 ? "" : url.substring(qIndex + 1);
  var headers = {};
  if ($request.headers) {
    if ($request.headers["User-Agent"]) headers["User-Agent"] = $request.headers["User-Agent"];
    if ($request.headers["user-agent"]) headers["User-Agent"] = $request.headers["user-agent"];
  }
  var key = "";
  var category = "";
  if (url.indexOf("/score_task/v1/task/sign_in") !== -1) {
    key = "jrttTaskCookie";
    category = "签到";
    if ($request.headers["x-Tt-Token"]) headers["x-Tt-Token"] = $request.headers["x-Tt-Token"];
  } else if (url.indexOf("/score_task/v1/task/get_read_bonus") !== -1) {
    key = "jrttReadCookie";
    category = "阅读";
    if ($request.headers["x-Tt-Token"]) headers["x-Tt-Token"] = $request.headers["x-Tt-Token"];
  } else if (url.indexOf("/ttgame/game_farm/home_info") !== -1) {
    key = "jrttFarmCookie";
    category = "农场";
    if ($request.headers["Cookie"]) headers["Cookie"] = $request.headers["Cookie"];
    if ($request.headers["cookie"]) headers["Cookie"] = $request.headers["cookie"];
    if ($request.headers["Referer"]) headers["Referer"] = $request.headers["Referer"];
    if ($request.headers["referer"]) headers["Referer"] = $request.headers["referer"];
  } else {
    $done({});
    return;
  }
  var val = JSON.stringify({ qs: qs, headers: headers });
  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === val) { $done({}); return; }
  try { $persistentStore.write(val, key); } catch (e) {}
  try { $notification.post("✅ " + title + category + " Cookie 获取成功", "", key + " 已保存"); } catch (e) {}
  $done({});
})();
