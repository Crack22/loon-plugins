// 微博超话签到抓取：保存已关注超话列表链接和签到链接（含请求头）
// 两步：1) 微博 App → 我的 → 超话社区 → 我的 → 关注
//       2) 点进一个超话，手动签到一次
// 抓完后在 Loon 里关掉本插件的重写，签到由定时任务插件执行。
const LIST_URL_KEY = "weibo_chaohua_list_url";
const LIST_HEADERS_KEY = "weibo_chaohua_list_headers";
const CHECKIN_URL_KEY = "weibo_chaohua_checkin_url";
const CHECKIN_HEADERS_KEY = "weibo_chaohua_checkin_headers";

if ($request && $request.method !== "OPTIONS") {
  const url = $request.url || "";
  const headers = JSON.stringify($request.headers || {});
  if (/cardlist/.test(url) && /__myfollow/.test(url) && /need_head_cards/.test(url)) {
    // 已关注超话列表请求，只在没抓过时保存
    if (!$persistentStore.read(LIST_URL_KEY)) {
      $persistentStore.write(url, LIST_URL_KEY);
      $persistentStore.write(headers, LIST_HEADERS_KEY);
      $notification.post("微博超话", "已获取已关注超话列表", "接下来点进一个超话，手动签到一次");
    }
  } else if (/page\/button/.test(url) && /active_checkin/.test(url)) {
    // 超话签到请求，只在没抓过时保存
    if (!$persistentStore.read(CHECKIN_URL_KEY)) {
      $persistentStore.write(url, CHECKIN_URL_KEY);
      $persistentStore.write(headers, CHECKIN_HEADERS_KEY);
      $notification.post("微博超话", "已获取超话签到链接", "两步都完成了，记得在 Loon 里关掉本插件的重写");
    }
  }
}
$done({});
