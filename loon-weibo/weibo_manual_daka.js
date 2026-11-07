// 微博手动打卡一次（黄子弘凡）
// 由插件设置里的「手动打卡一次」开关触发：开关默认关，打开后 1 分钟内打卡一次，打完自动把开关关掉。
// 只做打卡，不做每日签到和超话签到。
const PAGE_ID = "100808c98f988ea22d7b40caed47951f8eb507";
const TOPIC_HASH = "c98f988ea22d7b40caed47951f8eb507";
const ACTIVITY_ID = "3691";
const LFID = "1076035599239416";
const DEFAULT_COPY = "八年风与歌，初心未改，愿黄子弘凡永远自在发光🎶";
const DAKA_CHECK_URL = "weibo_daka_check_url";
const DAKA_CHECK_HEADERS = "weibo_daka_check_headers";
const DAKA_PIC_FID = "weibo_daka_pic_fid";
const DAKA_PIC_MD5 = "weibo_daka_pic_md5";
const COPY_KEY = "weibo_daka_copy";
const TIMEOUT = 15000; // 单次请求超时 15 秒
const SWITCH_KEY = "manualDaka";
const DONE_KEY = "manualDaka_done";

function read(key) {
  const v = $persistentStore.read(key);
  return v === null || v === undefined ? "" : v;
}
function write(key, val) {
  try { $persistentStore.write(val, key); } catch (e) {}
}
// 手动打卡开关：没传参数时默认关（和 argOn 默认开不同）
function switchOn() {
  try {
    if (typeof $argument === "undefined" || !$argument) return false;
    const v = $argument[SWITCH_KEY];
    return v === true || v === "true";
  } catch (e) { return false; }
}
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
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
    try { out[k] = decodeURIComponent(v); } catch (e) { out[k] = v; }
  });
  return out;
}
function encodeQuery(params) {
  return Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
  }).join("&");
}
function httpGet(url, headers) {
  return new Promise(function (resolve) {
    let done = false;
    const timer = setTimeout(function () {
      if (done) return;
      done = true;
      resolve({ error: "请求超时", status: 0, body: "" });
    }, TIMEOUT);
    $httpClient.get({ url: url, headers: headers || {} }, function (error, response, data) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ error: error, status: response ? response.status : 0, body: data || "" });
    });
  });
}
function httpPost(url, headers, body) {
  return new Promise(function (resolve) {
    let done = false;
    const timer = setTimeout(function () {
      if (done) return;
      done = true;
      resolve({ error: "请求超时", status: 0, body: "" });
    }, TIMEOUT);
    const h = Object.assign({}, headers || {});
    $httpClient.post({ url: url, headers: h, body: body || "" }, function (error, response, data) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ error: error, status: response ? response.status : 0, body: data || "" });
    });
  });
}
function shortMsg(data) {
  if (!data) return "无返回";
  try {
    const o = JSON.parse(data);
    return o.msg || o.errmsg || o.message || ("code=" + (o.code !== undefined ? o.code : "?"));
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

// 只给黄子弘凡发图文打卡帖（出道八周年活动）
async function daka(lines) {
  const checkUrl = read(DAKA_CHECK_URL);
  const checkHeadersRaw = read(DAKA_CHECK_HEADERS);
  const picFid = read(DAKA_PIC_FID);
  const picMd5 = read(DAKA_PIC_MD5);
  const copy = read(COPY_KEY) || DEFAULT_COPY;
  if (!checkUrl || !checkHeadersRaw || !picFid || !picMd5) {
    lines.push("黄子弘凡打卡：还没抓取打卡信息，在黄子弘凡超话点一次打卡（用每天要发的照片发一次）");
    return;
  }
  let headers = {};
  try { headers = JSON.parse(checkHeadersRaw); } catch (e) { headers = {}; }
  const common = commonParams(checkUrl);
  const apiBase = "https://api.weibo.cn";
  // 先重放打卡检查，拿当天的文案模板（DayN）和新的 callback_url
  const freshCheckUrl = checkUrl.replace(/ul_ctime=\d+/, "ul_ctime=" + Date.now());
  const resp2 = await httpGet(freshCheckUrl, headers);
  if (resp2.error || !resp2.body) {
    lines.push("黄子弘凡打卡：检查失败 " + (resp2.error || "无返回"));
    return;
  }
  let scheme = "";
  try { scheme = JSON.parse(resp2.body).scheme || ""; } catch (e) { scheme = ""; }
  if (!scheme) {
    lines.push("黄子弘凡打卡：检查失败，没拿到发帖模板");
    return;
  }
  const sq = scheme.split("?")[1] || "";
  const sp = parseQuery(sq);
  const template = sp.content || "";
  const callbackUrl = sp.callback_url || "";
  if (!template || !callbackUrl) {
    lines.push("黄子弘凡打卡：检查失败，模板不完整");
    return;
  }
  const dayM = template.match(/Day(\d+)/);
  const day = dayM ? dayM[1] : "?";
  const finalContent = template.replace(/\s+$/, "") + "\n" + copy;
  const mediaJson = JSON.stringify([{ "filterMethod": 1, "bypass": "unistore.image", "createtype": "other", "pic_source": 0, "encrypted": false, "fid": picFid, "type": "pic", "picStatus": 0, "isScreenshot": 0, "pic_raw_md5": picMd5 }]);
  const superEx = JSON.stringify({ "keep_activityid": 3691, "system_pic_only": 1 });
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
    "super_raw_data": JSON.stringify({ "chaohua_activity_type": "keep_activity", "activity_id": ACTIVITY_ID }),
    "sync_mblog": "1",
    "topic_id": "1022:" + PAGE_ID,
    "uicode": "10000708",
    "user_input": "1"
  };
  const sendUrl = apiBase + "/2/statuses/send?" + encodeQuery(common);
  const h = Object.assign({}, headers);
  h["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
  const resp3 = await httpPost(sendUrl, h, encodeQuery(body));
  if (resp3.error || !resp3.body) {
    lines.push("黄子弘凡打卡：发帖失败 " + (resp3.error || "无返回"));
    return;
  }
  let ok = false;
  try {
    const o = JSON.parse(resp3.body);
    if (o.idstr) ok = true;
  } catch (e) {}
  if (ok) lines.push("黄子弘凡打卡：✅成功 Day" + day);
  else lines.push("黄子弘凡打卡：发帖失败 " + shortMsg(resp3.body));
}

// ---------- 主流程 ----------
(async function () {
  // 开关没开：清掉已完成标记，下次打开才能再触发
  if (!switchOn()) {
    write(DONE_KEY, "");
    $done({});
    return;
  }
  // 开关开着但已经打过一次了：不再重复打，尝试把开关关掉
  if (read(DONE_KEY)) {
    write(SWITCH_KEY, "false");
    $done({});
    return;
  }
  // 开关开着且还没打：只做一次打卡
  const lines = [];
  await daka(lines);
  // 标记已完成，并把开关关掉
  write(DONE_KEY, "done");
  write(SWITCH_KEY, "false");
  $notification.post("微博超话签到打卡", lines[0] || "完成", lines.join("\n"));
  $done({});
})().catch(function (e) {
  $notification.post("微博超话签到打卡", "执行异常", String(e && e.message || e));
  $done({});
});
