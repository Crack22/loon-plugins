// 七日杀中文网每日签到 cron：POST /wp-content/themes/LightSNS/module/action/sign.php，sign=1
// 实测：无需 ticket/randstr（前端腾讯验证码后端不校验），成功 code=1，已签到 code=2，失败 code=0
const cookie = $persistentStore.read('risha_cookie');
if (!cookie) {
  $notification.post('7risha签到失败', '', '未获取到 Cookie，请先打开签到页抓取');
  $done();
} else {
  $httpClient.post({
    url: 'https://www.7risha.com/wp-content/themes/LightSNS/module/action/sign.php',
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Referer': 'https://www.7risha.com/sign',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'sign=1'
  }, function (error, response, data) {
    if (error) {
      $notification.post('7risha签到失败', '', '网络异常，请稍后重试');
      $done();
      return;
    }
    try {
      const r = JSON.parse(data);
      if (r.code === 1) {
        $notification.post('7risha签到成功', '', (r.msg || '签到成功') + '，累计签到 ' + (r.sign_c || '') + ' 天');
      } else if (r.code === 2) {
        $notification.post('7risha今日已签到', '', (r.msg || '今日已签到') + '，累计签到 ' + (r.sign_c || '') + ' 天');
      } else if (r.code === 8) {
        $notification.post('7risha签到失败', '', '需先绑定手机号');
      } else if (r.code === 9) {
        $notification.post('7risha签到失败', '', '需先绑定邮箱');
      } else {
        $notification.post('7risha签到失败', '', (r.msg || '签到失败') + '，请重新抓取 Cookie');
      }
    } catch (e) {
      $notification.post('7risha签到失败', '', '返回异常，请检查登录态');
    }
    $done();
  });
}
