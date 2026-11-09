// 微博超话签到 + 微博每日签到（无打卡版，签到时间可在 BoxJs 里自定义，默认 09:00）
// 每天自动做两件事：
// 1) 微博每日签到：POST /2/checkin/add（fmz200 的做法）
// 2) 超话签到：重放已关注超话列表（POST flowlist，可翻页），把所有超话全部签到一遍
const CHAOHUA_KEY = "weibo_chaohua_tokens";
const SIGNIN_KEY = "weibo_signin_tokens";
const INTERVAL = 3000; // 超话之间间隔 3 秒，避免请求过快
const TIMEOUT = 15000; // 单次请求超时 15 秒
const MANUAL_DONE_KEY = "manualRun_done";

function read(key) {
const v = $persistentStore.read(key);
return v === null || v === undefined? "": v;
}
function write(key, val) {
try { $persistentStore.write(val, key); } catch (e) {}
}
function readArr(key) {
try { return JSON.parse(read(key) || "[]");} catch (e) { return [];}
}
// 去重：同一账号抓了多次时只留第一条，避免通知重复
function dedupeTokens(tokens, idField) {
  const seen = new Set();
  const out = [];
  for (const t of tokens) {
    const id = t && t[idField];
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(t);
  }
  return out;
}

// 读设置里的开关（没传参数时默认开）
function argOn(name) {
  try {
    if (typeof $argument === "undefined" || !$argument) return true;
    const v = $argument[name];
    if (v === undefined || v === null || v === "") return true;
    return v === true || v === "true";
  } catch (e) { return true; }
}
// 手动运行开关：没传参数时默认关（和 argOn 默认开不同）
function manualOn() {
  try {
    if (typeof $argument === "undefined" || !$argument) return false;
    const v = $argument["manualRun"];
    return v === true || v === "true";
  } catch (e) { return false; }
}
// ---------- 自定义签到时间 ----------
// BoxJs 设置（两个微博应用共用同一套 key）：
// weibo_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// weibo_time_mode：fixed = 指定时间 / random = 时间区间随机
// weibo_time：指定时间 "HH:MM"，如 09:30
// weibo_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "weibo_time_enabled";
const TIME_MODE_KEY = "weibo_time_mode";
const TIME_KEY = "weibo_time";
const TIME_RANGE_KEY = "weibo_time_range";
const TIME_TARGET_KEY = "weibo_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "weibo_time_done"; // 自动签到今天已跑过的日期
const DEFAULT_TIME_MIN = 9 * 60; // 默认 09:00

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
// 今天的目标签到时间（分钟）。未启用或配置非法时回落到 09:00
function todayTargetMin() {
  if (!isTrue(read(TIME_ENABLED_KEY))) return DEFAULT_TIME_MIN;
  const mode = (read(TIME_MODE_KEY) || "").trim();
  if (mode === "fixed") {
    const t = parseHM(read(TIME_KEY));
    return t === null ? DEFAULT_TIME_MIN : t;
  }
  if (mode === "random") {
    const range = (read(TIME_RANGE_KEY) || "").trim();
    const parts = range.split("-");
    if (parts.length !== 2) return DEFAULT_TIME_MIN;
    const start = parseHM(parts[0]), end = parseHM(parts[1]);
    if (start === null || end === null || end <= start) return DEFAULT_TIME_MIN;
    const today = todayStr();
    // 当天已挑过且区间没变 → 用存好的；否则重新随机挑一个
    const stored = read(TIME_TARGET_KEY);
    if (stored) {
      const sp = stored.split("|");
      if (sp.length === 2 && sp[0].slice(0, 10) === today && sp[1] === range) {
        const t = parseHM(sp[0].slice(11));
        if (t !== null) return t;
      }
    }
    const pick = start + Math.floor(Math.random() * (end - start + 1));
    write(TIME_TARGET_KEY, today + " " + fmtHM(pick) + "|" + range);
    return pick;
  }
  return DEFAULT_TIME_MIN;
}
// 自动定时是否该跑：目标时间起 60 分钟内且今天还没跑过（窗口外不跑，避免打开 Loon 时补跑）
function shouldRunAuto() {
  const today = todayStr();
  if (read(TIME_DONE_KEY) === today) return false;
  const target = todayTargetMin();
  const now = nowMin();
  return now >= target && now < target + 60;
}
function parseQuery(qs) {
const out = {};
if (!qs) return out;
qs.split("&").forEach(function (pair) {
const i = pair.indexOf("=");
if (i < 0) return;
const k = pair.slice(0, i);
const v = pair.slice(i + 1).replace(/\+/g, " ");
try { out[k] = decodeURIComponent(v);} catch (e) { out[k] = v;}
});
return out;
}
function encodeQuery(params) {
return Object.keys(params).map(function (k) {
return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
}).join("&");
}
function sleep(ms) {
return new Promise(function (resolve) { setTimeout(resolve, ms);});
}
function httpGet(url, headers) {
return new Promise(function (resolve) {
let done = false;
const timer = setTimeout(function () {
if (done) return;
done = true;
resolve({ error: "请求超时", status: 0, body: ""});
}, TIMEOUT);
$httpClient.get({ url: url, headers: headers || {}}, function (error, response, data) {
if (done) return;
done = true;
clearTimeout(timer);
resolve({ error: error, status: response? response.status: 0, body: data || ""});
});
});
}
function httpPost(url, headers, body) {
return new Promise(function (resolve) {
let done = false;
const timer = setTimeout(function () {
if (done) return;
done = true;
resolve({ error: "请求超时", status: 0, body: ""});
}, TIMEOUT);
const h = Object.assign({}, headers || {});
$httpClient.post({ url: url, headers: h, body: body || ""}, function (error, response, data) {
if (done) return;
done = true;
clearTimeout(timer);
resolve({ error: error, status: response? response.status: 0, body: data || ""});
});
});
}
function shortMsg(data) {
if (!data) return "无返回";
try {
const o = JSON.parse(data);
return o.msg || o.errmsg || o.message || ("code=" + (o.code!== undefined? o.code: "?"));
} catch (e) {
return String(data).slice(0, 80);
}
}

