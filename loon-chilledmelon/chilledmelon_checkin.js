// ChilledMelon 每日签到 cron
// 流程：BoxJs 读账号密码 → POST /api/auth/login 拿 accessToken → GET /api/auth/me/checkin 查今日状态
// → 未签到则 GET /api/auth/me/checkin/captcha 取运算题 → 算出答案 → POST /api/auth/me/checkin 提交
// 账号密码存在 BoxJs（$persistentStore），不在脚本里
const USER_KEY = 'chilledmelon_username';
const PASS_KEY = 'chilledmelon_password';
const BASE = 'https://www.chilledmelon.com';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const username = $persistentStore.read(USER_KEY);
const password = $persistentStore.read(PASS_KEY);
if (!username || !password) {
  $notification.post('ChilledMelon 签到失败', '', '未填写账号密码，请在 BoxJs 里填写 chilledmelon_username 和 chilledmelon_password');
  $done();
} else {
  login();
}

function login() {
  $httpClient.post({
    url: BASE + '/api/auth/login',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ username: username, password: password })
  }, function (error, response, data) {
    if (error) {
      $notification.post('ChilledMelon 签到失败', '', '登录网络异常');
      $done();
      return;
    }
    let r = {};
    try { r = JSON.parse(data); } catch (e) {}
    if (response.status === 401 || response.status === 403) {
      $notification.post('ChilledMelon 签到失败', '', '账号或密码错误，请检查 BoxJs 里的账号密码');
      $done();
      return;
    }
    if (response.status === 429) {
      $notification.post('ChilledMelon 签到失败', '', '登录尝试过于频繁，请稍后再试');
      $done();
      return;
    }
    if (!r.accessToken) {
      $notification.post('ChilledMelon 签到失败', '', '登录失败：' + (r.message || ('HTTP ' + response.status)));
      $done();
      return;
    }
    checkStatus(r.accessToken);
  });
}

function checkStatus(token) {
  const now = new Date();
  const url = BASE + '/api/auth/me/checkin?year=' + now.getFullYear() + '&month=' + (now.getMonth() + 1);
  $httpClient.get({
    url: url,
    headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': UA }
  }, function (error, response, data) {
    if (error) {
      $notification.post('ChilledMelon 签到失败', '', '查询签到状态网络异常');
      $done();
      return;
    }
    let r = {};
    try { r = JSON.parse(data); } catch (e) {}
    if (r.checkedInToday) {
      $notification.post('ChilledMelon 今日已签到', '', '当前积分 ' + (r.balance || '') + '，今日 +' + (r.todayReward || '') + ' 积分');
      $done();
      return;
    }
    getCaptcha(token);
  });
}

function getCaptcha(token) {
  $httpClient.get({
    url: BASE + '/api/auth/me/checkin/captcha',
    headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': UA }
  }, function (error, response, data) {
    if (error) {
      $notification.post('ChilledMelon 签到失败', '', '获取验证码网络异常');
      $done();
      return;
    }
    let r = {};
    try { r = JSON.parse(data); } catch (e) {}
    if (!r.token || !r.question) {
      $notification.post('ChilledMelon 签到失败', '', '获取验证码失败：' + (r.message || ('HTTP ' + response.status)));
      $done();
      return;
    }
    const ans = solve(r.question);
    if (ans === null) {
      $notification.post('ChilledMelon 签到失败', '', '无法解析运算题：' + r.question);
      $done();
      return;
    }
    submit(token, r.token, String(ans));
  });
}

function submit(token, captchaToken, answer) {
  $httpClient.post({
    url: BASE + '/api/auth/me/checkin',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ captchaToken: captchaToken, captchaAnswer: answer })
  }, function (error, response, data) {
    if (error) {
      $notification.post('ChilledMelon 签到失败', '', '提交签到网络异常');
      $done();
      return;
    }
    let r = {};
    try { r = JSON.parse(data); } catch (e) {}
    if (r.checkedIn) {
      $notification.post('ChilledMelon 签到成功', '', '获得 ' + r.reward + ' 积分，当前积分 ' + r.balance);
    } else if (response.status === 200 && r.date) {
      $notification.post('ChilledMelon 今日已签到', '', '今日 +' + (r.reward || '') + ' 积分，当前积分 ' + (r.balance || ''));
    } else {
      $notification.post('ChilledMelon 签到失败', '', r.message || ('签到失败 HTTP ' + response.status));
    }
    $done();
  });
}

function solve(q) {
  const m = q.match(/(-?\d+)\s*([+\-×x*÷\/])\s*(-?\d+)/);
  if (!m) return null;
  const a = parseInt(m[1], 10), b = parseInt(m[3], 10), op = m[2];
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '×' || op === 'x' || op === '*') return a * b;
  if (op === '÷' || op === '/') return b === 0 ? null : Math.round(a / b);
  return null;
}
