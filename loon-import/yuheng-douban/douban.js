// 作者：許諾
/******************************************
 * @name 豆瓣电影日历
 * @version 1.1.0
******************************************
## 更新日志

### 20250219
    优化代码

### 20231020
    1.优化代码

## 脚本声明
    1.此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
    2.由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
    3.请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
    4.此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
    5.本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
    6.如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
    7.所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明, 本人保留随时更改或补充此声明的权利, 一旦您使用或复制了此脚本，即视为您已接受此免责声明。

## 使用方法

### 配置 (QuanX)
```properties
[task_local]
30 9 * * * https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/yuheng-douban/douban.js, tag=豆瓣每日推荐, img-url=https://is3-ssl.mzstatic.com/image/thumb/Purple126/v4/90/5d/f8/905df82a-0e2e-5a2c-2be6-cc690fb0bec0/AppIcon-0-0-1x_U007emarketing-0-0-0-6-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/144x144bb.png, enabled=true
```
### 配置 (Loon)
```properties
[Script]
cron "30 9 * * *" script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/yuheng-douban/douban.js, timeout=10, tag=豆瓣每日推荐, img-url=https://is3-ssl.mzstatic.com/image/thumb/Purple126/v4/90/5d/f8/905df82a-0e2e-5a2c-2be6-cc690fb0bec0/AppIcon-0-0-1x_U007emarketing-0-0-0-6-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/144x144bb.png
```
### 配置 (Surge)
```properties
豆瓣每日推荐 = type=cron,cronexp=0 30 9 * * *,wake-system=1,script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/yuheng-douban/douban.js,timeout=60
```
******************************************/
const $ = new Env(`豆瓣电影日历`)
// 调试模式
$.logLevel = `${$.isNode() ? process.env.DOUBAN__DEBUG : $.getdata('douban_debug')}` === 'true' ? 'debug' : 'info'
// Bark推送密钥
const Bark_Key = ($.isNode() ? process.env.DOUBAN_BARK_PUSH : $.getdata('douban_bark_push')) || ''
// 豆瓣API密钥
const Douban_Api_Key = ($.isNode() ? process.env.DOUBAN_API_KEY : $.getdata('douban_api_key')) || '0ab215a8b1977939201640fa14c66bab'
// 通知类异常
class NotificationException extends Error {
    constructor(message) {
        super(message)
        this.name = 'NotificationException'
    }
}
// 影片信息
const Movie_Info = {
    id: '', // 豆瓣ID
    url: '', // 豆瓣链接
    title: '', // 电影名称
    subtitle: '', // 副标题
    poster: '', // 海报图
    pubdate: [], // 上映时间
    genres: [], // 类型
    rating: '', // 评分
    stars: '', // 星数
    directors: [], // 导演
    actors: [] // 演员
}
// 播放源
const Play_Source = [
    {
        name: '高清资源',
        url: 'https://api.1080zyku.com/inc/apijson.php/'
    },
    {
        name: '非凡资源',
        url: 'http://cj.ffzyapi.com/api.php/provide/vod/'
    },
    {
        name: '量子资源',
        url: 'https://cj.lziapi.com/api.php/provide/vod/'
    },
    {
        name: 'ikun资源',
        url: 'https://ikunzyapi.com/api.php/provide/vod/from/ikm3u8/at/json/'
    },
    {
        name: '光速资源',
        url: 'https://api.guangsuapi.com/api.php/provide/vod/from/gsm3u8/'
    }
]
;(async () => {
    await Get_Movie()
    if (!Movie_Info.id) throw new NotificationException('获取今日推荐影片失败')
    $.debug($.toStr(Movie_Info, null, 2))
    const playUrl = await Promise.any(
        Play_Source.map((_, idx) =>
            Get_Movie_Source(idx)
                .then((url) => {
                    if (!url) {
                        const msg = `⚠️ ${Play_Source[idx].name} 返回播放链接为空`
                        $.log(msg)
                        throw msg
                    }
                    return url
                })
                .catch((e) => {
                    $.log(`⚠️ ${Play_Source[idx].name} 查找失败: ${e.message}`)
                    throw e
                })
        )
    ).catch(() => $.log(`❌ ${Movie_Info.title} 未找到播放链接`))
    $.debug(`播放链接: ${playUrl}`)
    const subtitle = Movie_Info.title
    const content = []
    content.push(`导演: ${TextEmphasis(Movie_Info.directors)}`)
    content.push(`主演: ${TextEmphasis(Movie_Info.actors)}`)
    content.push(`类型: ${TextEmphasis(Movie_Info.genres)}`)
    content.push(`上映时间: ${TextEmphasis(Movie_Info.pubdate)}`)
    content.push(`豆瓣评分: ${Movie_Info.rating} ${Movie_Info.stars}`)
    if ($.isNode() && playUrl) {
        content.push(`播放链接: https://m3u8play.com/?play=${encodeURIComponent(playUrl)}`)
    }
    const message = content.join('\n').replace(/\n$/, '')
    if (Bark_Key) {
        await Bark_Nofify($.name, subtitle, message, {
            $media: Movie_Info.poster,
            $copy: playUrl
        })
    } else {
        $.msg($.name, Movie_Info.title, message, {
            $media: Movie_Info.poster,
            $open: playUrl
        })
    }
})()
    .catch((e) => {
        $.logErr(e)
        if (e instanceof NotificationException) {
            $.msg($.name, '❌ 发生错误‼️', e.message)
        }
    })
    .finally(() => $.done({}))

