/********************************
哔哩哔哩漫画积分商城自动抢购脚本

默认兑换积分商城中的"【超特惠】限量-0点秒杀"
兑换数量为用户积分可兑换的最大值 (可于BoxJs内修改)
默认执行时间为：每周日、每周一的凌晨 0:00:00 - 0:00:30 之间每秒执行一次

该脚本需要使用签到脚本获取Cookie后方可使用，支持多账号。

// 作者：許諾
更新时间：2025/12/19
平台兼容：Surge / QuantumultX / Loon / Stash

*********************************
Surge(iOS 5.9.0+/macOS 5.5.0+)模块：
*********************************


*********************************
QuantumultX 任务仓库(Gallery)订阅：
*********************************

工具&分析->HTTP请求->右上角添加任务仓库->选择相关脚本添加定时任务和附加组件

或者添加QuantumultX配置:
[task_local]
0-59 0 0 * * 0-1 * * * https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/bilimangapoints/ExchangePoints.js, tag=哔哩哔哩漫画抢券, enabled=true

*********************************/

const $ = new Env('BILI_COMICS_CHECKIN');
const barkKey = $.isNode() && process.env['BM_BARK_KEY'] || '';
const notifyMsg = [];

!(async () => {
  $.logLevel = $.getdata(`@${$.name}.Debug`) == 'true' && 'debug' || 'info';
  const args = argsList(typeof $argument == "string" && $argument || '');
  const user = JSON.parse($.getdata($.name) || ($.isNode() && process.env[$.name]) || '{}');
  const userNum = Object.keys(user.account || {}).length;
  const todayFlag = getTodayFlag();
  // 读取配置参数
  const productName = args.ProductName || user.ProductName || '【超特惠】限量-0点秒杀';
  const productNum = args.ProductNum || parseInt(user.ProductNum) || 0;
  const exchangeNum = args.ExchangeNum || parseInt(user.ExchangeNum) || 100;
  if (userNum) {
    for (const i in user.account) {
      // 检查今日是否已抢购成功
      if (user.account[i].lastSuccessDate === todayFlag) {
        const text = `账号(${i})今日已抢购成功，跳过执行`;
        $.info(text);
        continue
      }
      // 检查今日是否已标记积分不足
      if (user.account[i].lastInsufficientDate === todayFlag) {
        const text = `账号(${i})今日积分不足，跳过执行`;
        $.info(text);
        continue
      }
      const accountPrefix = userNum > 1 ? `[账号(${i})]` : '';
      try {
        const result = await ExchangeForAccount(user.account[i], productName, productNum, exchangeNum);
        const text = accountPrefix ? `${accountPrefix} ${result.message}` : result.message;
        $.info(text);
        // 只有抢购成功时才加入通知消息并标记成功
        if (result.success) {
          notifyMsg.push(text);
          user.account[i].lastSuccessDate = todayFlag;
          // 清除积分不足标记
          delete user.account[i].lastInsufficientDate;
          $.setjson(user, $.name);
          $.info(`账号 ${i} 已标记今日抢购成功`);
        }
        // 如果是积分不足（非异常情况），标记今日积分不足
        else if (result.insufficient) {
          user.account[i].lastInsufficientDate = todayFlag;
          $.setjson(user, $.name);
          $.info(`账号 ${i} 已标记今日积分不足`);
        }
      } catch (err) {
        const text = `${accountPrefix} 抢购错误: ${err.message}`;
        $.error(text);
        notifyMsg.push(text);
      }
    }
  } else {
    notifyMsg.push(`抢购Cookie失效/未获取 ⚠️`);
  }
})()
  .catch((err) => notifyMsg.push(`错误: ${err}`) && $.error(err))
  .finally(async () => {
    if (notifyMsg.length) {
      if (barkKey) {
        await BarkNotify($, barkKey, `哔哩哔哩漫画抢券`, notifyMsg.join('\n'));
      }
      $.msg(`哔哩哔哩漫画抢券`, ``, notifyMsg.join('\n'));
    }
    $.done({});
  });

