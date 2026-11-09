// 作者：許諾
/*
脚本名称：唐机豆豆
活动入口：唐机豆豆小程序-会员中心-签到
环境变量：tjdd_data（Node环境，多账号以@隔开）
使用说明：添加重写规则并打开唐机豆豆小程序即可获取Token
更新时间：2024-12-23

================ Surge 配置 ================
[MITM]
hostname = %APPEND% h5.youzan.com

[Script]
唐机豆豆Cookie = type=http-request,pattern=^https:\/\/h5\.youzan\.com\/wscshop\/weappp\/shop_business_hour\.json,script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/tjdd/tjdd.js

唐机豆豆 = type=cron, cronexp=15 9 * * *, timeout=60, script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/tjdd/tjdd.js

============ Quantumult X 配置 =============
[MITM]
hostname = h5.youzan.com

[rewrite_local]
^https:\/\/h5\.youzan\.com\/wscshop\/weappp\/shop_business_hour\.json url script-request-header https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/tjdd/tjdd.js

[task_local]
15 9 * * * https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/tjdd/tjdd.js, tag=唐机豆豆, enabled=true

================ Loon 配置 ================
[MITM]
hostname = h5.youzan.com

cron "15 9 * * *" script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/tjdd/tjdd.js, tag=唐机豆豆

http-request ^https:\/\/h5\.youzan\.com\/wscshop\/weappp\/shop_business_hour\.json script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/tjdd/tjdd.js, tag=唐机豆豆Cookie

================ Boxjs订阅 ================
*/

const $ = new Env('唐机豆豆');
const notify = $.isNode() ? require('./sendNotify') : '';
const KEY_TJDD_DATA = 'tjdd_data';  // 存储抓取到的 URL 数据
let message = '';  // 用于存储消息通知内容

// 判断运行环境
if (typeof $request !== 'undefined') {
    captureRequestURL();  // 抓取 URL 数据
    $.done();
} else {
    main();  // 进入主流程
}

// 主流程函数
async function main() {
    const requestData = loadRequestData();
    if (!requestData) {
        return $.msg($.name, '【提示】未找到有效的请求数据', '请先完成抓取或配置环境变量。');
    }

    await processMultipleAccounts(requestData);

    if (message) {
        sendNotification(message);
    }
}

// 发送通知
function sendNotification(content) {
    if ($.isNode() && notify) {
        notify.sendNotify($.name, content);  // Node 环境发送通知
    } else {
        $.msg($.name, '', content);  // 非 Node 环境直接使用 $.msg
    }
}

// 加载存储的 URL 数据
function loadRequestData() {
    const data = $.getdata(KEY_TJDD_DATA) || ($.isNode() ? process.env.tjdd_data : '');
    return data || null;
}

// 执行多个账号签到任务
async function processMultipleAccounts(data) {
    const accounts = data.split('@');  // 按 @ 分隔多个账号
    for (let i = 0; i < accounts.length; i++) {
        const accountData = accounts[i].trim();
        if (accountData) {
            console.log(`\n============= 执行账号 ${i + 1} =============`);
            await processSingleAccount(i + 1, accountData);
        }
    }
}

// 执行单个账号的签到任务
async function processSingleAccount(accountNumber, data) {
    const accountMessage = [];

    // 从 data 中提取 access_token、sid 和 uuid
    const [accessToken, sid, uuid] = data.split('&');  // 使用 destructuring 来简化提取

    try {
        const signInResult = await signInRequest(accessToken, sid, uuid);

        if (signInResult.code === 0) {
            // 处理签到成功的情况
            const awardInfo = signInResult.data.list && signInResult.data.list[0]?.infos?.title 
                ? signInResult.data.list[0].infos.title 
                : "未提供积分信息";
            accountMessage.push(`🎉 签到成功: ${awardInfo}`);
        } else if (signInResult.code === 1000030071) {
            // 处理已达最大参与次数的情况
            accountMessage.push(`❌ 已签到: ${signInResult.msg}`);
        } else {
            // 处理其他错误
            accountMessage.push(`❌ 签到失败: ${signInResult.msg}`);
        }
        console.log(`账号 ${accountNumber}:\n${accountMessage.join('\n')}`);
    } catch (error) {
        accountMessage.push(`❌ 执行失败: ${error.message}`);
    } finally {
        message += `账号 ${accountNumber}\n${accountMessage.join('\n')}\n\n`;
    }
}