/**
 * 获取今日推荐影片
 */
async function Get_Movie() {
    const url = `https://frodo.douban.com/api/v2/calendar/today`
    const params = {
        apikey: Douban_Api_Key,
        date: $.time('yyyy-MM-dd'),
        _sig: encodeURIComponent('tuOyn+2uZDBFGAFBLklc2GkuQk4='),
        _ts: 1610703479
    }
    try {
        const { body } = await $.http.get({
            url,
            params,
            headers: { 'User-Agent': 'api-client/0.1.3 com.douban.frodo/8.0.0' }
        })
        const data = $.toObj(body)
        Object.assign(Movie_Info, {
            id: $.lodash_get(data, 'subject.id'),
            url: $.lodash_get(data, 'subject.url'),
            title: $.lodash_get(data, 'subject.title'),
            genres: $.lodash_get(data, 'subject.genres', []),
            poster: $.lodash_get(data, 'comment.poster').replace(/\.webp$/, '.png'),
            pubdate: $.lodash_get(data, 'subject.pubdate'),
            rating: $.lodash_get(data, 'subject.rating.value'),
            stars: Array.from({ length: 5 })
                .map((_, index) => (index < Math.floor($.lodash_get(data, 'subject.rating.star_count', 0)) ? '★' : '☆'))
                .join(''),
            directors: $.lodash_get(data, 'subject.directors', []).map((item) => item.name),
            actors: $.lodash_get(data, 'subject.actors', []).map((item) => item.name)
        })
    } catch (e) {
        $.logErr(e)
    }
}

/**
 * 获取影片源
 */
async function Get_Movie_Source(idx) {
    const { name, url } = Play_Source[idx]
    $.debug(`--- 开始使用 ${name} 查找播放地址 ---`)
    const params = { ac: 'detail', wd: encodeURI(Movie_Info.title) }
    const { body } = await $.http.get({ url, params })
    const data = $.toObj(body)
    if (!data?.list?.length) throw new Error(`未找到播放源`)
    const findMovie = data.list.find((item) => `${item.vod_douban_id}` === Movie_Info.id)
    if (!findMovie) throw new Error(`未匹配到播放源`)
    $.debug(`${name}请求成功: ${findMovie.vod_play_url}`)
    // let playUrl = $.lodash_get(findMovie, 'vod_play_url', '')
    // const last_$_index = playUrl.lastIndexOf('$')
    // playUrl = playUrl.slice(last_$_index + 1, playUrl.length)
    // return playUrl
    return findMovie.vod_play_url.split('$').pop()
}

/**
 * 数组超出省略
 * @param {*} arr 数组
 * @param {*} maxLen 最大长度
 * @param {*} space 分隔符
 * @returns
 */
function TextEmphasis(arr, maxLen = 3, space = ' / ') {
    if (arr.length <= maxLen) return arr.join(space)
    return arr.slice(0, maxLen).join(space) + '...'
}
/**
 * Bark推送
 * @param {*} title 推送标题
 * @param {*} subtitle 推送副标题
 * @param {*} content 推送内容
 * @param {*} rawOpts 推送参数
 * @returns
 */
