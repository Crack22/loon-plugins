// 微博超话每日打卡 + 签到（黄子弘凡出道八周年活动，activity_id 3691）
// 每天 09:00：先点签到，再发打卡帖（话题标签 + DayN + 文案 + 保存的图片，每天都用同一张照片）。
// 需要先用“微博超话签到抓取”插件保存：打卡检查链接/请求头、打卡图片 fid/md5。
// 抓取方法：装好抓取插件后，在微博 App 里点“打卡”，用每天要发的那张照片发一次。
// 注意：请求里带的登录凭证会过期，签到或打卡开始失败时，重新用抓取插件抓一次就行。
const PAGE_ID = "100808c98f988ea22d7b40caed47951f8eb507";
const TOPIC_HASH = "c98f988ea22d7b40caed47951f8eb507";
const ACTIVITY_ID = "3691";
const DEFAULT_COPY = "八年风与歌，初心未改，愿黄子弘凡永远自在发光🎶";
const LFID = "1076035599239416";
const CHECK_URL_KEY = "weibo_daka_check_url";
const CHECK_HEADERS_KEY = "weibo_daka_check_headers";
const PIC_FID_KEY = "weibo_daka_pic_fid";
const PIC_MD5_KEY = "weibo_daka_pic_md5";
const COPY_KEY = "weibo_daka_copy";

function read(key) {
  const v = $persistentStore.read(key);
  return v === null || v === undefined ? "" : v;
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
// 从打卡检查链接里取出通用参数（aid、gsid、s、ua 等），去掉 cardid/request_url，刷新 ul_ctime
function commonParams(checkUrl) {
  const q = checkUrl.split("?")[1] || "";
  const p = parseQuery(q);
  delete p.cardid;
  delete p.request_url;
  p.ul_ctime = String(Date.now());
  return p;
}
function get(url, headers, cb) {
  $httpClient.get({ url: url, headers: headers }, function (error, response, data) {
    cb(error, response, data);
  });
}
function postForm(url, headers, body, cb) {
  const h = Object.assign({}, headers);
  h["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
  $httpClient.post({ url: url, headers: h, body: body }, function (error, response, data) {
    cb(error, response, data);
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

const checkUrl = read(CHECK_URL_KEY);
const checkHeadersRaw = read(CHECK_HEADERS_KEY);
const picFid = read(PIC_FID_KEY);
const picMd5 = read(PIC_MD5_KEY);
const copy = read(COPY_KEY) || DEFAULT_COPY;

if (!checkUrl || !checkHeadersRaw || !picFid || !picMd5) {
  $notification.post("微博超话打卡", "还没抓取到打卡信息", "先装抓取插件，在微博 App 里点一次打卡（用每天要发的那张照片发一次）");
  $done({});
} else {
  let headers = {};
  try { headers = JSON.parse(checkHeadersRaw); } catch (e) { headers = {}; }
  const common = commonParams(checkUrl);
  const apiBase = "https://api.weibo.cn";

  // 1) 签到：/2/page/button?request_url=...active_checkin...
  const checkinInner = "http://i.chaohua.weibo.com/mobile/shproxy/active_checkin?in_page=1&lfid=" + LFID + "&moment=&moment_date=&pageid=" + PAGE_ID + "&scene_id=page_header_checkin&sg_tab_config=2&sg_widget_state=0";
  const checkinUrl = apiBase + "/2/page/button?" + encodeQuery(common) + "&request_url=" + encodeURIComponent(checkinInner);
  get(checkinUrl, headers, function (err1, resp1, data1) {
    let signResult = "签到：" + (err1 ? ("失败 " + err1) : shortMsg(data1));
    // 2) 打卡：先重放打卡检查，拿当天的文案模板（DayN）和新的 callback_url
    const freshCheckUrl = checkUrl.replace(/ul_ctime=\d+/, "ul_ctime=" + Date.now());
    get(freshCheckUrl, headers, function (err2, resp2, data2) {
      if (err2 || !data2) {
        $notification.post("微博超话打卡", signResult, "打卡检查失败：" + (err2 || "无返回"));
        $done({});
        return;
      }
      let scheme = "";
      try { scheme = JSON.parse(data2).scheme || ""; } catch (e) { scheme = ""; }
      if (!scheme) {
        $notification.post("微博超话打卡", signResult, "打卡检查失败：没拿到发帖模板");
        $done({});
        return;
      }
      const sq = scheme.split("?")[1] || "";
      const sp = parseQuery(sq);
      const template = sp.content || "";
      const callbackUrl = sp.callback_url || "";
      if (!template || !callbackUrl) {
        $notification.post("微博超话打卡", signResult, "打卡检查失败：模板不完整");
        $done({});
        return;
      }
      const dayM = template.match(/Day(\d+)/);
      const day = dayM ? dayM[1] : "?";
      const finalContent = template.replace(/\s+$/, "") + "\n" + copy;
      const mediaJson = JSON.stringify([{"filterMethod":1,"bypass":"unistore.image","createtype":"other","pic_source":0,"encrypted":false,"fid":picFid,"type":"pic","picStatus":0,"isScreenshot":0,"pic_raw_md5":picMd5}]);
      const superEx = JSON.stringify({"keep_activityid":3691,"system_pic_only":1});
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
        "super_raw_data": JSON.stringify({"chaohua_activity_type":"keep_activity","activity_id":ACTIVITY_ID}),
        "sync_mblog": "1",
        "topic_id": "1022:" + PAGE_ID,
        "uicode": "10000708",
        "user_input": "1"
      };
      const sendUrl = apiBase + "/2/statuses/send?" + encodeQuery(common);
      postForm(sendUrl, headers, encodeQuery(body), function (err3, resp3, data3) {
        if (err3 || !data3) {
          $notification.post("微博超话打卡", signResult, "打卡发帖失败：" + (err3 || "无返回"));
        } else {
          let ok = false;
          let postId = "";
          try {
            const o = JSON.parse(data3);
            if (o.idstr) { ok = true; postId = o.idstr; }
          } catch (e) {}
          if (ok) {
            $notification.post("微博超话打卡", signResult + " | 打卡成功 Day" + day, "帖子已发出");
          } else {
            $notification.post("微博超话打卡", signResult, "打卡发帖失败：" + shortMsg(data3));
          }
        }
        $done({});
      });
    });
  });
}
