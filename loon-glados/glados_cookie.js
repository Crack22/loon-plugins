// GLaDOS Cookie 抓取：打开 console/account 时捕获 Cookie 和 UA 存入本地
// 注意：GLaDOS 会校验抓包时的设备，签到时必须用同一个 UA，所以 UA 和 Cookie 一起保存
const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
const ua = $request.headers['User-Agent'] || $request.headers['user-agent'];
if (cookie && cookie.indexOf('gld:sess=') !== -1 && cookie.indexOf('gld:sess.sig=') !== -1) {
  const old = $persistentStore.read('glados_cookie') || '';
  if (old !== cookie) {
    $persistentStore.write(cookie, 'glados_cookie');
    if (ua) $persistentStore.write(ua, 'glados_ua');
    $notification.post('GLaDOS Cookie 获取成功', '', '已保存登录态，cron 每天 09:00 自动签到');
  }
} else {
  $notification.post('GLaDOS Cookie 获取失败', '', '请先登录 GLaDOS 账号再打开 console/account');
}
$done({});
