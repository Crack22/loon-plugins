// 蜗牛每日签到 cron：POST /user/checkin.html，成功 code=1（info.points 积分），已签到 code=1001
const cookie = $persistentStore.read('woniu_cookie');
if (!cookie) {
  $notification.post('蜗牛签到失败', '', '未获取到 Cookie，请先打开蜗牛签到页抓取');
  $done();
} else {
  $httpClient.post({
    url: 'https://www.wn4k.com/user/checkin.html',
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Referer': 'https://www.wn4k.com/user/checkin.html',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: ''
  }, function (error, response, data) {
    if (error) {
      $notification.post('蜗牛签到失败', '', '网络异常，请稍后重试');
      $done();
      return;
    }
    try {
      const r = JSON.parse(data);
      if (r.code === 1) {
        const points = (r.info && r.info.points) || '10';
        $notification.post('蜗牛签到成功', '', '获得 ' + points + ' 积分');
      } else if (r.code === 1001) {
        $notification.post('蜗牛今日已签到', '', r.msg || '今日已签到');
      } else {
        $notification.post('蜗牛签到失败', '', (r.msg || '签到失败') + '，请重新抓取 Cookie');
      }
    } catch (e) {
      $notification.post('蜗牛签到失败', '', '返回异常，请检查登录态');
    }
    $done();
  });
}