async function ExchangeForAccount(account, productName, productNum, exchangeNum) {
  // 先只查询商品信息（不查询积分）
  const productList = await ListProduct(account);

  // 查找目标商品
  const product = productList.find(t => t.title == productName);
  if (!product) {
    return { success: false, insufficient: false, message: `查询商品失败: 未找到"${productName}"` };
  }

  // 先检查商品库存，如果库存为0则直接返回，不查询积分
  if (!product.remain_amount) {
    $.info(`查询商品: ${productName}, 库存: 0`);
    return { success: false, insufficient: false, message: `抢购终止: 商品库存为0` };
  }

  // 库存充足时才查询积分
  const userPoint = await GetUserPoint(account);
  $.info(`查询商品: ${productName}, 库存: ${product.remain_amount}, 当前积分: ${userPoint}`);

  // 检查积分是否足够
  if (userPoint < product.real_cost) {
    return { 
      success: false, 
      insufficient: true, 
      message: `抢购终止: 积分不足 (需要${product.real_cost}, 当前${userPoint})` 
    };
  }

  // 计算兑换数量
  const num = productNum > 0 ? Math.min(productNum, Math.floor(userPoint / product.real_cost)) : Math.floor(userPoint / product.real_cost);

  if (num <= 0) {
    return { 
      success: false, 
      insufficient: true, 
      message: `抢购终止: 积分不足以兑换` 
    };
  }

  // 开始抢购
  for (let i = 0; i < exchangeNum; i++) {
    const result = await StartExchange(account, product, num, i);
    if (result.success) {
      return { 
        success: true, 
        insufficient: false, 
        message: `抢购成功: 第${i + 1}次, 数量: ${num}, 消耗积分: ${num * product.real_cost}` 
      };
    }
    if (i === exchangeNum - 1) {
      return { 
        success: false, 
        insufficient: false, 
        message: `抢购失败: 已尝试${exchangeNum}次 (${result.message})` 
      };
    }
  }
}

function GetUserPoint(account) {
  const opts = {
    url: 'https://manga.bilibili.com/twirp/pointshop.v1.Pointshop/GetUserPoint',
    headers: {
      "User-Agent": "comic-universal/3412 CFNetwork/1410.0.3 Darwin/22.6.0 os/ios model/iPhone 12 mobi_app/iphone_comic build/3412 osVer/16.6 network/2 channel/AppStore",
      "Cookie": account.cookie
    },
    throwHttpErrors: false
  };

  $.debug(`Send GetUserPoint request:`, $.toStr(opts, null, null, 1));

  return $.http.post(opts)
    .then((resp) => {
      $.debug(`Receive GetUserPoint response:`, $.toStr(resp, null, null, 1));
      const body = JSON.parse(resp.body?.startsWith('{') && resp.body || '{}');
      if (body.code == 0 && body.data) {
        return parseInt(body.data.point);
      } else {
        throw new Error(body.msg || '查询积分失败');
      }
    })
    .catch((err) => {
      $.error(`GetUserPoint error:`, err);
      throw err;
    });
}

function ListProduct(account) {
  const opts = {
    url: 'https://manga.bilibili.com/twirp/pointshop.v1.Pointshop/ListProduct',
    headers: {
      "User-Agent": "comic-universal/3412 CFNetwork/1410.0.3 Darwin/22.6.0 os/ios model/iPhone 12 mobi_app/iphone_comic build/3412 osVer/16.6 network/2 channel/AppStore"
    },
    throwHttpErrors: false
  };

  $.debug(`Send ListProduct request:`, $.toStr(opts, null, null, 1));

  return $.http.post(opts)
    .then((resp) => {
      $.debug(`Receive ListProduct response:`, $.toStr(resp, null, null, 1));
      const body = JSON.parse(resp.body?.startsWith('{') && resp.body || '{}');
      if (body.code == 0 && body.data && body.data.length >= 1) {
        return body.data;
      } else {
        throw new Error(body.msg || '查询商品列表失败');
      }
    })
    .catch((err) => {
      $.error(`ListProduct error:`, err);
      throw err;
    });
}

function StartExchange(account, product, num, attempt) {
  const opts = {
    url: 'https://manga.bilibili.com/twirp/pointshop.v1.Pointshop/Exchange',
    headers: {
      "User-Agent": "comic-universal/3412 CFNetwork/1410.0.3 Darwin/22.6.0 os/ios model/iPhone 12 mobi_app/iphone_comic build/3412 osVer/16.6 network/2 channel/AppStore",
      "Content-Type": "application/json",
      "Cookie": account.cookie
    },
    body: JSON.stringify({
      product_id: product.id,
      product_num: num,
      point: num * product.real_cost
    }),
    throwHttpErrors: false
  };

  $.debug(`Send Exchange request (attempt ${attempt + 1}):`, $.toStr(opts, null, null, 1));

  return $.http.post(opts)
    .then((resp) => {
      $.debug(`Receive Exchange response (attempt ${attempt + 1}):`, $.toStr(resp, null, null, 1));
      const body = JSON.parse(resp.body?.startsWith('{') && resp.body || '{}');
      if (body.code == 0) {
        return { success: true, message: '兑换成功' };
      } else {
        return { success: false, message: body.msg || '未知错误' };
      }
    })
    .catch((err) => {
      $.error(`Exchange error (attempt ${attempt + 1}):`, err);
      return { success: false, message: err.message || '请求失败' };
    });
}

