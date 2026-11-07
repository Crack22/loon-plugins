// bilibili-manga_capture.js — 哔哩哔哩漫画：保存 SESSDATA 与 access_key（許諾签到合集）
// http-request ^https://app.bilibili.com/x/v2/account/myinfo
(function () {
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }
  var headers = {};
  for (var k in ($request.headers || {})) { headers[k.toLowerCase()] = $request.headers[k]; }
  var uid = headers["x-bili-mid"] || "";
  var cookie = headers["cookie"] || "";
  var sess = "";
  if (cookie) {
    var sm = cookie.match(/(SESSDATA=[a-zA-Z0-9%_-]+)/);
    if (sm) sess = sm[1];
  }
  var ak = "";
  var am = ($request.url || "").match(/access_key=([a-zA-Z0-9_-]+)/);
  if (am) ak = am[1];
  if (!uid || (!sess && !ak)) { $done({}); return; }
  var key = "BILI_COMICS_CHECKIN";
  var data = {};
  try { data = JSON.parse($persistentStore.read(key) || "{}") || {}; } catch (e) { data = {}; }
  if (!data.account) data.account = {};
  var prev = data.account[uid] || {};
  var next = {};
  for (var p in prev) next[p] = prev[p];
  if (sess) next.cookie = sess;
  if (ak) next.access_key = ak;
  data.account[uid] = next;
  var val = JSON.stringify(data);
  var old = "";
  try { old = $persistentStore.read(key) || ""; } catch (e) {}
  if (old === val) { $done({}); return; }
  try { $persistentStore.write(val, key); } catch (e) {}
  try { $notification.post("✅ 哔哩哔哩漫画 鉴权获取成功", "账号：" + uid, key + " 已保存"); } catch (e) {}
  $done({});
})();
