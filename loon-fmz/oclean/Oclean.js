// 作者：許諾
/*
"欧可林" app 自动签到得积分，支持 Quantumult X（理论上也支持 Surge、Loon，未尝试）。
请先按下述方法进行配置，进入"欧可林"并点击"活动"，若弹出"首次写入欧可林 Cookie 成功"即可正常食用，其他提示或无提示请发送日志信息至 issue。
到 cron 设定时间自动签到时，若弹出"欧可林 - 签到成功"即完成签到，其他提示或无提示请发送日志信息至 issue。

注意："欧可林" app 签到与微信小程序"欧可林商城"签到共享（一致），即 Oclean.js 与 Oclean_mini.js 任取一个使用即可，暂未验证两个脚本中账户信息哪个过期快，不过猜测 app 签到会更持久，而新用户推荐使用小程序先进行注册，会有额外积分奖励。

⚠️免责声明：
1. 此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2. 由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3. 请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4. 此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5. 本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6. 如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7. 所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。


Quantumult X:


Surge & Loon:

All app:

获取完 Cookie 后可不注释 rewrite / hostname，Cookie 更新时会弹窗。若因 MitM 导致该软件网络不稳定，可注释掉 hostname。
*/

const CheckinURL = 'https://mall.oclean.com/API/VshopProcess.ashx'
const DrawURL = 'https://mall.oclean.com/api/VshopProcess.ashx?action=ActivityDraw'
const CookieName = '欧可林'
const CookieKey = 'Oclean'
const reg = /Shop-Member=(\S*);/
const $cmp = compatibility()

!(async () => {
    if ($cmp.isRequest) {
        GetCookie()
    } else {
        await Checkin()
    }
})().finally(() => $cmp.done())

function GetCookie() {
    if ($request && reg.exec($request.headers['Cookie'])[1]) {
        let CookieValue = reg.exec($request.headers['Cookie'])[1]
        if ($cmp.read(CookieKey) != (undefined || null)) {
            if ($cmp.read(CookieKey) != CookieValue) {
                let token = $cmp.write(CookieValue, CookieKey)
                if (!token) {
                    $cmp.notify("更新" + CookieName + " Cookie 失败‼️", "", "")
                } else {
                    $cmp.notify("更新" + CookieName + " Cookie 成功 🎉", "", "")
                }
            }
        } else {
            let token = $cmp.write(CookieValue, CookieKey)
            if (!token) {
                $cmp.notify("首次写入" + CookieName + " Cookie 失败‼️", "", "")
            } else {
                $cmp.notify("首次写入" + CookieName + " Cookie 成功 🎉", "", "")
            }
        }
    } else {
        $cmp.notify("写入" + CookieName + "Cookie 失败‼️", "", "配置错误, 无法读取请求头, ")
    }
}

async function Checkin() {
    let subTitle = ''
    let detail = ''
    const oclean = {
        url: CheckinURL,
        headers: {
            "Cookie": 'Shop-Member=' + $cmp.read("Oclean"),
        },
        body: 'action=SignIn&SignInSource=2&clientType=2'
    }
    const oclean_draw = {
        url: DrawURL,
        headers: {
            "Cookie": 'Shop-Member=' + $cmp.read("Oclean"),
        },
        body: 'ActivityId=9&clientType=2'
    }
    await new Promise((resolve, reject) => {
        $cmp.post(oclean_draw, function(error, response, data) {
            if (!error) {
                const result = JSON.parse(data)
                if (result.Status == "OK" || result.Data.AwardGrade) {
                    $cmp.log("Oclean draw succeed response : \n" + result.Data.Msg + '：' + result.Data.AwardSubName + '\n一等奖可能是未中奖。。')
                } else {
                    $cmp.log("Oclean draw failed response : \n" + JSON.stringify(result))
                }
            } else {
                $cmp.log("Oclean draw failed response : \n" + error)
            }
            resolve()
        })
    })
    await new Promise((resolve, reject) => { 
        $cmp.post(oclean, function(error, response, data) {
            if (!error) {
                const result = JSON.parse(data)
                if (result.Status == "OK" && result.Code == 1) {
                    subTitle += '签到成功！🦷'
                    let todayget = result.Data.points
                    let total = result.Data.integral
                    detail += '签到获得 ' + todayget + ' 积分，账户共有 ' + total + ' 积分。'
                } else if (result.Status == "OK" && result.Code == 2) {
                    subTitle += '重复签到！🥢'
                    let total = result.Data.integral
                    detail += '账户共有 ' + total + ' 积分。'
                } else if (result.Status == "NO") {
                    subTitle += 'Cookie 失效或未获取'
                    detail += '请按照脚本开头注释获取 Cookie。'
                } else {
                    subTitle += '未知错误，详情请见日志。'
                    detail += result.Message
                    $cmp.log("Oclean failed response : \n" + JSON.stringify(result))
                }
            } else {
                subTitle += '签到接口请求失败，详情请见日志。'
                detail += error
                $cmp.log("Oclean failed response : \n" + error)
            }
            $cmp.notify(CookieName, subTitle, detail)
            resolve()
        })
    })
}

function compatibility(){const e="undefined"!=typeof $request,t="undefined"!=typeof $httpClient,r="undefined"!=typeof $task,n="undefined"!=typeof $app&&"undefined"!=typeof $http,o="function"==typeof require&&!n,s=(()=>{if(o){const e=require("request");return{request:e}}return null})(),i=(e,s,i)=>{r&&$notify(e,s,i),t&&$notification.post(e,s,i),o&&a(e+s+i),n&&$push.schedule({title:e,body:s?s+"\n"+i:i})},u=(e,n)=>r?$prefs.setValueForKey(e,n):t?$persistentStore.write(e,n):void 0,d=e=>r?$prefs.valueForKey(e):t?$persistentStore.read(e):void 0,l=e=>(e&&(e.status?e.statusCode=e.status:e.statusCode&&(e.status=e.statusCode)),e),f=(e,i)=>{r&&("string"==typeof e&&(e={url:e}),e.method="GET",$task.fetch(e).then(e=>{i(null,l(e),e.body)},e=>i(e.error,null,null))),t&&$httpClient.get(e,(e,t,r)=>{i(e,l(t),r)}),o&&s.request(e,(e,t,r)=>{i(e,l(t),r)}),n&&("string"==typeof e&&(e={url:e}),e.header=e.headers,e.handler=function(e){let t=e.error;t&&(t=JSON.stringify(e.error));let r=e.data;"object"==typeof r&&(r=JSON.stringify(e.data)),i(t,l(e.response),r)},$http.get(e))},p=(e,i)=>{r&&("string"==typeof e&&(e={url:e}),e.method="POST",$task.fetch(e).then(e=>{i(null,l(e),e.body)},e=>i(e.error,null,null))),t&&$httpClient.post(e,(e,t,r)=>{i(e,l(t),r)}),o&&s.request.post(e,(e,t,r)=>{i(e,l(t),r)}),n&&("string"==typeof e&&(e={url:e}),e.header=e.headers,e.handler=function(e){let t=e.error;t&&(t=JSON.stringify(e.error));let r=e.data;"object"==typeof r&&(r=JSON.stringify(e.data)),i(t,l(e.response),r)},$http.post(e))},a=e=>console.log(e),y=(t={})=>{e?$done(t):$done()};return{isQuanX:r,isSurge:t,isJSBox:n,isRequest:e,notify:i,write:u,read:d,get:f,post:p,log:a,done:y}}
