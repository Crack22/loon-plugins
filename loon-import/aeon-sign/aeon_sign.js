// 作者：許諾
/**
 * 脚本名称：永旺 Aeon - 签到
 * 活动规则：累计签到 x 天可获得奖励（优惠券）
 * 脚本说明：添加重写进入"永旺"小程序签到页面即可获取 Token（有效期28天，进入小程序失效），支持多账号，支持 NE / Node.js 环境。
 * 环境变量：AEON_DATA 或 CODESERVER_ADDRESS、CODESERVER_FUN
 * 更新时间：2024-04-11 更新活动 Code


------------------ Surge 配置 ------------------

[MITM]
hostname = api.aeonbuy.com

[Script]
永旺 Aeon² = type=http-response,pattern=https:\/\/api\.aeonbuy\.com\/api\/access-auth-api\/auth\/third\/silentWechatMiniLogin,requires-body=1,max-size=0,binary-body-mode=0,timeout=30,script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/aeon-sign/aeon_sign.js,script-update-interval=0

永旺 Aeon = type=cron,cronexp="20 8 * * *",timeout=60,script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/aeon-sign/aeon_sign.js,script-update-interval=0

------------------- Loon 配置 -------------------

[MITM]
hostname = api.aeonbuy.com

[Script]
http-response https:\/\/api\.aeonbuy\.com\/api\/access-auth-api\/auth\/third\/silentWechatMiniLogin tag=永旺 Aeon²,script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/aeon-sign/aeon_sign.js,requires-body=1

cron "20 8 * * *" script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/aeon-sign/aeon_sign.js,tag=永旺 Aeon,enable=true

--------------- Quantumult X 配置 ---------------

[MITM]
hostname = api.aeonbuy.com

[rewrite_local]
https:\/\/api\.aeonbuy\.com\/api\/access-auth-api\/auth\/third\/silentWechatMiniLogin url script-response-body https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/aeon-sign/aeon_sign.js

[task_local]
20 8 * * * https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/aeon-sign/aeon_sign.js, tag=永旺 Aeon, img-url=https://raw.githubusercontent.com/FoKit/Scripts/main/images/aeon.png, enabled=true

------------------ Stash 配置 ------------------

cron:
  script:
    - name: 永旺 Aeon
      cron: '20 8 * * *'
      timeout: 10

http:
  mitm:
    - "api.aeonbuy.com"
  script:
    - match: https:\/\/api\.aeonbuy\.com\/api\/access-auth-api\/auth\/third\/silentWechatMiniLogin
      name: 永旺 Aeon²
      type: response
      require-body: true

script-providers:
  永旺 Aeon:
    url: https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/aeon-sign/aeon_sign.js
    interval: 86400

 */

const $ = new Env('永旺 Aeon');
$.is_debug = getEnv('is_debug') || 'false';  // 调试模式
$.userInfo = getEnv('aeon_data') || '';  // 获取账号
$.userArr = $.toObj($.userInfo) || [];  // 用户信息
$.appid = 'wx55996449c48dd8c7';  // 小程序 appId
$.Messages = [];


// 主函数
async function main() {
  // 获取微信 Code
  await getWxCode();

  for (let i = 0; i < $.codeList.length; i++) {
    // 获取 Token
    await getToken($.codeList[i]);
  }

  if ($.userArr.length) {
    $.log(`\n🌀 找到 ${$.userArr.length} 个 Token 变量`);

    // 活动列表
    const actMap = [
      { "region": "活动A", "scene_code": "HU1iqY0O" },
    ];

    // 遍历账号
    for (let i = 0; i < $.userArr.length; i++) {
      $.log(`\n----- 账号 [${i + 1}] 开始执行 -----\n`);

      // 初始化
      $.is_login = true;
      $.beforeMsgs = '';
      $.messages = [];
      $.nickname = $.userArr[i]['nickname'];
      $.ticket = '';
      $.token = $.userArr[i]['token'];
      $.encodeId = '';

      // 获取 ticket
      await getTicket();

      // 判断登录状态
      if (!$.is_login) continue;

      // 第三方登录
      await thirdUserAuthorize();

      for (item of actMap) {
        // 每日签到
        $.encodeId && await sign(item['region'], item['scene_code']);
      }

      // 查询会员
      await queryMembers();

      // 合并通知
      $.messages.splice(0, 0, $.beforeMsgs), $.Messages = $.Messages.concat($.messages);
    }
    $.log(`\n----- 所有账号执行完成 -----\n`);
  } else {
    throw new Error('未找到 aeon_data 变量 ❌');
  }
}