// ---------- 1) 微博每日签到 ----------
async function dailySignin(lines) {
const tokens = dedupeTokens(readArr(SIGNIN_KEY), "weibo_id");
if (tokens.length === 0) {
lines.push("微博签到：还没抓取数据，打开微博 App 随便刷一下");
return;
}
for (const item of tokens) {
const weiboId = item.weibo_id || "未知";
try {
const params = parseQuery((item.signin_url || "").split("?")[1] || "");
if (!params.from ||!params.uid ||!params.s ||!params.gsid) {
lines.push("微博签到[" + weiboId + "]：签到链接不完整，请重新抓取");
continue;
}
// 先拿用户信息（不是必须的，失败就用 uid 当名字）
let username = weiboId;
const info = await httpGet(item.signin_url, item.headers || {});
if (!info.error && info.body) {
try {
const u = JSON.parse(info.body);
if (u.name) username = u.name;
} catch (e) {}
}
const token = "from=" + params.from + "&uid=" + params.uid + "&s=" + params.s + "&gsid=" + params.gsid;
const resp = await httpPost("https://api.weibo.cn/2/checkin/add?c=iphone&" + token, {
"User-Agent": "Weibo/52588 (iPhone; iOS 14.5; Scale/3.00)"
}, "");
if (resp.error ||!resp.body) {
lines.push("微博签到[" + username + "]：失败 " + (resp.error || "无返回"));
continue;
}
let o;
try { o = JSON.parse(resp.body);} catch (e) {
lines.push("微博签到[" + username + "]：返回解析失败");
continue;
}
if (o.status === 10000) {
const days = o.data && o.data.continuous;
const reward = o.data && o.data.title_style && o.data.title_style[0];
lines.push("微博签到[" + username + "]：✅连续签到" + days + "天，本次收益" + reward + "积分");
} else if (o.errno === 30000) {
lines.push("微博签到[" + username + "]：" + (o.errmsg || "失败"));
} else {
lines.push("微博签到[" + username + "]：" + shortMsg(resp.body));
}
} catch (e) {
lines.push("微博签到[" + weiboId + "]：执行异常 " + (e.message || e));
}
}
}