// 抓取并存储 URL 数据
function captureRequestURL() {
    let savedData = $.getdata(KEY_TJDD_DATA) || '';
    const url = $request.url;  // 获取当前请求的 URL
    const headers = $request.headers;  // 获取请求头

    console.log('请求头:', JSON.stringify(headers));  // 调试：打印请求头

    // 从 URL 中提取 access_token
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const accessToken = urlParams.get('access_token');  // 获取 access_token

    // 从请求头中提取 extra-data
    const extraData = headers['extra-data'] || headers['Extra-Data'];  // 根据实际情况，尝试不同的键名
    if (extraData) {
        try {
            const parsedExtraData = JSON.parse(extraData);
            const sid = parsedExtraData.sid;
            const uuid = parsedExtraData.uuid;

            // 存储 sid 和 uuid
            $.setdata(sid, 'sid');
            $.setdata(uuid, 'uuid');
        } catch (error) {
            console.error('❌ 解析 Extra-Data 错误:', error);
            $.msg($.name, '【错误】解析 Extra-Data 错误', '请确保请求头中的 Extra-Data 格式正确');
            return;
        }
    } else {
        console.error('❌ 未找到 Extra-Data 请求头');
        $.msg($.name, '【错误】未找到 Extra-Data 请求头', '请确保请求头包含正确的 Extra-Data');
        return;
    }

    if (accessToken) {
        // 合并 access_token、sid 和 uuid，用 & 分隔
        const sid = $.getdata('sid');
        const uuid = $.getdata('uuid');
        const accountData = `${accessToken}&${sid}&${uuid}`;

        // 计算当前账号的数量
        const accountCount = savedData.split('@').length;

        // 更新存储数据，避免重复存储
        savedData = savedData.split('@').includes(accountData) 
            ? savedData  // 如果已存在该 token，则不添加
            : savedData ? `${savedData}@${accountData}` : accountData;

        $.setdata(savedData, KEY_TJDD_DATA);  // 更新存储数据
        $.msg($.name, '', `账号 ${accountCount} 🎉 数据已抓取并保存`);
    } else {
        console.error('❌ 缺少 access_token');
        $.msg($.name, '【错误】缺少必要的参数', '无法抓取有效的数据');
    }
}

// 发起签到请求
function signInRequest(accessToken, sid, uuid) {
    if (!sid || !uuid) {
        console.error('❌ sid 或 uuid 不存在');
        return Promise.reject(new Error('缺少 sid 或 uuid'));
    }

    // 构建 extraData
    const extraData = JSON.stringify({
        is_weapp: 1,
        sid: sid,
        version: '2.164.10.101',
        client: 'weapp',
        bizEnv: 'wsc',
        uuid: uuid,
        ftime: Date.now(),
    });

    const signInOptions = {
        url: `https://h5.youzan.com/wscump/checkin/checkinV2.json?checkinId=1997&access_token=${accessToken}`,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.54(0x18003631) NetType/4G Language/zh_CN',
            'Extra-Data': extraData,
        },
    };

    return new Promise((resolve, reject) => {
        $.get(signInOptions, (err, resp, data) => {
            if (err) {
                console.error(`❌ 签到请求失败: ${err}`);
                reject(err);
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    console.warn('❌ 签到响应解析失败:', error);
                    reject(new Error(`签到请求解析失败: ${data}`));
                }
            }
        });
    });
}

