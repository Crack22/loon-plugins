// 七日杀中文网每日签到 cron：POST /wp-content/themes/LightSNS/module/action/sign.php，sign=1
// 实测：无需 ticket/randstr（前端腾讯验证码后端不校验），成功 code=1，已签到 code=2，失败 code=0
// 签到时间可在 BoxJs 里自定义，默认 08:30
const COOKIE_KEY = 'risha_cookie';

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// risha_time_enabled：开关，启用自定义签到时间（默认关 = 每天 08:30）
// risha_time_mode：fixed = 指定时间 / random = 时间区间随机
// risha_time：指定时间 "HH:MM"，如 09:30
// risha_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "risha_time_enabled";
const TIME_MODE_KEY = "risha_time_mode";
const TIME_KEY = "risha_time";
const TIME_RANGE_KEY = "risha_time_range";
const TIME_TARGET_KEY = "risha_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "risha_time_done"; // 自动签到今天已跑过的日期
const DEFAULT_TIME_MIN = 8 * 60 + 30; // 默认 08:30

// 开关值可能是 "true"/true/"1"/1，都当作开
function isTrue(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}
// 本地日期 YYYY-MM-DD（不用 toISOString，那是 UTC 日期，凌晨会差一天）
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
// 现在是今天的第几分钟（本地时间）
function nowMin() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
// "HH:MM" 转分钟，非法返回 null
function parseHM(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}
// 分钟转 "HH:MM"
function fmtHM(min) {
  const h = Math.floor(min / 60), mi = min % 60;
  return String(h).padStart(2, "0") + ":" + String(mi).padStart(2, "0");
}
// 今天的目标签到时间（分钟）。未启用或配置非法时回落到 08:30
function todayTargetMin() {
  if (!isTrue($persistentStore.read(TIME_ENABLED_KEY))) return DEFAULT_TIME_MIN;
  const mode = ($persistentStore.read(TIME_MODE_KEY) || "").trim();
  if (mode === "fixed") {
    const t = parseHM($persistentStore.read(TIME_KEY));
    return t === null ? DEFAULT_TIME_MIN : t;
  }
  if (mode === "random") {
    const range = ($persistentStore.read(TIME_RANGE_KEY) || "").trim();
    const parts = range.split("-");
    if (parts.length !== 2) return DEFAULT_TIME_MIN;
    const start = parseHM(parts[0]), end = parseHM(parts[1]);
    if (start === null || end === null || end <= start) return DEFAULT_TIME_MIN;
    const today = todayStr();
    const stored = $persistentStore.read(TIME_TARGET_KEY) || "";
    if (stored) {
      const sp = stored.split("|");
      if (sp.length === 2 && sp[0].slice(0, 10) === today && sp[1] === range) {
        const t = parseHM(sp[0].slice(11));
        if (t !== null) return t;
      }
    }
    const pick = start + Math.floor(Math.random() * (end - start + 1));
    $persistentStore.write(today + " " + fmtHM(pick) + "|" + range, TIME_TARGET_KEY);
    return pick;
  }
  return DEFAULT_TIME_MIN;
}
// 自动定时是否该跑：目标时间起 60 分钟内且今天还没跑过（窗口外不跑，避免打开 Loon 时补跑）
function shouldRunAuto() {
  const today = todayStr();
  if (($persistentStore.read(TIME_DONE_KEY) || "") === today) return false;
  const target = todayTargetMin();
  const now = nowMin();
  return now >= target && now < target + 60;
}

function main() {
  if (!shouldRunAuto()) {
    $done();
    return;
  }
  const cookie = $persistentStore.read(COOKIE_KEY);
  if (!cookie) {
    $notification.post('7risha签到失败', '', '未获取到 Cookie，请先打开签到页抓取');
    $done();
    return;
  }
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
      $persistentStore.write(todayStr(), TIME_DONE_KEY);
      $notification.post('7risha签到失败', '', '网络异常，请稍后重试');
      $done();
      return;
    }
    try {
      const r = JSON.parse(data);
      if (r.code === 1) {
        $persistentStore.write(todayStr(), TIME_DONE_KEY);
        $notification.post('7risha签到成功', '', (r.msg || '签到成功') + '，累计签到 ' + (r.sign_c || '') + ' 天');
      } else if (r.code === 2) {
        $persistentStore.write(todayStr(), TIME_DONE_KEY);
        $notification.post('7risha今日已签到', '', (r.msg || '今日已签到') + '，累计签到 ' + (r.sign_c || '') + ' 天');
      } else if (r.code === 8) {
        $persistentStore.write(todayStr(), TIME_DONE_KEY);
        $notification.post('7risha签到失败', '', '需先绑定手机号');
      } else if (r.code === 9) {
        $persistentStore.write(todayStr(), TIME_DONE_KEY);
        $notification.post('7risha签到失败', '', '需先绑定邮箱');
      } else {
        $persistentStore.write(todayStr(), TIME_DONE_KEY);
        $notification.post('7risha签到失败', '', (r.msg || '签到失败') + '，请重新抓取 Cookie');
      }
    } catch (e) {
      $persistentStore.write(todayStr(), TIME_DONE_KEY);
      $notification.post('7risha签到失败', '', '返回异常，请检查登录态');
    }
    $done();
  });
}

main();