// 获取 Token
async function getToken(code) {
  // 构造请求
  const options = {
    url: `https://api.aeonbuy.com/api/access-auth-api/auth/third/silentWechatMiniLogin`,
    headers: {
      'content-type': `application/json`,
      'x-http-channel': `mp`
    },
    body: $.toStr({
      wxCode: code
    })
  }

  // 发起请求
  const result = await Request(options);
  if (result?.code == 200 && result?.data) {
    const { mobile, token, memberId, nickname, storeCode } = result.data;
    if (mobile && token) {
      $.log(`✅ 成功获取 Token`);
      // 使用 find() 方法找到与 mobile 匹配的对象，以新增/更新用户 token
      const user = $.userArr.find(user => user.mobile === mobile);
      if (user) {
        if (user.token == token) return;
        $.log(`♻️ 更新用户 [${hideSensitiveData(mobile, 3, 4)}] Token: ${token}`);
        user.token = token;
      } else {
        $.log(`🆕 新增用户 [${hideSensitiveData(mobile, 3, 4)}] Token: ${token}`);
        $.userArr.push({ "mobile": mobile, "token": token, "nickname": nickname });
      }
      // 写入数据持久化
      $.setdata($.toStr($.userArr), 'aeon_data');
    }
  } else {
    $.log(`❌ 获取 Token 失败: ${$.toStr(result)}`);
  }
}

// 获取 ticket
async function getTicket() {
  // 构造请求
  const options = {
    url: `https://m.aeonbuy.com/api/access-auth-api/auth/ticket/generate`,
    headers: {
      'content-type': `application/json`,
      'x-http-token': $.token,
    },
    body: `{}`
  }

  // 发起请求
  const result = await Request(options);
  if (result?.code == 200 && result?.data?.ticket) {
    $.ticket = result.data.ticket;
    $.log(`✅ 成功获取 Ticket`);
  } else {
    $.is_login = false;  // Token 失效
    $.messages.push(`Token 已失效[${$.token}] ❌`);
    $.Messages = $.Messages.concat($.messages);
    $.log(`❌ 获取 Ticket 失败: ${$.toStr(result)}`);
  }
}

// 第三方登录
async function thirdUserAuthorize() {
  // 构造请求
  const options = {
    url: `https://aeon.eqxiu.cn/api/preview/authorize/thirdUserAuthorize`,
    params: {
      creationId: '239110',
      code: $.ticket + '__0031',
      stateEqs: encodeURIComponent(`https://api.aeonbuy.com/v/239110`),
      cc: '',
      storeCode: '',
      title: '',
      zoom: 1,
      shareUserId: '',
      ticket: $.ticket,
      from: 'decoration',
      type: 'thirdPartyLoadPage',
      showShareMenu: 'true'
    },
    followRedirect: false,
    _respType: 'all'
  }

  // 发起请求
  const result = await Request(options);
  if (result?.status == 302) {
    const headers = ObjectKeys2LowerCase(result.headers);
    const location = headers.location;
    $.encodeId = new URLSearchParams(new URL(location).search).get('encodeId');
    $.log(`✅ 成功获取 encodeId`);
  } else {
    $.log(`❌ 获取 encodeId 失败: ${$.toStr(result)}`);
  }
}


// 每日签到
async function sign(region, scene_code) {
  let msg = '';
  // 构造请求
  let opt = {
    url: `https://aeon.eqxiu.cn/api/preview/hd/sign`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: `code=${scene_code}&encodeId=${$.encodeId}`
  };

  // 发起请求
  var result = await Request(opt);
  if (result?.success == true) {
    $.beforeMsgs = `\n会员: ${$.nickname || hideSensitiveData(result?.obj?.nickName, 1, 0)}`;
    msg += `任务: [${region}]签到完成 🎉`;
  } else if (result?.msg) {
    msg += `任务: [${region}]签到失败, ${result?.msg} ❌`;
  } else {
    $.log(`任务: [${region}]签到失败, ${$.toStr(result)} ❌`);
  }
  $.messages.push(msg), $.log(msg);
}


// 查询会员
async function queryMembers() {
  // 构造请求
  let opt = {
    url: `https://m.aeonbuy.com/api/app-api/card/main/corporation/detail`,
    headers: {
      'content-type': 'application/json',
      'x-http-card-channel': `3`,
      'x-http-token': $.token
    },
    body: `{"appId":"wxbb1ffcc3c65f030f","corporationCode":""}`
  };

  // 发起请求
  var result = await Request(opt);
  if (result?.code == 200 && result?.data) {
    const { levelName, totalPoint, totalPointOrAmount, invaildPointList } = result.data;
    $.beforeMsgs += `  等级: ${levelName}\n积分: ${totalPoint}  消费: ${totalPointOrAmount} 元`;

    // 积分到期提醒
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    let date = year + '-' + (month < 10 ? '0' + month : month);
    for (item of invaildPointList) {
      if (item.invaildDate.includes(date)) {
        $.beforeMsgs += `今年到期积分: ${item.totalPointStr}`
      }
    }
  } else {
    $.log(`查询会员信息失败 ❌`);
  }
}


