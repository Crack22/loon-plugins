// EmbyPulse 每日签到（https://embyyh.dijia.de/）
// POST /api/user/points/checkin，需带 Cookie session_id 和 Origin 头
// session_id 保存在 BoxJs（键 embypulse2_session_id），不在插件里写死；过期了重新粘贴
const SITE = "https://embyyh.dijia.de";
const SESSION_KEY = "embypulse2_session_id";
const NAME = "EmbyPulse-dijia";

function headers(sessionId) {
  return {
    "Cookie": "session_id=" + sessionId,
    "Origin": SITE,
    "Referer": SITE + "/?tab=explore",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  };
}
function parseJson(data) {
  try { return JSON.parse(data); } catch (e) { return null; }
}

const sessionId = $persistentStore.read(SESSION_KEY) || "";
if (!sessionId) {
  $notification.post(NAME + "签到", "还没填 session_id", "在 BoxJs 里找到 " + NAME + "，把 session_id 粘贴进去");
  $done({});
} else {
  const h = headers(sessionId);
  // 先查状态：今天已签到就不用再发一次
  $httpClient.get({ url: SITE + "/api/user/points/info", headers: h }, function (e1, r1, d1) {
    const info = parseJson(d1);
    if (info && info.status === "success" && info.data && info.data.has_checked_in) {
      $notification.post(NAME + "签到", "今日已签到", "当前积分 " + info.data.points);
      $done({});
      return;
    }
    $httpClient.post({ url: SITE + "/api/user/points/checkin", headers: h, body: "" }, function (e2, r2, d2) {
      const res = parseJson(d2);
      if (res && res.status === "success" && res.data) {
        $notification.post(NAME + "签到", "签到成功 +" + (res.data.reward || 0) + " 积分", "当前积分 " + (res.data.balance || ""));
      } else if (res && res.message && res.message.indexOf("已经签到") !== -1) {
        $notification.post(NAME + "签到", "今日已签到", "");
      } else if (res && res.message) {
        $notification.post(NAME + "签到", "签到失败", res.message);
      } else {
        $notification.post(NAME + "签到", "签到失败", e2 || ("HTTP " + (r2 && r2.status)));
      }
      $done({});
    });
  });
}