// ---------- 2) 超话签到：取全部已关注超话 ----------
// 从列表响应里提取超话（card_type=8 的卡片，scheme 里取 containerid=100808xxx）
function extractTopics(obj, nameList, idList, seenIds) {
let count = 0;
if (!obj.items) return count;
for (const item of obj.items) {
if (item.category!== "group" ||!item.items) continue;
for (const sub of item.items) {
if (sub.category!== "card" ||!sub.data) continue;
const data = sub.data;
if (data.card_type!== 8) continue;
const match = (data.scheme || "").match(/containerid=([a-f0-9]+)/);
if (!match) continue;
const id = match[1];
if (seenIds.has(id)) continue;
seenIds.add(id);
nameList.push(data.title_sub || data.title || "");
idList.push(id);
count++;
}
}
return count;
}
// 改 POST body 用于翻页（flowlist：taskType=loadMore + since_id 递增，不用 page）
function modifyBodyForPagination(body, sinceId, maxId) {
const pairs = body.split("&");
const result = [];
let foundTaskType = false, addedManualType = false, addedInvokeType = false;
let foundSinceId = false, foundPagingType = false;
for (const pair of pairs) {
const idx = pair.indexOf("=");
const key = idx > -1? pair.substring(0, idx): pair;
if (key === "taskType") { foundTaskType = true; result.push("taskType=loadMore"); continue;}
if (key === "manualType") { addedManualType = true; result.push("manualType=scroll"); continue;}
if (key === "invokeType") { addedInvokeType = true; result.push("invokeType=manual"); continue;}
if (key === "since_id") { foundSinceId = true; result.push("since_id=" + sinceId); continue;}
if (key === "page") continue; // flowlist 不用 page 参数，移除
if (key === "max_id") { result.push(pair); continue;}
if (key === "pagingType") { foundPagingType = true; result.push("pagingType=cursor"); continue;}
result.push(pair);
}
if (!foundTaskType) result.push("taskType=loadMore");
if (!addedManualType) result.push("manualType=scroll");
if (!addedInvokeType) result.push("invokeType=manual");
if (!foundSinceId) result.push("since_id=" + sinceId);
if (!foundPagingType) result.push("pagingType=cursor");
return result.join("&");
}
async function getAllTopics(token) {
const nameList = [], idList = [];
const seenIds = new Set();
let headers = {};
try { headers = JSON.parse(token.tokenHeaders || "{}");} catch (e) { headers = {};}
let page = 1, sinceId = "", maxId = "", hasMore = true;
const maxPages = 10;
while (hasMore && page <= maxPages) {
let body = token.tokenBody;
if (page > 1) body = modifyBodyForPagination(body, sinceId, maxId);
if (page > 1 && body === token.tokenBody) {
console.log("分页 body 未变化，停止获取后续超话列表");
break;
}
const resp = await httpPost(token.tokenUrl, headers, body);
if (resp.error ||!resp.body) {
console.log("获取超话列表失败：" + (resp.error || "无响应"));
break;
}
let obj;
try { obj = JSON.parse(resp.body);} catch (e) {
console.log("解析超话列表响应失败");
break;
}
if (obj.errmsg) {
console.log("获取超话列表错误：" + obj.errmsg + "，账号可能过期了");
break;
}
const found = extractTopics(obj, nameList, idList, seenIds);
console.log("第" + page + "页找到 " + found + " 个超话");
if (found === 0) { hasMore = false; break;}
const moreInfo = obj.moreInfo || {};
if (moreInfo.params && moreInfo.params.since_id) {
const nextPage = parseInt(moreInfo.params.page || "0", 10);
page = (nextPage && nextPage!== page)? nextPage: page + 1;
sinceId = moreInfo.params.since_id;
maxId = moreInfo.params.max_id || "";
} else {
hasMore = false;
}
}
return { nameList: nameList, idList: idList};
}
// 单个超话签到：把签到链接里的 fid/pageid 换成这个超话的
async function checkinOne(token, id, name) {
const sendUrl = token.checkinurl
.replace(/fid=[a-f0-9]+/, "fid=" + id)
.replace(/pageid%3D[a-f0-9]+/, "pageid%3D" + id);
let headers = {};
try { headers = JSON.parse(token.checkinHeaders || "{}");} catch (e) { headers = {};}
const resp = await httpGet(sendUrl, headers);
const cleanName = (name || "").replace(/超话/, "");
if (resp.error) return { ok: false, text: cleanName + "：❌请求失败 " + resp.error};
if (resp.status === 200) {
let o;
try { o = JSON.parse(resp.body);} catch (e) {
return { ok: false, text: cleanName + "：❌响应解析失败"};
}
if (o.errmsg!== undefined) {
if (o.errcode === 382004) return { ok: true, text: cleanName + "：✨今天已签到"};
return { ok: false, text: cleanName + "：" + o.errmsg};
}
if (o.result === 1) {
const btn = o.button && o.button.name? o.button.name: "签到成功";
return { ok: true, text: cleanName + "：✅" + btn};
}
return { ok: false, text: cleanName + "：发生错误"};
}
if (resp.status === 418) return { ok: false, text: cleanName + "：签到太频繁啦，请稍后再试"};
if (resp.status === 511) return { ok: false, text: cleanName + "：需要身份验证，请稍后再试"};
return { ok: false, text: cleanName + "：发生错误（" + resp.status + "）"};
}
async function chaohuaSignin(lines) {
const tokens = dedupeTokens(readArr(CHAOHUA_KEY), "userId");
if (tokens.length === 0) {
lines.push("超话签到：还没抓取数据，打开微博 App → 超话社区 → 我的 → 关注");
return;
}
for (const token of tokens) {
const userId = token.userId || "未知";
const required = ["tokenUrl", "tokenHeaders", "tokenBody", "checkinurl", "checkinHeaders"];
const missing = required.some(function (k) { return!token[k];});
if (missing) {
lines.push("超话签到[" + userId + "]：数据不完整，请重新抓取");
continue;
}
try {
const topics = await getAllTopics(token);
if (topics.nameList.length === 0) {
lines.push("超话签到[" + userId + "]：未获取到关注的超话，可能凭证已过期");
continue;
}
let success = 0, fail = 0;
const details = [];
for (let j = 0; j < topics.nameList.length; j++) {
const r = await checkinOne(token, topics.idList[j], topics.nameList[j]);
if (r.ok) success++; else fail++;
details.push(r.text);
await sleep(INTERVAL);
}
lines.push("超话签到[" + userId + "]：成功" + success + "个，失败" + fail + "个");
lines.push(details.join("\n"));
} catch (e) {
lines.push("超话签到[" + userId + "]：执行异常 " + (e.message || e));
}
}
}

// ---------- 主流程 ----------
(async function () {
const lines = [];
const manual = manualOn();
if (manual) {
  // 手动运行：今天已经跑过一次就不重复，跑完后由用户手动关开关
  const today = todayStr(); // 本地日期，和自动定时保持一致
  if (read(MANUAL_DONE_KEY) === today) {
    $done({});
    return;
  }
  await dailySignin(lines);
  await chaohuaSignin(lines);
  write(MANUAL_DONE_KEY, today);
  write(TIME_DONE_KEY, todayStr()); // 手动跑过后，当天自动定时不再重复跑
} else {
  // 自动定时：没到设定的时间、或今天已跑过，就悄悄退出
  if (!shouldRunAuto()) {
    $done({});
    return;
  }
  if (argOn("dailySignin")) await dailySignin(lines); else lines.push("微博签到：已在设置里关闭");
  if (argOn("chaohuaSignin")) await chaohuaSignin(lines); else lines.push("超话签到：已在设置里关闭");
  write(TIME_DONE_KEY, todayStr());
}
$notification.post("微博超话签到", lines[0] || "完成", lines.join("\n"));
$done({});
})().catch(function (e) {
$notification.post("微博超话签到", "执行异常", String(e && e.message || e));
$done({});
});