function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; "POST" === e && (s = this.post); const i = new Promise(((e, i) => { s.call(this, t, ((t, s, o) => { t ? i(t) : e(s) })) })); return t.timeout ? ((t, e = 1e3) => Promise.race([t, new Promise(((t, s) => { setTimeout((() => { s(new Error("请求超时")) }), e) }))]))(i, t.timeout) : i } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.logLevels = { debug: 0, info: 1, warn: 2, error: 3 }, this.logLevelPrefixs = { debug: "[DEBUG] ", info: "[INFO] ", warn: "[WARN] ", error: "[ERROR] " }, this.logLevel = "info", this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null, ...s) { try { return JSON.stringify(t, ...s) } catch { return e } } getjson(t, e) { let s = e; if (this.getdata(t)) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise((e => { this.get({ url: t }, ((t, s, i) => e(i))) })) } runScript(t, e) { return new Promise((s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let o = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); o = o ? 1 * o : 20, o = e && e.timeout ? e.timeout : o; const [r, a] = i.split("@"), n = { url: `http://${a}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: o }, headers: { "X-Key": r, Accept: "*/*" }, policy: "DIRECT", timeout: o }; this.post(n, ((t, e, i) => s(i))) })).catch((t => this.logErr(t))) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), o = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, o) : i ? this.fs.writeFileSync(e, o) : this.fs.writeFileSync(t, o) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let o = t; for (const t of i) if (o = Object(o)[t], void 0 === o) return s; return o } lodash_set(t, e, s) { return Object(t) !== t || (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce(((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}), t)[e[e.length - 1]] = s), t } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), o = s ? this.getval(s) : ""; if (o) try { const t = JSON.parse(o); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, o] = /^@(.*?)\.(.*?)$/.exec(e), r = this.getval(i), a = i ? "null" === r ? null : r || "{}" : "{}"; try { const e = JSON.parse(a); this.lodash_set(e, o, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const r = {}; this.lodash_set(r, o, t), s = this.setval(JSON.stringify(r), i) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.cookie && void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, ((t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) })); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: i, headers: o, body: r, bodyBytes: a } = t; e(null, { status: s, statusCode: i, headers: o, body: r, bodyBytes: a }, r, a) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", ((t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } })).then((t => { const { statusCode: i, statusCode: o, headers: r, rawBody: a } = t, n = s.decode(a, this.encoding); e(null, { status: i, statusCode: o, headers: r, rawBody: a, body: n }, n) }), (t => { const { message: i, response: o } = t; e(i, o, o && s.decode(o.rawBody, this.encoding)) })); break } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, ((t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) })); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: i, headers: o, body: r, bodyBytes: a } = t; e(null, { status: s, statusCode: i, headers: o, body: r, bodyBytes: a }, r, a) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let i = require("iconv-lite"); this.initGotEnv(t); const { url: o, ...r } = t; this.got[s](o, r).then((t => { const { statusCode: s, statusCode: o, headers: r, rawBody: a } = t, n = i.decode(a, this.encoding); e(null, { status: s, statusCode: o, headers: r, rawBody: a, body: n }, n) }), (t => { const { message: s, response: o } = t; e(s, o, o && i.decode(o.rawBody, this.encoding)) })); break } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let i = t[s]; null != i && "" !== i && ("object" == typeof i && (i = JSON.stringify(i)), e += `${s}=${i}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", i = "", o = {}) { const r = t => { const { $open: e, $copy: s, $media: i, $mediaMime: o } = t; switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { const r = {}; let a = t.openUrl || t.url || t["open-url"] || e; a && Object.assign(r, { action: "open-url", url: a }); let n = t["update-pasteboard"] || t.updatePasteboard || s; if (n && Object.assign(r, { action: "clipboard", text: n }), i) { let t, e, s; if (i.startsWith("http")) t = i; else if (i.startsWith("data:")) { const [t] = i.split(";"), [, o] = i.split(","); e = o, s = t.replace("data:", "") } else { e = i, s = (t => { const e = { JVBERi0: "application/pdf", R0lGODdh: "image/gif", R0lGODlh: "image/gif", iVBORw0KGgo: "image/png", "/9j/": "image/jpg" }; for (var s in e) if (0 === t.indexOf(s)) return e[s]; return null })(i) } Object.assign(r, { "media-url": t, "media-base64": e, "media-base64-mime": o ?? s }) } return Object.assign(r, { "auto-dismiss": t["auto-dismiss"], sound: t.sound }), r } case "Loon": { const s = {}; let o = t.openUrl || t.url || t["open-url"] || e; o && Object.assign(s, { openUrl: o }); let r = t.mediaUrl || t["media-url"]; return i?.startsWith("http") && (r = i), r && Object.assign(s, { mediaUrl: r }), console.log(JSON.stringify(s)), s } case "Quantumult X": { const o = {}; let r = t["open-url"] || t.url || t.openUrl || e; r && Object.assign(o, { "open-url": r }); let a = t["media-url"] || t.mediaUrl; i?.startsWith("http") && (a = i), a && Object.assign(o, { "media-url": a }); let n = t["update-pasteboard"] || t.updatePasteboard || s; return n && Object.assign(o, { "update-pasteboard": n }), console.log(JSON.stringify(o)), o } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, i, r(o)); break; case "Quantumult X": $notify(e, s, i, r(o)); break; case "Node.js": break }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } debug(...t) { this.logLevels[this.logLevel] <= this.logLevels.debug && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.debug}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } info(...t) { this.logLevels[this.logLevel] <= this.logLevels.info && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.info}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } warn(...t) { this.logLevels[this.logLevel] <= this.logLevels.warn && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.warn}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } error(...t) { this.logLevels[this.logLevel] <= this.logLevels.error && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.error}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.map((t => t ?? String(t))).join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, e, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, e, void 0 !== t.message ? t.message : t, t.stack); break } } wait(t) { return new Promise((e => setTimeout(e, t))) } done(t = {}) { const e = ((new Date).getTime() - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }
