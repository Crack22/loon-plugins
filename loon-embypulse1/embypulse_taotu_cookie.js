// 乐蛙 Cookie 自动抓取
// 打开 https://ue2.taotu.ink/ 即可自动保存 session_id，无需手动粘贴
const NAME = "乐蛙";
const KEY = "embypulse1_session_id";

const cookie = ($request.headers["Cookie"] || $request.headers["cookie"] || "");
const m = cookie.match(/(?:^|;\s*)session_id=([^;]+)/);
if (m && m[1]) {
  const sid = m[1].trim();
  const old = $persistentStore.read(KEY);
  if (old !== sid) {
    $persistentStore.write(sid, KEY);
    $notification.post(NAME + " Cookie 获取成功", "", "session_id 已保存，签到插件每天 09:00 自动生效");
  }
}
$done({});
