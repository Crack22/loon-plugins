// 宸宇 Cookie 自动抓取
// 打开 https://vip.dylan.xin/ 即可自动保存完整 Cookie，无需手动粘贴
const NAME = "宸宇";
const KEY = "dylan_cookie";

const cookie = ($request.headers["Cookie"] || $request.headers["cookie"] || "");
if (cookie && cookie.indexOf("sid=") !== -1) {
  const old = $persistentStore.read(KEY);
  if (old !== cookie) {
    $persistentStore.write(cookie, KEY);
    $notification.post(NAME + " Cookie 获取成功", "", "Cookie 已保存，签到插件每天 09:00 自动生效");
  }
}
$done({});
