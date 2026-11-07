// 微博超话签到抓取（无打卡版；改编自 fmz200：超话部分原作者 Evilbutcher、toulanboy，fmz200 重构；每日签到抓取改编自 fmz200 的 get_cookie.js）
// 抓三样东西（只能在微博 App 里做）：
// 1) 已关注超话列表：POST /2/flowlist，body 含 fid=232478_-_super_topic_followed（新版微博客户端 16.x+）
// 2) 超话签到链接：GET page/button，URL 含 active_checkin
// 3) 微博每日签到数据：GET api.weibo.cn/2/users/show，URL 含 uid=
// 抓完后可以关掉本插件的抓取开关，只留每天 09:00 的定时签到。登录凭证会过期，签到开始失败时，重新抓一次就行。
const CHAOHUA_KEY = "weibo_chaohua_tokens";
const SIGNIN_KEY = "weibo_signin_tokens";

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

  if (url.includes("/2/flowlist") && body.includes("fid=232478_-_super_topic_followed")) {
    // 已关注超话列表（新版客户端 POST）
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