function getTodayFlag() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function argsList(data) {
  return Array.from(
    data.split("&")
      .map((i) => i.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  )
    .reduce((a, [k, v]) => Object.assign(a, { [k]: v }), {})
}

//Bark APP notify
async function BarkNotify(c, k, t, b) { for (let i = 0; i < 3; i++) { c.log(`🔷Bark notify >> Start push (${i + 1})`); const s = await new Promise((n) => { c.post({ url: 'https://api.day.app/push', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, body: b, device_key: k, ext_params: { group: t } }) }, (e, r, d) => r && r.status == 200 ? n(1) : n(d || e)) }); if (s === 1) { c.log('✅Push success!'); break } else { c.log(`❌Push failed! >> ${s.message || s}`) } } };

// https://github.com/chavyleung/scripts/blob/master/Env.min.js
function Env(e, t) { class s { constructor(e) { this.env = e } send(e, t = "GET") { e = "string" == typeof e ? { url: e } : e; let s = this.get; "POST" === t && (s = this.post); const i = new Promise(((t, i) => { s.call(this, e, ((e, s, o) => { e ? i(e) : t(s) })) })); return e.timeout ? ((e, t = 1e3) => Promise.race([e, new Promise(((e, s) => { setTimeout((() => { s(new Error("请求超时")) }), t) }))]))(i, e.timeout) : i } get(e) { return this.send.call(this.env, e) } post(e) { return this.send.call(this.env, e, "POST") } } return new class { constructor(e, t) { this.logLevels = { debug: 0, info: 1, warn: 2, error: 3 }, this.logLevelPrefixs = { debug: "[DEBUG] ", info: "[INFO] ", warn: "[WARN] ", error: "[ERROR] " }, this.logLevel = "info", this.name = e, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, t) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(e, t = null) { try { return JSON.parse(e) } catch { return t } } toStr(e, t = null, ...s) { try { return JSON.stringify(e, ...s) } catch { return t } } getjson(e, t) { let s = t; if (this.getdata(e)) try { s = JSON.parse(this.getdata(e)) } catch { } return s } setjson(e, t) { try { return this.setdata(JSON.stringify(e), t) } catch { return !1 } } getScript(e) { return new Promise((t => { this.get({ url: e }, ((e, s, i) => t(i))) })) } runScript(e, t) { return new Promise((s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let o = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); o = o ? 1 * o : 20, o = t && t.timeout ? t.timeout : o; const [r, a] = i.split("@"), n = { url: `http://${a}/v1/scripting/evaluate`, body: { script_text: e, mock_type: "cron", timeout: o }, headers: { "X-Key": r, Accept: "*/*" }, policy: "DIRECT", timeout: o }; this.post(n, ((e, t, i) => s(i))) })).catch((e => this.logErr(e))) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const e = this.path.resolve(this.dataFile), t = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(e), i = !s && this.fs.existsSync(t); if (!s && !i) return {}; { const i = s ? e : t; try { return JSON.parse(this.fs.readFileSync(i)) } catch (e) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const e = this.path.resolve(this.dataFile), t = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(e), i = !s && this.fs.existsSync(t), o = JSON.stringify(this.data); s ? this.fs.writeFileSync(e, o) : i ? this.fs.writeFileSync(t, o) : this.fs.writeFileSync(e, o) } } lodash_get(e, t, s) { const i = t.replace(/\[(\d+)\]/g, ".$1").split("."); let o = e; for (const e of i) if (o = Object(o)[e], void 0 === o) return s; return o } lodash_set(e, t, s) { return Object(e) !== e || (Array.isArray(t) || (t = t.toString().match(/[^.[\]]+/g) || []), t.slice(0, -1).reduce(((e, s, i) => Object(e[s]) === e[s] ? e[s] : e[s] = Math.abs(t[i + 1]) >> 0 == +t[i + 1] ? [] : {}), e)[t[t.length - 1]] = s), e } getdata(e) { let t = this.getval(e); if (/^@/.test(e)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(e), o = s ? this.getval(s) : ""; if (o) try { const e = JSON.parse(o); t = e ? this.lodash_get(e, i, "") : t } catch (e) { t = "" } } return t } setdata(e, t) { let s = !1; if (/^@/.test(t)) { const [, i, o] = /^@(.*?)\.(.*?)$/.exec(t), r = this.getval(i), a = i ? "null" === r ? null : r || "{}" : "{}"; try { const t = JSON.parse(a); this.lodash_set(t, o, e), s = this.setval(JSON.stringify(t), i) } catch (t) { const r = {}; this.lodash_set(r, o, e), s = this.setval(JSON.stringify(r), i) } } else s = this.setval(e, t); return s } getval(e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(e); case "Quantumult X": return $prefs.valueForKey(e); case "Node.js": return this.data = this.loaddata(), this.data[e]; default: return this.data && this.data[e] || null } } setval(e, t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(e, t); case "Quantumult X": return $prefs.setValueForKey(e, t); case "Node.js": return this.data = this.loaddata(), this.data[t] = e, this.writedata(), !0; default: return this.data && this.data[t] || null } } initGotEnv(e) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, e && (e.headers = e.headers ? e.headers : {}, e && (e.headers = e.headers ? e.headers : {}, void 0 === e.headers.cookie && void 0 === e.headers.Cookie && void 0 === e.cookieJar && (e.cookieJar = this.ckjar))) } get(e, t = (() => { })) { switch (e.headers && (delete e.headers["Content-Type"], delete e.headers["Content-Length"], delete e.headers["content-type"], delete e.headers["content-length"]), e.params && (e.url += "?" + this.queryStr(e.params)), void 0 === e.followRedirect || e.followRedirect || ((this.isSurge() || this.isLoon()) && (e["auto-redirect"] = !1), this.isQuanX() && (e.opts ? e.opts.redirection = !1 : e.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (e.headers = e.headers || {}, Object.assign(e.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(e, ((e, s, i) => { !e && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), t(e, s, i) })); break; case "Quantumult X": this.isNeedRewrite && (e.opts = e.opts || {}, Object.assign(e.opts, { hints: !1 })), $task.fetch(e).then((e => { const { statusCode: s, statusCode: i, headers: o, body: r, bodyBytes: a } = e; t(null, { status: s, statusCode: i, headers: o, body: r, bodyBytes: a }, r, a) }), (e => t(e && e.error || "UndefinedError"))); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(e), this.got(e).on("redirect", ((e, t) => { try { if (e.headers["set-cookie"]) { const s = e.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), t.cookieJar = this.ckjar } } catch (e) { this.logErr(e) } })).then((e => { const { statusCode: i, statusCode: o, headers: r, rawBody: a } = e, n = s.decode(a, this.encoding); t(null, { status: i, statusCode: o, headers: r, rawBody: a, body: n }, n) }), (e => { const { message: i, response: o } = e; t(i, o, o && s.decode(o.rawBody, this.encoding)) })); break } } post(e, t = (() => { })) { const s = e.method ? e.method.toLocaleLowerCase() : "post"; switch (e.body && e.headers && !e.headers["Content-Type"] && !e.headers["content-type"] && (e.headers["content-type"] = "application/x-www-form-urlencoded"), e.headers && (delete e.headers["Content-Length"], delete e.headers["content-length"]), void 0 === e.followRedirect || e.followRedirect || ((this.isSurge() || this.isLoon()) && (e["auto-redirect"] = !1), this.isQuanX() && (e.opts ? e.opts.redirection = !1 : e.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (e.headers = e.headers || {}, Object.assign(e.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](e, ((e, s, i) => { !e && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), t(e, s, i) })); break; case "Quantumult X": e.method = s, this.isNeedRewrite && (e.opts = e.opts || {}, Object.assign(e.opts, { hints: !1 })), $task.fetch(e).then((e => { const { statusCode: s, statusCode: i, headers: o, body: r, bodyBytes: a } = e; t(null, { status: s, statusCode: i, headers: o, body: r, bodyBytes: a }, r, a) }), (e => t(e && e.error || "UndefinedError"))); break; case "Node.js": let i = require("iconv-lite"); this.initGotEnv(e); const { url: o, ...r } = e; this.got[s](o, r).then((e => { const { statusCode: s, statusCode: o, headers: r, rawBody: a } = e, n = i.decode(a, this.encoding); t(null, { status: s, statusCode: o, headers: r, rawBody: a, body: n }, n) }), (e => { const { message: s, response: o } = e; t(s, o, o && i.decode(o.rawBody, this.encoding)) })); break } } time(e, t = null) { const s = t ? new Date(t) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(e) && (e = e.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let t in i) new RegExp("(" + t + ")").test(e) && (e = e.replace(RegExp.$1, 1 == RegExp.$1.length ? i[t] : ("00" + i[t]).substr(("" + i[t]).length))); return e } queryStr(e) { let t = ""; for (const s in e) { let i = e[s]; null != i && "" !== i && ("object" == typeof i && (i = JSON.stringify(i)), t += `${s}=${i}&`) } return t = t.substring(0, t.length - 1), t } msg(t = e, s = "", i = "", o = {}) { const r = e => { const { $open: t, $copy: s, $media: i, $mediaMime: o } = e; switch (typeof e) { case void 0: return e; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: e }; case "Loon": case "Shadowrocket": return e; case "Quantumult X": return { "open-url": e }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { const r = {}; let a = e.openUrl || e.url || e["open-url"] || t; a && Object.assign(r, { action: "open-url", url: a }); let n = e["update-pasteboard"] || e.updatePasteboard || s; n && Object.assign(r, { action: "clipboard", text: n }); let h = e.mediaUrl || e["media-url"] || i; if (h) { let e, t; if (h.startsWith("http")); else if (h.startsWith("data:")) { const [s] = h.split(";"), [, i] = h.split(","); e = i, t = s.replace("data:", "") } else { e = h, t = (e => { const t = { JVBERi0: "application/pdf", R0lGODdh: "image/gif", R0lGODlh: "image/gif", iVBORw0KGgo: "image/png", "/9j/": "image/jpg" }; for (var s in t) if (0 === e.indexOf(s)) return t[s]; return null })(h) } Object.assign(r, { "media-url": h, "media-base64": e, "media-base64-mime": o ?? t }) } return Object.assign(r, { "auto-dismiss": e["auto-dismiss"], sound: e.sound }), r } case "Loon": { const s = {}; let o = e.openUrl || e.url || e["open-url"] || t; o && Object.assign(s, { openUrl: o }); let r = e.mediaUrl || e["media-url"] || i; return r && Object.assign(s, { mediaUrl: r }), console.log(JSON.stringify(s)), s } case "Quantumult X": { const o = {}; let r = e["open-url"] || e.url || e.openUrl || t; r && Object.assign(o, { "open-url": r }); let a = e.mediaUrl || e["media-url"] || i; a && Object.assign(o, { "media-url": a }); let n = e["update-pasteboard"] || e.updatePasteboard || s; return n && Object.assign(o, { "update-pasteboard": n }), console.log(JSON.stringify(o)), o } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(t, s, i, r(o)); break; case "Quantumult X": $notify(t, s, i, r(o)); break; case "Node.js": break }if (!this.isMuteLog) { let e = ["", "============================"]; e.push(t), s && e.push(s), i && e.push(i), console.log(e.join("\n")), this.logs = this.logs.concat(e) } } debug(...e) { this.logLevels[this.logLevel] <= this.logLevels.debug && (e.length > 0 && (this.logs = [...this.logs, ...e]), console.log(`${this.logLevelPrefixs.debug}${e.map((e => e ?? String(e))).join(this.logSeparator)}`)) } info(...e) { this.logLevels[this.logLevel] <= this.logLevels.info && (e.length > 0 && (this.logs = [...this.logs, ...e]), console.log(`${this.logLevelPrefixs.info}${e.map((e => e ?? String(e))).join(this.logSeparator)}`)) } warn(...e) { this.logLevels[this.logLevel] <= this.logLevels.warn && (e.length > 0 && (this.logs = [...this.logs, ...e]), console.log(`${this.logLevelPrefixs.warn}${e.map((e => e ?? String(e))).join(this.logSeparator)}`)) } error(...e) { this.logLevels[this.logLevel] <= this.logLevels.error && (e.length > 0 && (this.logs = [...this.logs, ...e]), console.log(`${this.logLevelPrefixs.error}${e.map((e => e ?? String(e))).join(this.logSeparator)}`)) } log(...e) { e.length > 0 && (this.logs = [...this.logs, ...e]), console.log(e.map((e => e ?? String(e))).join(this.logSeparator)) } logErr(e, t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, t, e); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, t, void 0 !== e.message ? e.message : e, e.stack); break } } wait(e) { return new Promise((t => setTimeout(t, e))) } done(e = {}) { const t = ((new Date).getTime() - this.startTime) / 1e3; switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(e); break; case "Node.js": process.exit(1) } } }(e, t) }
