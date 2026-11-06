// 微博超话抓取：保存签到/打卡要用的链接、请求头和图片 ID（只能在 App 里做，网页做不了）
// 1) 超话社区 → 我的 → 关注：保存已关注超话列表链接
// 2) 点进超话点“签到”：保存签到链接
// 3) 点“打卡”，用每天要发的照片发一次：保存打卡检查链接 + 图片 ID
// 抓完后在 Loon 里关掉本插件的重写，签到和打卡由“微博超话每日打卡”插件定时执行。
const KEYS = {
  listUrl: "weibo_chaohua_list_url",
  listHeaders: "weibo_chaohua_list_headers",
  checkinUrl: "weibo_chaohua_checkin_url",
  checkinHeaders: "weibo_chaohua_checkin_headers",
  dakaCheckUrl: "weibo_daka_check_url",
  dakaCheckHeaders: "weibo_daka_check_headers",
  dakaPicFid: "weibo_daka_pic_fid",
  dakaPicMd5: "weibo_daka_pic_md5"
};

function isSaved(key) {
  const v = $persistentStore.read(key);
  return v !== null && v !== undefined && v !== "";
}
function save(key, val) {
  if (val) $persistentStore.write(val, key);
}

if ($request && $request.method !== "OPTIONS") {
  const url = $request.url || "";
  const headers = JSON.stringify($request.headers || {});
  if (/cardlist/.test(url) && /__myfollow/.test(url) && /need_head_cards/.test(url)) {
    // 已关注超话列表请求
    if (!isSaved(KEYS.listUrl)) {
      save(KEYS.listUrl, url);
      save(KEYS.listHeaders, headers);
      $notification.post("微博超话", "已获取已关注超话列表", "接下来点进一个超话手动签到一次");
    }
  } else if (/page\/button/.test(url) && /active_checkin/.test(url)) {
    // 超话签到请求
    if (!isSaved(KEYS.checkinUrl)) {
      save(KEYS.checkinUrl, url);
      save(KEYS.checkinHeaders, headers);
      $notification.post("微博超话", "已获取超话签到链接", "签到链接已保存");
    }
  } else if (/page\/button/.test(url) && /KeepActivityPublish/.test(url)) {
    // 超话打卡检查请求
    if (!isSaved(KEYS.dakaCheckUrl)) {
      save(KEYS.dakaCheckUrl, url);
      save(KEYS.dakaCheckHeaders, headers);
      $notification.post("微博超话", "已获取打卡检查链接", "用每天要发的照片发一次打卡，图片也会自动保存");
    }
  } else if (/\/2\/statuses\/send/.test(url) && $request.body && /keep_activityid/.test($request.body)) {
    // 打卡发帖请求：从 body 里取图片 fid 和 md5
    let body = $request.body || "";
    try { body = decodeURIComponent(body); } catch (e) {}
    const fidM = body.match(/"fid"\s*:\s*"([^"]+)"/);
    const md5M = body.match(/"pic_raw_md5"\s*:\s*"([a-f0-9]{32})"/);
    if (fidM && md5M && !isSaved(KEYS.dakaPicFid)) {
      save(KEYS.dakaPicFid, fidM[1]);
      save(KEYS.dakaPicMd5, md5M[1]);
      $notification.post("微博超话", "已保存打卡图片", "打卡要用的东西都齐了，每天 09:00 会自动发");
    }
  }
}
$done({});
