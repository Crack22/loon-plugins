// 网易云音乐 Cookie 抓取：打开网易云音乐 App 停 1 秒，保存 Cookie
// 触发请求：POST interface3.music.163.com/xeapi/nuser/account/get（App 启动就会调，请求头带完整 Cookie）
// 保存键：netease_cookie；只在变化时通知
// Cookie 里关键是 MUSIC_U 和 __csrf，签到只用这两个；其他项一起存着不影响
var KEY = "netease_cookie";
var h = $request.headers || {};
var cookie = (h["Cookie"] || h["cookie"] || "").trim();
if (!cookie || cookie.indexOf("MUSIC_U=") === -1) {
  $done({});
} else {
  var old = $persistentStore.read(KEY) || "";
  if (old !== cookie) {
    $persistentStore.write(cookie, KEY);
    $notification.post("网易云 Cookie 获取成功", "", "已保存，自动签到可用。");
  }
  $done({});
}
