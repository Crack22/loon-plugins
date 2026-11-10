// 抓五样东西（只能在微博 App 里做）：
// 1) 已关注超话列表：POST /2/flowlist，body 含 fid=232478_-_super_topic_followed（旧版）或 fid=231093_-_selffollowed（微博 16.11+）
// 2) 超话签到链接：GET page/button，URL 含 active_checkin
// 3) 黄子弘凡打卡检查链接：GET page/button，URL 含 KeepActivityPublish 且含黄子弘凡 page_id
// 4) 打卡图片：POST /2/statuses/send，body 含 keep_activityid 且含黄子弘凡话题 hash
// 5) 微博每日签到数据：GET api.weibo.cn/2/users/show，URL 含 uid=
// 抓完后可以关掉本插件的抓取开关，只留每天 09:00 的定时签到。登录凭证会过期，签到或打卡开始失败时，重新抓一次就行。
const PAGE_ID = "100808c98f988ea22d7b40caed47951f8eb507";
const TOPIC_HASH = "c98f988ea22d7b40caed47951f8eb507";
const CHAOHUA_KEY = "weibo_chaohua_tokens";
const SIGNIN_KEY = "weibo_signin_tokens";
const DAKA_CHECK_URL = "weibo_daka_check_url";
const DAKA_CHECK_HEADERS = "weibo_daka_check_headers";
const DAKA_PIC_FID = "weibo_daka_pic_fid";
const DAKA_PIC_MD5 = "weibo_daka_pic_md5";

function read(key) {
  const v = $persistentStore.read(key);
  return v === null || v === undefined ? "" : v;
}
function readArr(key) {
  try { return JSON.parse(read(key) || "[]"); } catch (e) { return []; }
}
function writeArr(key, arr) {
  $persistentStore.write(JSON.stringify(arr), key);
}
function getHeader(headers, name) {
  if (!headers) return "";
  const lower = name.toLowerCase();
  for (const k in headers) {
    if (k.toLowerCase() === lower) return headers[k];
  }
  return "";
}
// 设置里的「抓取开关」：没传参数时默认开；关掉时不抓（脚本行上的 enable={capture} 也会拦一道，这里是双保险）
let captureOn = true;
try {
  if (typeof $argument !== "undefined" && $argument && $argument.capture !== undefined && $argument.capture !== null && $argument.capture !== "") {
    captureOn = $argument.capture === true || $argument.capture === "true";
  }
} catch (e) {}

if (captureOn && $request && $request.method !== "OPTIONS") {
  const url = $request.url || "";
  const headers = $request.headers || {};
  const body = $request.body || "";
  const userId = getHeader(headers, "x-log-uid") || "unknown";

  if (url.includes("/2/flowlist") && (body.includes("fid=232478_-_super_topic_followed") || body.includes("fid=231093_-_selffollowed"))) {
    // 已关注超话列表（新版客户端 POST；微博 16.11+ 改用 fid=231093_-_selffollowed）
    let tokens = readArr(CHAOHUA_KEY);
    let token = tokens.find(function (t) { return t.userId === userId; });
    if (token) {
      // 已有该账号的列表请求参数；签到脚本每次运行时会实时请求最新列表，不覆盖、不重复通知
      console.log("已有超话列表参数 [" + userId + "]，跳过重复获取");
    } else {
      tokens.push({
        userId: userId,
        tokenUrl: url,
        tokenHeaders: JSON.stringify(headers),
        tokenBody: body,
        checkinurl: "",
        checkinHeaders: ""
      });
      writeArr(CHAOHUA_KEY, tokens);
      $notification.post("微博超话", "✅获取已关注超话列表成功 [" + userId + "]", "接下来点进一个超话签到一次");
    }
  } else if (url.includes("page/button") && url.includes("active_checkin")) {
    // 超话签到链接
    let tokens = readArr(CHAOHUA_KEY);
    let token = tokens.find(function (t) { return t.userId === userId && !t.checkinurl; });
    if (token) {
      token.checkinurl = url;
      token.checkinHeaders = JSON.stringify(headers);
      writeArr(CHAOHUA_KEY, tokens);
      $notification.post("微博超话", "🎉获取超话签到链接成功 [" + userId + "]", "签到要用的东西齐了");
    } else {
      $notification.post("微博超话", "❌请先获取超话列表链接", "请先打开微博 → 我的 → 超话社区 → 我的 → 关注");
    }
  } else if (url.includes("page/button") && url.includes("KeepActivityPublish") && url.includes(PAGE_ID)) {
    // 黄子弘凡打卡检查链接（只认黄子弘凡超话）
    if (!read(DAKA_CHECK_URL)) {
      $persistentStore.write(url, DAKA_CHECK_URL);
      $persistentStore.write(JSON.stringify(headers), DAKA_CHECK_HEADERS);
      $notification.post("微博超话", "已获取打卡检查链接", "用每天要发的照片发一次打卡，图片也会自动保存");
    }
  } else if (url.includes("/2/statuses/send") && body.includes("keep_activityid") && body.includes(TOPIC_HASH)) {
    // 打卡发帖：从 body 里取图片 fid 和 md5（只认黄子弘凡超话的帖子）
    let b = body;
    try { b = decodeURIComponent(b); } catch (e) {}
    const fidM = b.match(/"fid"\s*:\s*"([^"]+)"/);
    const md5M = b.match(/"pic_raw_md5"\s*:\s*"([a-f0-9]{32})"/);
    if (fidM && md5M && !read(DAKA_PIC_FID)) {
      $persistentStore.write(fidM[1], DAKA_PIC_FID);
      $persistentStore.write(md5M[1], DAKA_PIC_MD5);
      $notification.post("微博超话", "已保存打卡图片", "打卡要用的东西都齐了，每天 09:00 会自动发");
    }
  } else if (url.includes("/2/users/show")) {
    // 微博每日签到数据：URL 里取 uid，整条 URL 和请求头一起保存
    const m = url.match(/uid=(\d+)/);
    if (m) {
      const uid = m[1];
      let arr = readArr(SIGNIN_KEY);
      let item = arr.find(function (t) { return t.weibo_id === uid; });
      if (!item) {
        arr.push({ weibo_id: uid, signin_url: url, headers: headers });
        writeArr(SIGNIN_KEY, arr);
        $notification.post("微博签到", "微博签到数据已获取 [" + uid + "]", "每天 09:00 会自动签到");
      } else {
        item.signin_url = url;
        item.headers = headers;
        writeArr(SIGNIN_KEY, arr);
      }
    }
  }
}
$done({});
