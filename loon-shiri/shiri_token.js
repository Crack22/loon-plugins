// 识日 Token 抓取：打开识日 App 任意页停 1 秒，保存 token 请求头
// 触发请求：GET shiri.jingqueyun.com/MobileHome/getHomeData 等，请求头带 token
// 保存键：shiri_token；只在变化时通知
var KEY = "shiri_token";
var h = $request.headers || {};
var token = (h["token"] || h["Token"] || "").trim();
if (!token) {
  $done({});
} else {
  var old = $persistentStore.read(KEY) || "";
  if (old !== token) {
    $persistentStore.write(token, KEY);
    $notification.post("识日 Token 获取成功", "", "已保存，自动签到可用。");
  }
  $done({});
}
