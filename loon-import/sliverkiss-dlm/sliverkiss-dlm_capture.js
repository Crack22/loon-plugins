// sliverkiss-dlm_capture.js — 达美乐披萨游戏数据抓取（許諾签到合集）
// 签到脚本的抓取逻辑：从 gameDone 请求体里取 openid，从 URL 里取游戏名，
// 把 {userId: openid, token: 请求体原文, userName: openid} 合并进 dlm_data 数组
// （按 userId 去重），再把游戏名存到 dlm_game。
// 通用抓取脚本只存单个头字段，做不了这套逻辑，所以用这个专用脚本。
// 触发：^https://game.dominos.com.cn/.+/game/gameDone（requires-body=true）
(function () {
  var title = "达美乐披萨每日签到";
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var url = $request.url || "";
  var m = url.match(/^https:\/\/game\.dominos\.com\.cn\/(.+)\/game\/gameDone/);
  var body = $request.body || "";
  if (!m || !body) { $done({}); return; }

  var openid = "";
  try {
    var parsed = JSON.parse(body);
    openid = (parsed && parsed.openid) || "";
  } catch (e) { $done({}); return; }
  if (!openid) { $done({}); return; }

  var game = m[1];
  var entry = { userId: openid, token: body, userName: openid };
  var arr = [];
  try {
    var old = $persistentStore.read("dlm_data") || "";
    arr = old ? JSON.parse(old) : [];
    if (!Array.isArray(arr)) arr = [];
  } catch (e) { arr = []; }
  var idx = -1;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] && arr[i].userId === openid) { idx = i; break; }
  }
  if (idx >= 0) arr[idx] = entry; else arr.push(entry);
  try { $persistentStore.write(JSON.stringify(arr), "dlm_data"); } catch (e) {}
  try { $persistentStore.write(game, "dlm_game"); } catch (e) {}
  try { $notification.post("✅ " + title + " Cookie 获取成功", "", "dlm_data 已保存"); } catch (e) {}
  $done({});
})();