// 脚本执行入口
!(async () => {
  if (typeof $request !== `undefined`) {
    GetCookie();
  } else {
    await main();  // 主函数
  }
})()
  .catch((e) => $.Messages.push(e.message || e) && $.logErr(e))
  .finally(async () => {
    await sendMsg($.Messages.join('\n').trimStart().trimEnd());  // 推送通知
    $.done();
  })



// 获取用户数据
function GetCookie() {
  try {
    let msg = '';
    debug($response.body);
    const result = $.toObj($response.body);
    const { mobile, token, memberId, nickname, storeCode } = result.data;
    if (mobile && token) {
      $.log(`✅ 成功获取 Token`);
      // 使用 find() 方法找到与 mobile 匹配的对象，以新增/更新用户 token
      const user = $.userArr.find(user => user.mobile === mobile);
      if (user) {
        if (user.token == token) return;
        msg += `♻️ 更新用户 [${hideSensitiveData(mobile, 3, 4)}] Token: ${token}`;
        user.token = token;
      } else {
        msg += `🆕 新增用户 [${hideSensitiveData(mobile, 3, 4)}] Token: ${token}`;
        $.userArr.push({ "mobile": mobile, "token": token, "nickname": nickname });
      }
      // 写入数据持久化
      $.setdata($.toStr($.userArr), 'aeon_data');
      $.Messages.push(msg), $.log(msg);
    }
  } catch (e) {
    $.log("❌ 签到数据获取失败"), $.log(e);
  }
}


// 获取环境变量
function getEnv(...keys) {
  for (let key of keys) {
    var value = $.isNode() ? process.env[key] || process.env[key.toUpperCase()] || process.env[key.toLowerCase()] || $.getdata(key) : $.getdata(key);
    if (value) return value;
  }
}


/**
 * 对象属性转小写
 * @param {object} obj - 传入 $request.headers
 * @returns {object} 返回转换后的对象
 */
function ObjectKeys2LowerCase(obj) {
  const _lower = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]))
  return new Proxy(_lower, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey.toLowerCase(), receiver)
    },
    set: function (target, propKey, value, receiver) {
      return Reflect.set(target, propKey.toLowerCase(), value, receiver)
    }
  })
}


/**
 * 请求函数二次封装
 * @param {(object|string)} options - 构造请求内容，可传入对象或 Url
 * @returns {(object|string)} - 根据 options['respType'] 传入的 {status|headers|rawBody} 返回对象或字符串，默认为 body
 */
async function Request(options) {
  try {
    options = options.url ? options : { url: options };
    const _method = options?._method || ('body' in options ? 'post' : 'get');
    const _respType = options?._respType || 'body';
    const _timeout = options?._timeout || 15e3;
    const _http = [
      new Promise((_, reject) => setTimeout(() => reject(`❌ 请求超时： ${options['url']}`), _timeout)),
      new Promise((resolve, reject) => {
        debug(options, '[Request]');
        $[_method.toLowerCase()](options, (error, response, data) => {
          debug(response, '[response]');
          error && $.log($.toStr(error));
          if (_respType !== 'all') {
            resolve($.toObj(response?.[_respType], response?.[_respType]));
          } else {
            resolve(response);
          }
        })
      })
    ];
    return await Promise.race(_http);
  } catch (err) {
    $.logErr(err);
  }
}


// 获取微信 Code
async function getWxCode() {
  try {
    $.codeList = [];
    $.codeServer = getEnv("CODESERVER_ADDRESS", "@codeServer.address");
    $.codeFuc = getEnv("CODESERVER_FUN", "@codeServer.fun");
    if (!$.codeServer) return $.log(`🐛 WeChat code server is not configured.\n`);

    $.codeList = ($.codeFuc
      ? (eval($.codeFuc), await WxCode($.appid))
      : (await Request(`${$.codeServer}/?wxappid=${$.appid}`))?.split("|"))
      .filter(item => item.length === 32);
    $.log(`♻️ 获取到 ${$.codeList.length} 个微信 Code:\n${$.codeList}`);
  } catch (e) {
    $.logErr(`❌ 获取微信 Code 失败！`);
  }
}