async function Bark_Nofify(title, subtitle, content, rawOpts = {}) {
    if (!Bark_Key) return $.error(`未配置 Bark_Key, 无法进行通知!`)
    // ------------------------------
    // 兼顾其他Env适配的其他工具通知
    const url = rawOpts?.['open-url'] || rawOpts?.['openUrl'] || rawOpts?.['$open'] || rawOpts?.['url'] || ''
    const copy = rawOpts?.['update-pasteboard'] || rawOpts?.['updatePasteboard'] || rawOpts?.['$copy'] || rawOpts?.['copy'] || ''
    const icon = rawOpts?.['media-url'] || rawOpts?.['mediaUrl'] || rawOpts?.['$media'] || ''
    !['open-url', 'openUrl', '$open', 'url', 'update-pasteboard', 'updatePasteboard', '$copy', 'copy', 'media-url', 'mediaUrl', '$media'].forEach(
        (key) => delete rawOpts[key]
    )
    // ------------------------------
    if (subtitle) title += '\n' + subtitle
    /*
        参数对照 https://bark.day.app/#/tutorial
        title: 推送标题
        body: 推送内容
        level: 推送中断级别
        badge: 推送角标
        autoCopy: iOS14.5以下自动复制推送内容，iOS14.5以上需手动长按推送或下拉推送
        copy: 复制推送时，指定复制的内容，不传此参数将复制整个推送内容。
        sound: 可以为推送设置不同的铃声
        icon: 为推送设置自定义图标，设置的图标将替换默认Bark图标。
        group: 对消息进行分组，推送将按group分组显示在通知中心中。
        isArchive: 传 1 保存推送，传其他的不保存推送，不传按APP内设置来决定是否保存。
        url: 点击推送时，跳转的URL支持URL Scheme 和 Universal Link
    */
    const body = {
        ...rawOpts,
        url,
        copy,
        icon,
        title,
        body: content
    }
    const req = {
        url: 'https://api.day.app/' + Bark_Key,
        headers: {
            'content-type': 'application/json; charset=utf-8'
        },
        body: $.toStr(body)
    }
    return new Promise((resolve) => {
        $.post(req, (err, resp, data) => {
            try {
                if (err) throw new Error(err)
                data = $.toObj(data)
                if (data?.code === 200 && data?.message === 'success') {
                    $.log(`=========Bark推送成功=========`)
                    $.log(title)
                    $.log(content)
                    url && $.log(`跳转链接: ${url}`)
                    copy && $.log(`复制内容: ${copy}`)
                    icon && $.log(`媒体链接: ${icon}`)
                } else {
                    $.error(`=========Bark推送失败=========`)
                    throw new Error(data.message)
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve()
            }
        })
    })
}

// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;"POST"===e&&(s=this.post);const i=new Promise(((e,i)=>{s.call(this,t,((t,s,o)=>{t?i(t):e(s)}))}));return t.timeout?((t,e=1e3)=>Promise.race([t,new Promise(((t,s)=>{setTimeout((()=>{s(new Error("请求超时"))}),e)}))]))(i,t.timeout):i}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.logLevels={debug:0,info:1,warn:2,error:3},this.logLevelPrefixs={debug:"[DEBUG] ",info:"[INFO] ",warn:"[WARN] ",error:"[ERROR] "},this.logLevel="info",this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null,...s){try{return JSON.stringify(t,...s)}catch{return e}}getjson(t,e){let s=e;if(this.getdata(t))try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise((e=>{this.get({url:t},((t,s,i)=>e(i)))}))}runScript(t,e){return new Promise((s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let o=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");o=o?1*o:20,o=e&&e.timeout?e.timeout:o;const[r,a]=i.split("@"),n={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:o},headers:{"X-Key":r,Accept:"*/*"},policy:"DIRECT",timeout:o};this.post(n,((t,e,i)=>s(i)))})).catch((t=>this.logErr(t)))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),o=JSON.stringify(this.data);s?this.fs.writeFileSync(t,o):i?this.fs.writeFileSync(e,o):this.fs.writeFileSync(t,o)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let o=t;for(const t of i)if(o=Object(o)[t],void 0===o)return s;return o}lodash_set(t,e,s){return Object(t)!==t||(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce(((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{}),t)[e[e.length-1]]=s),t}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),o=s?this.getval(s):"";if(o)try{const t=JSON.parse(o);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,o]=/^@(.*?)\.(.*?)$/.exec(e),r=this.getval(i),a=i?"null"===r?null:r||"{}":"{}";try{const e=JSON.parse(a);this.lodash_set(e,o,t),s=this.setval(JSON.stringify(e),i)}catch(e){const r={};this.lodash_set(r,o,t),s=this.setval(JSON.stringify(r),i)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.cookie&&void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar)))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),void 0===t.followRedirect||t.followRedirect||((this.isSurge()||this.isLoon())&&(t["auto-redirect"]=!1),this.isQuanX()&&(t.opts?t.opts.redirection=!1:t.opts={redirection:!1})),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,((t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)}));break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then((t=>{const{statusCode:s,statusCode:i,headers:o,body:r,bodyBytes:a}=t;e(null,{status:s,statusCode:i,headers:o,body:r,bodyBytes:a},r,a)}),(t=>e(t&&t.error||"UndefinedError")));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",((t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}})).then((t=>{const{statusCode:i,statusCode:o,headers:r,rawBody:a}=t,n=s.decode(a,this.encoding);e(null,{status:i,statusCode:o,headers:r,rawBody:a,body:n},n)}),(t=>{const{message:i,response:o}=t;e(i,o,o&&s.decode(o.rawBody,this.encoding))}));break}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),void 0===t.followRedirect||t.followRedirect||((this.isSurge()||this.isLoon())&&(t["auto-redirect"]=!1),this.isQuanX()&&(t.opts?t.opts.redirection=!1:t.opts={redirection:!1})),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,((t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)}));break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then((t=>{const{statusCode:s,statusCode:i,headers:o,body:r,bodyBytes:a}=t;e(null,{status:s,statusCode:i,headers:o,body:r,bodyBytes:a},r,a)}),(t=>e(t&&t.error||"UndefinedError")));break;case"Node.js":let i=require("iconv-lite");this.initGotEnv(t);const{url:o,...r}=t;this.got[s](o,r).then((t=>{const{statusCode:s,statusCode:o,headers:r,rawBody:a}=t,n=i.decode(a,this.encoding);e(null,{status:s,statusCode:o,headers:r,rawBody:a,body:n},n)}),(t=>{const{message:s,response:o}=t;e(s,o,o&&i.decode(o.rawBody,this.encoding))}));break}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}queryStr(t){let e="";for(const s in t){let i=t[s];null!=i&&""!==i&&("object"==typeof i&&(i=JSON.stringify(i)),e+=`${s}=${i}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",i="",o={}){const r=t=>{const{$open:e,$copy:s,$media:i,$mediaMime:o}=t;switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{const r={};let a=t.openUrl||t.url||t["open-url"]||e;a&&Object.assign(r,{action:"open-url",url:a});let n=t["update-pasteboard"]||t.updatePasteboard||s;if(n&&Object.assign(r,{action:"clipboard",text:n}),i){let t,e,s;if(i.startsWith("http"))t=i;else if(i.startsWith("data:")){const[t]=i.split(";"),[,o]=i.split(",");e=o,s=t.replace("data:","")}else{e=i,s=(t=>{const e={JVBERi0:"application/pdf",R0lGODdh:"image/gif",R0lGODlh:"image/gif",iVBORw0KGgo:"image/png","/9j/":"image/jpg"};for(var s in e)if(0===t.indexOf(s))return e[s];return null})(i)}Object.assign(r,{"media-url":t,"media-base64":e,"media-base64-mime":o??s})}return Object.assign(r,{"auto-dismiss":t["auto-dismiss"],sound:t.sound}),r}case"Loon":{const s={};let o=t.openUrl||t.url||t["open-url"]||e;o&&Object.assign(s,{openUrl:o});let r=t.mediaUrl||t["media-url"];return i?.startsWith("http")&&(r=i),r&&Object.assign(s,{mediaUrl:r}),console.log(JSON.stringify(s)),s}case"Quantumult X":{const o={};let r=t["open-url"]||t.url||t.openUrl||e;r&&Object.assign(o,{"open-url":r});let a=t["media-url"]||t.mediaUrl;i?.startsWith("http")&&(a=i),a&&Object.assign(o,{"media-url":a});let n=t["update-pasteboard"]||t.updatePasteboard||s;return n&&Object.assign(o,{"update-pasteboard":n}),console.log(JSON.stringify(o)),o}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,i,r(o));break;case"Quantumult X":$notify(e,s,i,r(o));break;case"Node.js":break}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}debug(...t){this.logLevels[this.logLevel]<=this.logLevels.debug&&(t.length>0&&(this.logs=[...this.logs,...t]),console.log(`${this.logLevelPrefixs.debug}${t.map((t=>t??String(t))).join(this.logSeparator)}`))}info(...t){this.logLevels[this.logLevel]<=this.logLevels.info&&(t.length>0&&(this.logs=[...this.logs,...t]),console.log(`${this.logLevelPrefixs.info}${t.map((t=>t??String(t))).join(this.logSeparator)}`))}warn(...t){this.logLevels[this.logLevel]<=this.logLevels.warn&&(t.length>0&&(this.logs=[...this.logs,...t]),console.log(`${this.logLevelPrefixs.warn}${t.map((t=>t??String(t))).join(this.logSeparator)}`))}error(...t){this.logLevels[this.logLevel]<=this.logLevels.error&&(t.length>0&&(this.logs=[...this.logs,...t]),console.log(`${this.logLevelPrefixs.error}${t.map((t=>t??String(t))).join(this.logSeparator)}`))}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.map((t=>t??String(t))).join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,e,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,e,void 0!==t.message?t.message:t,t.stack);break}}wait(t){return new Promise((e=>setTimeout(e,t)))}done(t={}){const e=((new Date).getTime()-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${e} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
