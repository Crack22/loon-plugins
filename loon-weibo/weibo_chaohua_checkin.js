// 微博超话签到打卡 + 微博每日签到（每天 09:00）
// 每天 09:00 自动做三件事：
// 1) 微博每日签到：POST /2/checkin/add（fmz200 的做法）
// 2) 超话签到：重放已关注超话列表（POST flowlist，可翻页），把所有超话全部签到一遍
// 3) 打卡：只给黄子弘凡发图文打卡帖（出道八周年活动，话题标签 + DayN + 文案 + 每天同一张照片）
const PAGE_ID = "100808c98f988ea22d7b40caed47951f8eb507";
const TOPIC_HASH = "c98f988ea22d7b40caed47951f8eb507";
const ACTIVITY_ID = "3691";
const LFID = "1076035599239416";
const DEFAULT_COPY = "八年风与歌，初心未改，愿黄子弘凡永远自在发光🎶";
const CHAOHUA_KEY = "weibo_chaohua_tokens";
const SIGNIN_KEY = "weibo_signin_tokens";
const DAKA_CHECK_URL = "weibo_daka_check_url";
const DAKA_CHECK_HEADERS = "weibo_daka_check_headers";
const DAKA_PIC_FID = "weibo_daka_pic_fid";
const DAKA_PIC_MD5 = "weibo_daka_pic_md5";
const COPY_KEY = "weibo_daka_copy";
const INTERVAL = 3000; // 超话之间间隔 3 秒，避免请求过快
const TIMEOUT = 15000; // 单次请求超时 15 秒

function read(key) {
const v = $persistentStore.read(key);
return v === null || v === undefined? "": v;
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
function uuid() {
return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
const r = (Math.random() * 16) | 0;
const v = c === "x"? r: (r & 0x3) | 0x8;
return v.toString(16);
}).toUpperCase();
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
// 从打卡检查链接里取出通用参数（aid、gsid、s、ua 等），去掉 cardid/request_url，刷新 ul_ctime
function commonParams(checkUrl) {
const q = checkUrl.split("?")[1] || "";
const p = parseQuery(q);
delete p.cardid;
delete p.request_url;
p.ul_ctime = String(Date.now());
return p;
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

// ---------- 3) 打卡：只给黄子弘凡发图文打卡帖 ----------
async function daka(lines) {
const checkUrl = read(DAKA_CHECK_URL);
const checkHeadersRaw = read(DAKA_CHECK_HEADERS);
const picFid = read(DAKA_PIC_FID);
const picMd5 = read(DAKA_PIC_MD5);
const copy = read(COPY_KEY) || DEFAULT_COPY;
if (!checkUrl ||!checkHeadersRaw ||!picFid ||!picMd5) {
lines.push("打卡：还没抓取打卡信息，在黄子弘凡超话点一次打卡（用每天要发的照片发一次）");
return;
}
let headers = {};
try { headers = JSON.parse(checkHeadersRaw);} catch (e) { headers = {};}
const common = commonParams(checkUrl);
const apiBase = "https://api.weibo.cn";
// 先重放打卡检查，拿当天的文案模板（DayN）和新的 callback_url
const freshCheckUrl = checkUrl.replace(/ul_ctime=\d+/, "ul_ctime=" + Date.now());
const resp2 = await httpGet(freshCheckUrl, headers);
if (resp2.error ||!resp2.body) {
lines.push("打卡：检查失败 " + (resp2.error || "无返回"));
return;
}
let scheme = "";
try { scheme = JSON.parse(resp2.body).scheme || "";} catch (e) { scheme = "";}
if (!scheme) {
lines.push("打卡：检查失败，没拿到发帖模板");
return;
}
const sq = scheme.split("?")[1] || "";
const sp = parseQuery(sq);
const template = sp.content || "";
const callbackUrl = sp.callback_url || "";
if (!template ||!callbackUrl) {
lines.push("打卡：检查失败，模板不完整");
return;
}
const dayM = template.match(/Day(\d+)/);
const day = dayM? dayM[1]: "?";
const finalContent = template.replace(/\s+$/, "") + "\n" + copy;
const mediaJson = JSON.stringify([{ "filterMethod": 1, "bypass": "unistore.image", "createtype": "other", "pic_source": 0, "encrypted": false, "fid": picFid, "type": "pic", "picStatus": 0, "isScreenshot": 0, "pic_raw_md5": picMd5}]);
const superEx = JSON.stringify({ "keep_activityid": 3691, "system_pic_only": 1});
const ext = "effectname:|network:wifi|sg_user_type#3|in_page#1|super_exparams=>" + superEx + "|" + picFid + "|null|null|Label=0|piccnt:1|activity_picnum:0|content_change:0";
const body = {
"act": "add",
"approval_reprint": "1",
"callback_url": callbackUrl,
"check_id": String(Date.now()),
"client_mblogid": "iPhone-" + uuid(),
"content": finalContent,
"rcontent": finalContent,
"contribute": "1",
"ext": ext,
"extparam": "sg_user_type#3|in_page#1|super_exparams=>" + superEx,
"featurecode": "10000085",
"is_vip_paid": "0",
"lcardid": "232476" + TOPIC_HASH + "_-_KeepActivity",
"lfid": PAGE_ID + "_-_page_header_items",
"luicode": "0",
"media": mediaJson,
"moduleID": "composer",
"orifid": "0$$100103type=1&q=黄子弘凡&t=1$$" + LFID + "$$" + PAGE_ID + "_-_page_header_items",
"oriuicode": "10001344_10000003_10000198_0",
"retry": "0",
"super_exparams": superEx,
"super_raw_data": JSON.stringify({ "chaohua_activity_type": "keep_activity", "activity_id": ACTIVITY_ID}),
"sync_mblog": "1",
"topic_id": "1022:" + PAGE_ID,
"uicode": "10000708",
"user_input": "1"
};
const sendUrl = apiBase + "/2/statuses/send?" + encodeQuery(common);
const h = Object.assign({}, headers);
h["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
const resp3 = await httpPost(sendUrl, h, encodeQuery(body));
if (resp3.error ||!resp3.body) {
lines.push("打卡：发帖失败 " + (resp3.error || "无返回"));
return;
}
let ok = false;
try {
const o = JSON.parse(resp3.body);
if (o.idstr) ok = true;
} catch (e) {}
if (ok) lines.push("打卡：✅成功 Day" + day);
else lines.push("打卡：发帖失败 " + shortMsg(resp3.body));
}

// ---------- 主流程 ----------
(async function () {
const lines = [];
if (argOn("dailySignin")) await dailySignin(lines); else lines.push("微博签到：已在设置里关闭");
if (argOn("chaohuaSignin")) await chaohuaSignin(lines); else lines.push("超话签到：已在设置里关闭");
if (argOn("daka")) await daka(lines); else lines.push("打卡：已在设置里关闭");
$notification.post("微博超话签到打卡", lines[0] || "完成", lines.join("\n"));
$done({});
})().catch(function (e) {
$notification.post("微博超话签到打卡", "执行异常", String(e && e.message || e));
$done({});
});