// 发送消息
async function sendMsg(message) {
  if (!message) return;
  try {
    if ($.isNode()) {
      try {
        var notify = require('./sendNotify');
      } catch (e) {
        var notify = require('./utils/sendNotify');
      }
      await notify.sendNotify($.name, message);
    } else {
      $.msg($.name, '', message);
    }
  } catch (e) {
    $.log(`\n\n----- ${$.name} -----\n${message}`);
  }
}


// 数据脱敏
function hideSensitiveData(string, head_length = 2, foot_length = 2) {
  let star = '';
  try {
    for (var i = 0; i < string.length - head_length - foot_length; i++) {
      star += '*';
    }
    return string.substring(0, head_length) + star + string.substring(string.length - foot_length);
  } catch (e) {
    console.log(e);
    return string;
  }
}


/**
 * DEBUG
 * @param {*} content - 传入内容
 * @param {*} title - 标题
 */
function debug(content, title = "debug") {
  let start = `\n----- ${title} -----\n`;
  let end = `\n----- ${$.time('HH:mm:ss')} -----\n`;
  if ($.is_debug === 'true') {
    if (typeof content == "string") {
      $.log(start + content + end);
    } else if (typeof content == "object") {
      $.log(start + $.toStr(content) + end);
    }
  }
}

// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, o) => { s.call(this, t, (t, s, r) => { t ? o(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.logLevels = { debug: 0, info: 1, warn: 2, error: 3 }, this.logLevelPrefixs = { debug: "[DEBUG] ", info: "[INFO] ", warn: "[WARN] ", error: "[ERROR] " }, this.logLevel = "info", this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null, ...s) { try { return JSON.stringify(t, ...s) } catch { return e } } getjson(t, e) { let s = e; const o = this.getdata(t); if (o) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, o) => e(o)) }) } runScript(t, e) { return new Promise(s => { let o = this.getdata("@chavy_boxjs_userCfgs.httpapi"); o = o ? o.replace(/\n/g, "").trim() : o; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [i, a] = o.split("@"), n = { url: `http://${a}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": i, Accept: "*/*" }, timeout: r }; this.post(n, (t, e, o) => s(o)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), o = !s && this.fs.existsSync(e); if (!s && !o) return {}; { const o = s ? t : e; try { return JSON.parse(this.fs.readFileSync(o)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), o = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : o ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const o = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of o) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, o) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[o + 1]) >> 0 == +e[o + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, o] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, o, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, o, r] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(o), a = o ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(a); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), o) } catch (e) { const i = {}; this.lodash_set(i, r, t), s = this.setval(JSON.stringify(i), o) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, o) => { !t && s && (s.body = o, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, o) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: o, headers: r, body: i, bodyBytes: a } = t; e(null, { status: s, statusCode: o, headers: r, body: i, bodyBytes: a }, i, a) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: o, statusCode: r, headers: i, rawBody: a } = t, n = s.decode(a, this.encoding); e(null, { status: o, statusCode: r, headers: i, rawBody: a, body: n }, n) }, t => { const { message: o, response: r } = t; e(o, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, o) => { !t && s && (s.body = o, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, o) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: o, headers: r, body: i, bodyBytes: a } = t; e(null, { status: s, statusCode: o, headers: r, body: i, bodyBytes: a }, i, a) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let o = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...i } = t; this.got[s](r, i).then(t => { const { statusCode: s, statusCode: r, headers: i, rawBody: a } = t, n = o.decode(a, this.encoding); e(null, { status: s, statusCode: r, headers: i, rawBody: a, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && o.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let o = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in o) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? o[e] : ("00" + o[e]).substr(("" + o[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let o = t[s]; null != o && "" !== o && ("object" == typeof o && (o = JSON.stringify(o)), e += `${s}=${o}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", o = "", r) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, o = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": o } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, o, i(r)); break; case "Quantumult X": $notify(e, s, o, i(r)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), o && t.push(o), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } debug(...t) { this.logLevels[this.logLevel] <= this.logLevels.debug && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.debug}${t.join(this.logSeparator)}`)) } info(...t) { this.logLevels[this.logLevel] <= this.logLevels.info && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.info}${t.join(this.logSeparator)}`)) } warn(...t) { this.logLevels[this.logLevel] <= this.logLevels.warn && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.warn}${t.join(this.logSeparator)}`)) } error(...t) { this.logLevels[this.logLevel] <= this.logLevels.error && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.error}${t.join(this.logSeparator)}`)) } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, e, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, e, void 0 !== t.message ? t.message : t, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }
