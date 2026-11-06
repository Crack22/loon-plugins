// 蜗牛 Cookie 抓取：打开签到页时捕获 Cookie 存入本地
const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
if (cookie && cookie.indexOf('user_check=') !== -1) {
  $persistentStore.write(cookie, 'woniu_cookie');
  $notification.post('蜗牛 Cookie 获取成功', '', '已保存登录态，cron 每天 09:00 自动签到');
} else {
  $notification.post('蜗牛 Cookie 获取失败', '', '请先登录蜗牛账号再打开签到页');
}
$done({});
