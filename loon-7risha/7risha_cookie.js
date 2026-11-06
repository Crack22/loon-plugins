// 7risha Cookie 抓取：打开签到页时捕获 Cookie 存入本地
const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
if (cookie && cookie.indexOf('wordpress_logged_in_') !== -1) {
  $persistentStore.write(cookie, 'risha_cookie');
  $notification.post('7risha Cookie 获取成功', '', '已保存登录态，cron 每天 08:30 自动签到');
} else {
  $notification.post('7risha Cookie 获取失败', '', '请先登录七日杀中文网账号再打开签到页');
}
$done({});
