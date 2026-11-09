// 作者：許諾
/*
绝区零-lowking-v1.4.4

cookie获取自己抓包，能不能用随缘
超时设置久点，中间要等待10分钟发第二个帖子完成任务
⚠️只测试过surge没有其他app自行测试

************************
Surge 4.2.0+ 脚本配置(其他APP自行转换配置):
************************
[Script]
# > 绝区零
绝区零 = type=cron,cronexp="0 10 0 * * ?",wake-system=1,timeout=700,script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-import/lkzzz/zzz.js
*/
const lk = new ToolKit(`绝区零`, `Zzz`, {"httpApi": "ffff@10.0.0.6:6166"})
const bannerUrl = 'https://images.gamebanana.com/img/Webpage/Game/Profile/Background/66868c3874664.jpg'
const domain = 'https://act-nap-api.mihoyo.com'
const bbsDomain = 'https://bbs-api.miyoushe.com'
const cloudGameDomain = 'https://cg-nap-api.mihoyo.com'
const zzzUidKey = 'zzzUidKey'
const zzzCookieKey = 'zzzCookieKey'
const zzzCloudGameCookieKey = 'zzzCloudGameCookieKey'
const zzzComboTokenKey = 'zzzComboTokenKey'
const zzzDfpKey = 'zzzDfpKey'
const zzzBbsCookieKey = 'zzzBbsCookieKey'
const appVersionKey = 'appVersionKey'
const salt6xKey = 'salt6xKey'
const saltK2Key = 'saltK2Key'
const signInCountDownAmountKey = 'zzzSignInCountDownAmountKey'
const bbsSignInCountDownAmountKey = 'zzzBbsSignInCountDownAmountKey'
const openUrlKey = 'zzzOpenUrlKey'
const enableExchangePolychromesKey = 'zzzExchangePolychromes'
let zzzUid = lk.getVal(zzzUidKey)
let zzzCookie = lk.getVal(zzzCookieKey)
let zzzCloudGameCookie = lk.getVal(zzzCloudGameCookieKey)
let zzzComboToken = lk.getVal(zzzComboTokenKey)
let zzzDfp = lk.getVal(zzzDfpKey)
let zzzBbsCookie = lk.getVal(zzzBbsCookieKey)
let appVersion = lk.getVal(appVersionKey, "2.71.1")
let salt6x = lk.getVal(salt6xKey, "t0qEgfub6cvueAPgR5m9aQWWVciEer7v")
let saltK2 = lk.getVal(saltK2Key, "rtvTthKxEyreVXQCnhluFgLXPOFKPHlA")
let signInCountDownAmount = lk.getVal(signInCountDownAmountKey, 0)
let bbsSignInCountDownAmount = lk.getVal(bbsSignInCountDownAmountKey, 0)
let openUrl = lk.getVal(openUrlKey, "mihoyobbs://webview?link=https%3A%2F%2Fact.mihoyo.com%2Fbbs%2Fevent%2Fsignin%2Fzzz%2Fe202406242138391.html%3Fact_id%3De202406242138391%26bbs_auth_required%3Dtrue%26bbs_presentation_style%3Dfullscreen")
const isEnableExchangePolychromes = lk.getVal(enableExchangePolychromesKey, false).o()
const MD5 = function(d){result = M(V(Y(X(d),8*d.length)));return result.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

const BoxJsInfo = {
    "icons": [
        "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/zzz.png",
        "https://raw.githubusercontent.com/lowking/Scripts/master/doc/icon/zzz.png"
    ],
    "settings": [
        {
            "id": enableExchangePolychromesKey,
            "name": "米游社兑换菲林",
            "val": false,
            "type": "boolean",
            "desc": "米游社兑换菲林(开启之后定时任务必须在19点执行一次)"
        },
        {
            "id": openUrlKey,
            "name": "点击跳转链接",
            "val": "mihoyobbs://webview?link=https%3A%2F%2Fact.mihoyo.com%2Fbbs%2Fevent%2Fsignin%2Fzzz%2Fe202406242138391.html%3Fact_id%3De202406242138391%26bbs_auth_required%3Dtrue%26bbs_presentation_style%3Dfullscreen",
            "type": "text",
            "desc": "点击跳转链接"
        },
        {
            "id": zzzUidKey,
            "name": "绝区零Uid",
            "val": "",
            "type": "text",
            "desc": "填写游戏内的uid"
        },
        {
            "id": zzzCookieKey,
            "name": "日常签到cookie",
            "val": "",
            "type": "text",
            "desc": ""
        },
        {
            "id": signInCountDownAmountKey,
            "name": "n次执行之后才进行日常签到",
            "val": 0,
            "type": "number",
            "desc": "n次执行之后才进行日常签到"
        },
        {
            "id": zzzDfpKey,
            "name": "设备指纹",
            "val": "",
            "type": "text",
            "desc": "设备指纹"
        },
        {
            "id": zzzBbsCookieKey,
            "name": "米游社cookie",
            "val": "",
            "type": "text",
            "desc": "米游社cookie"
        },
        {
            "id": zzzCloudGameCookieKey,
            "name": "绝区零云游戏cookie",
            "val": "",
            "type": "text",
            "desc": "绝区零云游戏cookie"
        },
        {
            "id": zzzComboTokenKey,
            "name": "绝区零云游戏combo_token",
            "val": "",
            "type": "text",
            "desc": "绝区零云游戏combo_token"
        },
        {
            "id": bbsSignInCountDownAmountKey,
            "name": "n次执行之后才进行打卡",
            "val": 0,
            "type": "number",
            "desc": "n次执行之后才进行打卡"
        },
        {
            "id": appVersionKey,
            "name": "米游社API版本",
            "val": "2.71.1",
            "type": "text",
            "desc": "米游社API版本"
        },
        {
            "id": salt6xKey,
            "name": "salt 6x",
            "val": "t0qEgfub6cvueAPgR5m9aQWWVciEer7v",
            "type": "text",
            "desc": "t0qEgfub6cvueAPgR5m9aQWWVciEer7v"
        },
        {
            "id": saltK2Key,
            "name": "salt k2",
            "val": "rtvTthKxEyreVXQCnhluFgLXPOFKPHlA",
            "type": "text",
            "desc": "rtvTthKxEyreVXQCnhluFgLXPOFKPHlA"
        },
    ],
    "keys": [zzzUidKey, zzzCookieKey, zzzCloudGameCookieKey, zzzComboTokenKey, zzzDfpKey, zzzBbsCookieKey, appVersionKey, salt6xKey, saltK2Key],
    "script_timeout": 700
}

const BoxJsParam = {
    "script_url": "https://github.com/lowking/Scripts/blob/master/mihoyo/zzz.js",
    "author": "@lowking",
    "repo": "https://github.com/lowking/Scripts",
}

const signIn = async (title, uid, cookie, dfp) => new Promise((resolve, _reject) => {
    lk.log(title)
    let body = {"act_id": "e202406242138391", "region": "prod_gf_cn", "uid": "" + uid, "lang": "zh-cn"}.s()
    lk.post({
        url: `${domain}/event/luna/zzz/sign`,
        headers: {
            "x-rpc-signgame": "zzz",
            "x-rpc-device_fp": dfp,
            "x-rpc-client_type": 5,
            "x-rpc-app_version": appVersion,
            ds: getDs("dailyCheckin", body),
            cookie: cookie
        },
        body
    }, async (error, _response, data) => {
        try {
            if (error) {
                lk.execFail()
                lk.log(error)
                lk.appendNotifyInfo(`❌${title}失败，请稍后再试`)
            } else {
                data = data.o()
            }
        } catch (e) {
            lk.logErr(e)
            lk.log(`返回数据：${data}`)
            lk.execFail()
            throw `❌${title}错误，请稍后再试`
        } finally {
            resolve(data)
        }
    })
})

const bbsSignIn = async (title, cookie, dfp) => new Promise((resolve, _reject) => {
    lk.log(title)
    let body = {"gids": 8}
    lk.post({
        url: `${bbsDomain}/apihub/app/api/signIn`,
        headers: {
            referer: "https://app.mihoyo.com",
            "x-rpc-device_fp": dfp,
            "x-rpc-client_type": 2,
            "x-rpc-app_version": appVersion,
            ds: getDs("signIn", body.s()),
            cookie
        },
        body: body.s()
    }, async (error, _response, data) => {
        try {
            if (error) {
                lk.execFail()
                lk.log(error)
                lk.appendNotifyInfo(`❌${title}失败，请稍后再试`)
            } else {
                data = data.o()
            }
        } catch (e) {
            lk.logErr(e)
            lk.log(`返回数据：${data}`)
            lk.execFail()
            throw `❌${title}错误，请稍后再试`
        } finally {
            resolve(data)
        }
    })
})

const getBbsPost = async title => new Promise((resolve, _reject) => {
    lk.log(title)
    lk.get({
        url: `${bbsDomain}/post/api/getForumPostList?forum_id=57&is_good=false&is_hot=false&page=1&page_size=14&sort_type=1`,
        headers: {
            referer: "https://app.mihoyo.com",
        },
    }, async (error, _response, data) => {
        try {
            if (error) {
                lk.execFail()
                lk.log(error)
                lk.appendNotifyInfo(`❌${title}失败，请稍后再试`)
            } else {
                data = data.o()
            }
        } catch (e) {
            lk.logErr(e)
            lk.log(`返回数据：${data}`)
            lk.execFail()
            throw `❌${title}错误，请稍后再试`
        } finally {
            resolve(data)
        }
    })
})

const bbsUpVote = (title, postId, isCancel, cookie, dfp) => new Promise((resolve, _reject) => {
    lk.log(title)
    lk.post({
        url: `${bbsDomain}/post/api/post/upvote`,
        headers: {
            referer: "https://app.mihoyo.com",
            "x-rpc-device_fp": dfp,
            "x-rpc-client_type": 2,
            "x-rpc-app_version": appVersion,
            ds: getDs(),
            cookie
        },
        body: {"is_cancel": isCancel, "post_id": postId, "upvote_type": 1}.s()
    }, (error, _response, data) => {
        try {
            if (error) {
                lk.execFail()
                lk.log(error)
                lk.appendNotifyInfo(`❌${title}失败，请稍后再试`)
            } else {
                lk.log(`${title}: ${data}`)
                data = data.o()
            }
        } catch (e) {
            lk.logErr(e)
            lk.log(`返回数据：${data}`)
            lk.execFail()
            throw `❌${title}错误，请稍后再试`
        } finally {
            resolve(data)
        }
    })
})

const viewPost = (title, postId, cookie, dfp) => new Promise((resolve, _reject) => {
    lk.log(title)
    lk.get({
        url: `${bbsDomain}/post/api/getPostFull?post_id=${postId}`,
        headers: {
            referer: "https://app.mihoyo.com",
            "x-rpc-device_fp": dfp,
            "x-rpc-client_type": 2,
            "x-rpc-app_version": appVersion,
            ds: getDs(),
            cookie
        },
    }, (error, _response, data) => {
        try {
            if (error) {
                lk.execFail()
                lk.log(error)
                lk.appendNotifyInfo(`❌${title}失败，请稍后再试`)
            } else {
                data = data.o()
            }
        } catch (e) {
            lk.logErr(e)
            lk.log(`返回数据：${data}`)
            lk.execFail()
            throw `❌${title}错误，请稍后再试`
        } finally {
            resolve(data)
        }
    })
})

const share = (title, postId, cookie, dfp) => new Promise((resolve, _reject) => {
    lk.log(title)
    lk.get({
        url: `${bbsDomain}/apihub/api/getShareConf?entity_id=${postId}&entity_type=1`,
        headers: {
            referer: "https://app.mihoyo.com",
            "x-rpc-device_fp": dfp,
            "x-rpc-client_type": 2,
            "x-rpc-app_version": appVersion,
            ds: getDs(),
            cookie
        },
    }, (error, _response, data) => {
        try {
            if (error) {
                lk.execFail()
                lk.log(error)
                lk.appendNotifyInfo(`❌${title}失败，请稍后再试`)
            } else {
                lk.log(`${title}: ${data}`)
                data = data.o()
            }
        } catch (e) {
            lk.logErr(e)
            lk.log(`返回数据：${data}`)
            lk.execFail()
            throw `❌${title}错误，请稍后再试`
        } finally {
            resolve(data)
        }
    })
})

const getZzzInfo = async (title, uid, cookie) => new Promise((resolve, _reject) => {
    lk.log(title)
    lk.get({
        url: `${domain}/event/luna/zzz/info?lang=zh-cn&act_id=e202406242138391&region=prod_gf_cn&uid=${uid}`,
        headers: {
            cookie: cookie,
            "x-rpc-signgame": "zzz"
        }
    }, async (error, _response, data) => {
        try {
            if (error) {
                lk.execFail()
                lk.log(error)
                lk.appendNotifyInfo(`❌${title}失败，请稍后再试`)
            } else {
                data = data.o()
            }
        } catch (e) {
            lk.logErr(e)
            lk.log(`返回数据：${data}`)
            lk.execFail()
            throw `❌${title}错误，请稍后再试`
        } finally {
            resolve(data)
        }
    })
})

const getCloudGameHeaders = () => ({
    "x-rpc-language": "zh-cn",
    "x-rpc-device_model": "iPhone16,1",
    "user-agent": "%E4%BA%91%C2%B7%E7%BB%9D%E5%8C%BA%E9%9B%B6/2 CFNetwork/1568.300.101 Darwin/24.2.0",
    "x-rpc-vendor_id": 2,
    "x-rpc-device_name": "iPhone",
    "x-rpc-cps": "appstore",
    "x-rpc-cg_game_biz": "nap_cn",
    "x-rpc-cg_game_id": 9000357,
    "content-length": 0,
    "x-rpc-channel": "appstore",
    "x-rpc-app_version": "1.4.3",
    "accept-language": "zh-CN,zh-Hans;q=0.9",
    "x-rpc-op_biz": "clgm_nap-cn",
    "x-rpc-device_id": "7BE6388C-8C3D-470A-A2D9-699523FC7CC3",
    "x-rpc-client_type": 1,
    "accept": "*/*",
    "accept-encoding": "gzip, deflate, br",
    "x-rpc-sys_version": "18.2",
    "x-rpc-combo_token": zzzComboToken,
    cookie: zzzCloudGameCookie,
})

const doCloudGameDailyCheck = async () => {
    let freeTime = await doGetFreeTime()
    if (freeTime >= 600) {
        lk.msg('', `⚠️云游戏免费时常${freeTime}分钟，记得使用哦！`)
        return
    }
    await doCloudLogin().then(async (ret) => {
        if (!ret) return false
        let nowFreeTime = await doGetFreeTime()
        let differenceValue = nowFreeTime - freeTime
        let msg = `🎉云游戏时长：${nowFreeTime}分钟`
        if (differenceValue != 0) {
            msg = `${msg}(${differenceValue >= 0 ? "+" : "-"}${differenceValue})`
        }
        if (nowFreeTime >= 540) {
            lk.msg('', `⚠️云游戏免费时常${nowFreeTime}分钟，记得使用哦！`)
        }
        lk.appendNotifyInfo(msg)
        return true
    }).then(async (ret) => {
        if (!ret) return
        let title = "获取通知"
        // list notification
        await lk.req.get({
            url: `${cloudGameDomain}/nap_cn/cg/gamer/api/listNotifications?is_sort=true&status=NotificationStatusUnread&type=NotificationTypePopup`,
            headers: getCloudGameHeaders(),
        }).then(({ error, resp, data }) => {
            lk.debug(`获取到的通知: ${data}`, null, 2)
            data = data.o()
            if (data?.retcode != 0) {
                lk.log(`${title}失败：${data.s()}`)
                lk.execFail()
                return []
            }
            let ret = []
            if (data?.data?.list) {
                ret = data.data.list
            }
            return ret.filter((notification) => notification?.msg.indexOf("每日登录") != -1)
        }).then((ret) => {
            if (!ret) return
            // ack notification
            ret.forEach(async (notification) => {
                if (!notification?.id) return
                await lk.req.post({
                    url: `${cloudGameDomain}/nap_cn/cg/gamer/api/ackNotification`,
                    headers: getCloudGameHeaders(),
                    body: {
                        id: notification.id,
                    }.s()
                })
            })
        })
    })
}

const doGetFreeTime = async () => {
    let title = "获取云绝区零当前免费时长"
    lk.log(title)
    return await lk.req.get({
        url: `${cloudGameDomain}/nap_cn/cg/wallet/wallet/get`,
        headers: getCloudGameHeaders(),
    }).then(({ error, resp, data }) => {
        lk.log(`${title}：${data}`)
        data = data.o()
        if (data?.retcode != 0) {
            lk.log(`${title}失败：${data.s()}`)
            lk.execFail()
            return -1
        } else {
            let freeTime = data?.data?.free_time?.free_time || "- "
            return freeTime
        }
    })
}

const doCloudLogin = async () => {
    let title = "云绝区零登录"
    lk.log(title)
    return await lk.req.post({
        url: `${cloudGameDomain}/nap_cn/cg/gamer/api/login`,
        headers: getCloudGameHeaders(),
    }).then(({ error, resp, data }) => {
        lk.log(`${title}：${data}`)
        data = data.o()
        if (data?.retcode != 0) {
            lk.log(`${title}失败：${data.s()}`)
            lk.execFail()
            return false
        }
        return true
    })
}

const doSignIn = async () => {
    // 签到有验证码，配置n天后继续签到
    if (signInCountDownAmount > 0) {
        signInCountDownAmount--
        lk.setVal(signInCountDownAmountKey, signInCountDownAmount)
        return
    }
    let title = '获取签到信息'
    await getZzzInfo(title, zzzUid, zzzCookie, zzzDfp).then((info) => {
        if (info?.retcode != 0) {
            throw `获取签到信息异常，请重新获取cookie之后再尝试`
        }
        let isSign = info?.data?.is_sign
        info = {
            uid: zzzUid,
            cookie: zzzCookie,
            dfp: zzzDfp,
            isSign
        }
        return info
    }).then(async ({ uid, cookie, dfp, isSign }) => {
        title = '日常签到'
        if (isSign) {
            lk.appendNotifyInfo(`⚠️${title}已经签到过了`)
            return
        }
        await signIn(title, uid, cookie, dfp).then((signRet) => {
            if (signRet?.retcode != 0) {
                throw `❌${title}失败：${signRet?.message}`
            }
            if (signRet?.data?.is_risk) {
                lk.appendNotifyInfo(`❌${title}失败：触发风控验证码，请等待一段时间再试`)
                lk.execFail()
                lk.setVal(signInCountDownAmountKey, 3)
                return
            }
            lk.appendNotifyInfo(`🎉${title}成功`)
        })
    })
}

const doBbsSignIn = async () => {
    if (bbsSignInCountDownAmount > 0) {
        bbsSignInCountDownAmount--
        lk.setVal(bbsSignInCountDownAmountKey, bbsSignInCountDownAmount)
        return
    }
    let title = '米游社打卡'
    await bbsSignIn(title, zzzBbsCookie, zzzDfp).then((signRet) => {
        lk.log(signRet.s())
        switch (signRet?.retcode) {
            case 0:
                lk.appendNotifyInfo(`🎉${title}成功，获得${signRet?.data?.points}米游币`)
                break
            case 1008:
                lk.appendNotifyInfo(`⚠️${title}异常：${signRet?.message}`)
                lk.execFail()
                break
            case 1034:
                lk.appendNotifyInfo(`❌${title}失败：触发风控验证码，请等待一段时间再试`)
                lk.execFail()
                lk.setVal(bbsSignInCountDownAmountKey, 3)
                break
            default:
                lk.execFail()
                lk.appendNotifyInfo(`⚠️${title}异常：${signRet.s()}`)
        }
    })
}

const doExchangePolychromes = async () => {
    if (!isEnableExchangePolychromes) {
        return
    }
    let title = '获取兑换中心菲林兑换信息'
    lk.debug(title)
    const goodsInfo = await getPolychromesGoodsInfo(zzzBbsCookie, zzzDfp)
    lk.debug(goodsInfo.s(null, 2))
    if (!goodsInfo || goodsInfo?.total === 0 || goodsInfo?.account_exchange_num === goodsInfo?.account_cycle_limit) {
        lk.debug(`⚠️菲林已兑换`)
        return
    } else if (goodsInfo?.now_time > goodsInfo?.end && goodsInfo?.now_time < goodsInfo?.next_time) {
        lk.prependNotifyInfo(`⚠️未开放兑换, 下次兑换时间: ${lk.formatDate(new Date(goodsInfo?.next_time * 1000), "yyyy-MM-dd HH:mm")}`)
        return
    }
    title = '菲林兑换中...'
    lk.debug(title)
    await exchangePolychromes(goodsInfo, zzzBbsCookie, zzzDfp)
    title = '菲林兑换完成'
    lk.debug(title)
}

const exchangePolychromes = async (goodsInfo, cookie, dfp) => {
    await lk.req.post({
        url: `${bbsDomain}/common/homushop/v1/web/goods/exchange`,
        headers: {
            referer: "https://webstatic.miyoushe.com/",
            "x-rpc-device_fp": dfp,
            "x-rpc-client_type": 2,
            "x-rpc-app_version": appVersion,
            ds: getDs(),
            cookie
        },
        body: {
            "app_id" : 1,
            "point_sn" : "myb",
            "uid" : zzzUid,
            "region" : "prod_gf_cn",
            "game_biz" : "nap_cn",
            "address_id" : 0,
            "exchange_num" : 1,
            "goods_id" : goodsInfo?.goods_id
        }.s()
    }).then(({error, resp, data}) => {
        data = data.o()
        const retcode = data?.retcode
        // {"data":null,"message":"兑换周期内当前商品的可兑换数量超限","retcode":-2101}
        let message = `🎉菲林兑换成功`
        switch (retcode) {
            case 0:
                lk.debug(message)
                break
            default:
                message = data?.message
                lk.error(`❌菲林兑换失败: ${data?.message}`)
                lk.debug(data.s(), null, 2)
                lk.debug(cookie)
        }
        lk.prependNotifyInfo(message)
    })
}

const getPolychromesGoodsInfo = async (cookie, dfp) => {
    return await lk.req.get({
        url: `${bbsDomain}/common/homushop/v1/web/goods/list?app_id=1&point_sn=myb&page_size=50&page=1&game=nap`,
        headers: {
            referer: "https://webstatic.miyoushe.com/",
            "x-rpc-device_fp": dfp,
            "x-rpc-client_type": 2,
            "x-rpc-app_version": appVersion,
            ds: getDs(),
            cookie
        },
    }).then(({ error, resp, data }) => {
        data = data.o()
        if (data?.retcode !== 0) {
            return
        }
        return data?.data?.list.find((goods) => goods?.goods_name.indexOf("菲林*60") !== -1)
    })
}

const doBbsVoteAndShare = async () => {
    let title = '米游社获取帖子'
    await getBbsPost(title).then((postRet) => {
        if (postRet?.retcode != 0) {
            lk.appendNotifyInfo(`⚠️${title}异常：${postRet?.message}`)
            lk.execFail()
        }
        return postRet?.data?.list
    }).then(async (post) => {
        if (!post) {
            return post
        }
        await Promise.all(post.map(async (p) => {
            let postId = p.post.post_id
            return await viewPost(`浏览：${postId}`, postId, zzzBbsCookie, zzzDfp)
        })).then((ret) => {
            let sucCount = 0
            ret.forEach((r) => {
                if (r?.retcode == 0) {
                    sucCount++
                }
            })
            lk.appendNotifyInfo(`浏览结果：${sucCount}/${ret.length}`)
        })
        await Promise.all(post.map(async (p) => {
            let postId = p.post.post_id
            return await bbsUpVote(`点赞：${postId}`, postId, false, zzzBbsCookie, zzzDfp)
        })).then((ret) => {
            lk.log(ret.s())
            let sucCount = 0
            ret.forEach((r) => {
                if (r?.retcode == 0) {
                    sucCount++
                }
            })
            lk.appendNotifyInfo(`点赞结果：${sucCount}/${ret.length}`)
        })
        return post
    }).then(async (post) => {
        if (!post) {
            return post
        }
        await lk.sleep(1000)
        await Promise.all(post.map(async (p) => {
            let postId = p.post.post_id
            return await bbsUpVote(`取消点赞：${postId}`, postId, true, zzzBbsCookie, zzzDfp)
        })).then((ret) => {
            lk.log(ret.s())
            let sucCount = 0
            ret.forEach((r) => {
                if (r?.retcode == 0) {
                    sucCount++
                }
            })
            lk.appendNotifyInfo(`取消点赞结果：${sucCount}/${ret.length}`)
        })
        return post[0]
    }).then(async (post) => {
        if (!post) {
            return post
        }
        title = "米游社分享"
        await share(title, post.post.post_id, zzzBbsCookie, zzzDfp).then((ret) => {
            if (ret?.retcode == 0) {
                lk.appendNotifyInfo(`🎉${title}成功`)
            } else {
                lk.appendNotifyInfo(`❌${title}失败`)
                lk.execFail()
            }
        })
    })
}

const releasePost = async (times, cookie, dfp) => {
    const uid = lk.getCookieProp(cookie, "stuid")
    lk.log(uid)
    let ret = []
    for (let i = 0; i < times; i++) {
        const content = `${lk.formatDate(lk.now, "yyyy-MM-dd")}.${i+1}`
        let body = {
            "is_original": 0,
            "subject": "日常任务发完就删，求评论收藏🫵🏻",
            "gids": 8,
            "contribution_act": {
                "act_id": null,
                "game_uid": null,
                "title": null,
                "game_region": null,
                "game_nickname": null
            },
            "f_forum_id": "57",
            "uid": uid,
            "topic_ids": [
            ],
            "review_id": "",
            "is_profit": false,
            "is_pre_publication": false,
            "cover": "",
            "lottery": {
            },
            "forum_id": "57",
            "draft_id": "1854556897794879488",
            "structured_content": "[{\"insert\":\"" + content + "\\n\"}]",
            "link_card_ids": [
            ],
            "view_type": 1,
            "content": "<p>" + content + "<\/p>"
        }
        await lk.req.post({
            url: `${bbsDomain}/post/api/draft/save`,
            headers: {
                referer: "https://app.mihoyo.com",
                "x-rpc-device_fp": dfp,
                "x-rpc-client_type": 2,
                "x-rpc-app_version": appVersion,
                ds: getDs(),
                cookie
            },
            body: {
                "is_profit": false,
                "forum_id": body.forum_id,
                "view_type": 1,
                "content": body.content,
                "is_original": 0,
                "topic_ids": [],
                "structured_content": body.structured_content,
                "subject": body.subject,
                "cover": "",
                "gids": body.gids
            }.s(),
        }).then(({ error, resp, data }) => {
            lk.log(`草稿：${data}`)
            data = data.o()
            if (data?.retcode == 0) {
                return data?.data?.draft_id
            } else {
                lk.log(`保存草稿失败：${data.s()}`)
                lk.execFail()
            }
        }).then(async (draftId) => {
            if (!draftId) return
            body.draft_id = draftId
            await lk.req.post({
                url: `${bbsDomain}/post/api/releasePost/v2`,
                headers: {
                    referer: "https://app.mihoyo.com",
                    "x-rpc-device_fp": dfp,
                    "x-rpc-client_type": 2,
                    "x-rpc-app_version": appVersion,
                    ds: getDs(),
                    cookie
                },
                body: body.s(),
            }).then(({ error, resp, data }) => {
                data = data.o()
                if (data?.retcode == 0) {
                    ret.push(data?.data?.post_id)
                } else {
                    lk.log(`发帖失败：${body.s()}\n${data.s()}`)
                    lk.execFail()
                }
            })
            if (i < times - 1) {
                // 间隔10分钟
                await lk.sleep(10 * 60 * 1000)
            }
        })
    }
    return ret
}

const deletePost = async (title, postId, cookie, dfp) => {
    lk.log(`${title}开始。。。`)
    let body = {
        "post_id": `${postId}`
    }
    return await lk.req.post({
        url: `${bbsDomain}/post/api/deletePost`,
        headers: {
            referer: "https://app.mihoyo.com",
            "x-rpc-device_fp": dfp,
            "x-rpc-client_type": 2,
            "x-rpc-app_version": appVersion,
            ds: getDs(),
            cookie
        },
        body: body.s(),
    }).then(({ error, resp, data }) => {
        return data.o()
    })
}

const doReleasePost = async () => {
    let title = '发帖'
    const times = 2
    lk.log(`${title}开始。。。`)
    await releasePost(times, zzzBbsCookie, zzzDfp).then(async (posts) => {
        if (!posts) {
            lk.appendNotifyInfo(``)
            lk.execFail()
            return posts
        }
        lk.appendNotifyInfo(`${title}结果：${posts.length}/${times}`)
        return posts
    }).then(async (posts) => {
        await Promise.all(posts.map(async (p) => {
            return await deletePost(`删除帖子：${p}`, p, zzzBbsCookie, zzzDfp)
        })).then((ret) => {
            let sucCount = 0
            ret.forEach((r) => {
                if (r?.retcode == 0) {
                    sucCount++
                } else {
                    lk.execFail()
                    lk.logErr(`删除帖子失败：${r.s()}`)
                }
            })
            lk.appendNotifyInfo(`删帖结果：${sucCount}/${ret.length}`)
        })
    })
}

const all = async () => {
    if (!zzzUid || !zzzCookie || !zzzDfp || !zzzBbsCookie) {
        throw "⚠️请先打开米游社获取cookie"
    }
    const hours = lk.now.getHours()
    if (hours === 19) {
        await doExchangePolychromes()
    } else {
        if (zzzCloudGameCookie && zzzComboToken) {
            await doCloudGameDailyCheck()
        }
        await doSignIn()
        await doBbsSignIn()
        await doBbsVoteAndShare()
        await doReleasePost()
    }
}

const getDs = (task, body) => {
    lk.log(`getDs: task: ${task}, body: ${body}`)
    let randomStr = lk.randomString(6)
    let timestamp = Math.floor(Date.now() / 1000)
    let sign, ds, str
    switch (task) {
        case "signIn":
            const randomInt = Math.floor(Math.random() * (200000 - 100001) + 100001)
            str = `salt=${salt6x}&t=${timestamp}&r=${randomInt}&b=${body}&q=`
            sign = MD5(str)
            ds = `${timestamp},${randomInt},${sign}`
            break
        case "dailyCheckin":
            str = `salt=${salt6x}&t=${timestamp}&r=${randomStr}`
            if (body) {
                str = `${str}&b=${body}&q=`
            }
            sign = MD5(str)
            ds = `${timestamp},${randomStr},${sign}`
            break
        default:
            str = `salt=${saltK2}&t=${timestamp}&r=${randomStr}`
            if (body) {
                str = `${str}&b=${body}&q=`
            }
            sign = MD5(str)
            ds = `${timestamp},${randomStr},${sign}`
    }

    return ds
}

const main = () => {
    if (lk.isRequest()) {
        lk.done()
        return
    }
    lk.boxJsJsonBuilder(BoxJsInfo, BoxJsParam)
    all().catch((err) => {
        lk.logErr(err)
        lk.execFail()
        lk.msg(``, err, openUrl, bannerUrl)
    }).finally(() => {
        lk.msg(``, ``, openUrl, bannerUrl)
        lk.done()
    })
}

if(!lk.isExecComm) main()

// * ToolKit v1.5.0 build 204
function ToolKit(scriptName,scriptId,options){class Request{constructor(tk){this.tk=tk}fetch(options,method="GET"){options=typeof options=="string"?{url:options}:options;let fetcher;switch(method){case"PUT":fetcher=this.put;break;case"POST":fetcher=this.post;break;default:fetcher=this.get}const doFetch=new Promise((resolve,reject)=>{fetcher.call(this,options,(error,resp,data)=>error?reject({error,resp,data}):resolve({error,resp,data}))}),delayFetch=(promise,timeout=5e3)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error("请求超时")),timeout))]);return options.timeout>0?delayFetch(doFetch,options.timeout):doFetch}async get(options){return this.fetch.call(this.tk,options)}async post(options){return this.fetch.call(this.tk,options,"POST")}async put(options){return this.fetch.call(this.tk,options,"PUT")}}return new class{ab={info:1<<1,warn:1<<2,error:1<<3,debug:1<<4};aa={info:1<<1,warn:1<<2,error:1<<3,debug:1<<4};constructor(scriptName,scriptId,options){Object.prototype.s=function(replacer,space){return typeof this=="string"?this:JSON.stringify(this,replacer,space)},Object.prototype.o=function(reviver){return JSON.parse(this,reviver)},Object.prototype.getIgnoreCase=function(key){if(!key)throw"Key required";let target=this;try{typeof this=="string"&&(target=JSON.stringify(this))}catch{throw"It's not a JSON object or string!"}const ret=Object.keys(target).reduce((obj,key)=>(obj[key.toLowerCase()]=target[key],obj),{});return ret[key]},this.ab.warn|=this.aa.info,this.ab.error|=this.ab.warn,this.ab.debug|=this.ab.error,this.ac=this.ab.debug,this.userAgent=`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.2 Safari/605.1.15`,this.a=`lk`,this.name=scriptName,this.id=scriptId,this.req=new Request(this),this.data=null,this.b=this.fb(`${this.a}${this.id}.dat`),this.c=this.fb(`${this.a}${this.id}.boxjs.json`),this.d=options,this.d?.logLevel&&(this.ac=this.ab[this.d.logLevel]),this.isExecComm=!1,this.f=this.getVal(`${this.a}IsEnableLog${this.id}`),this.f=!!this.isEmpty(this.f)||this.f.o(),this.g=this.getVal(`${this.a}NotifyOnlyFail${this.id}`),this.g=!this.isEmpty(this.g)&&this.g.o(),this.h=this.getVal(`${this.a}IsEnableTgNotify${this.id}`),this.h=!this.isEmpty(this.h)&&this.h.o(),this.i=this.getVal(`${this.a}TgNotifyUrl${this.id}`),this.h=this.h?!this.isEmpty(this.i):this.h,this.j=`${this.a}CostTotalString${this.id}`,this.k=this.getVal(this.j),this.k=this.isEmpty(this.k)?`0,0`:this.k.replace('"',""),this.l=this.k.split(",")[0],this.m=this.k.split(",")[1],this.n=0,this.o="█",this.p="  ",this.now=new Date,this.q=this.now.getTime(),this.node=(()=>{if(this.isNode()){const request=require("request");return{request}}return null})(),this.r=!0,this.s=[],this.t="chavy_boxjs_cur__acs",this.u="chavy_boxjs__acs",this.v={"|`|":",backQuote,"},this.w={",backQuote,":"`","%2CbackQuote%2C":"`"},this.y={"_":"\\_","*":"\\*","`":"\\`"},this.x={"_":"\\_","*":"\\*","[":"\\[","]":"\\]","(":"\\(",")":"\\)","~":"\\~","`":"\\`",">":"\\>","#":"\\#","+":"\\+","-":"\\-","=":"\\=","|":"\\|","{":"\\{","}":"\\}",".":"\\.","!":"\\!"},this.log(`${this.name}, 开始执行!`),this.fd()}fb(_a){if(!this.isNode())return _a;let _b=process.argv.slice(1,2)[0].split("/");return _b[_b.length-1]=_a,_b.join("/")}fc(_a){const _c=this.path.resolve(_a),_d=this.path.resolve(process.cwd(),_a),_e=this.fs.existsSync(_c),_f=!_e&&this.fs.existsSync(_d);return{_c,_d,_e,_f}}async fd(){if(!this.isNode())return;if(this.e=process.argv.slice(1),this.e[1]!="p")return;this.isExecComm=!0,this.log(`开始执行指令【${this.e[1]}】=> 发送到其他终端测试脚本!`);let httpApi=this.d?.httpApi,_h;if(this.isEmpty(this?.d?.httpApi))this.log(`未设置options,使用默认值`),this.isEmpty(this?.d)&&(this.d={}),this.d.httpApi=`ffff@10.0.0.6:6166`,httpApi=this.d.httpApi,_h=httpApi.split("@")[1];else{if(typeof httpApi=="object")if(_h=this.isNumeric(this.e[2])?this.e[3]||"unknown":this.e[2],httpApi[_h])httpApi=httpApi[_h];else{const keys=Object.keys(httpApi);keys[0]?(_h=keys[0],httpApi=httpApi[keys[0]]):httpApi="error"}if(!/.*?@.*?:[0-9]+/.test(httpApi)){this.log(`❌httpApi格式错误!格式: ffff@3.3.3.18:6166`),this.done();return}}this.fe(this.e[2],_h,httpApi)}fe(timeout,_h,httpApi){let _i=this.e[0];const[_j,_k]=httpApi.split("@");this.log(`获取【${_i}】内容传给【${_h||_k}】`),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{_c,_d,_e,_f}=this.fc(_i);if(!_e&&!_f){lk.done();return}const _m=_e?_c:_d;let options={url:`http://${_k}/v1/scripting/evaluate`,headers:{"X-Key":_j},body:{script_text:new String(this.fs.readFileSync(_m)),mock_type:"cron",timeout:!this.isEmpty(timeout)&&timeout>5?timeout:5},json:!0};this.req.post(options).then(({error,resp,data})=>{this.log(`已将脚本【${_i}】发给【${_h||_k}】,执行结果: 
${this.p}error: ${error}
${this.p}resp: ${resp?.s()}
${this.p}data: ${this.fj(data)}`),this.done()}).catch(e=>{let _ae="",_l=!1;if(e?.error?.code)switch(e.error.code){case"EHOSTDOWN":_ae=`请检查配置的目标设备【${_h||_k}】是否在线！`,_l=!0;break;case"ECONNREFUSED":_ae=`目标设备【${_h||_k}】拒绝连接，请确认服务端口已开启且可访问！`,_l=!0;break;case"EHOSTUNREACH":_ae=`无法到达目标设备【${_h||_k}】，请检查网络连接和路由设置！`,_l=!0;break;case"ENETUNREACH":_ae=`网络不可达，无法访问目标设备【${_h||_k}】，请检查本地网络环境！`,_l=!0;break;case"ETIMEDOUT":_ae=`连接目标设备【${_h||_k}】超时，请检查网络状况或目标设备响应状态！`,_l=!0;break;case"ECONNRESET":_ae=`与目标设备【${_h||_k}】的连接被重置，可能是设备重启或网络异常！`,_l=!0;break;case"ENOTFOUND":_ae=`未能解析目标设备地址【${_h||_k}】，请检查配置的主机名或DNS设置！`,_l=!0;break;case"EADDRINUSE":_ae=`本地端口已被占用，无法建立与目标设备【${_h||_k}】的连接！`,_l=!0;break;case"EACCES":_ae=`权限不足，无法访问目标设备【${_h||_k}】！`,_l=!0;break;default:_l=!1}if(!_l)throw e;this.log(_ae)})}boxJsJsonBuilder(info,param){if(!this.isNode())return;if(!this.isJsonObject(info)||!this.isJsonObject(param)){this.log("构建BoxJsJson传入参数格式错误,请传入json对象");return}let _p=param?.targetBoxjsJsonPath||"/Users/lowking/Desktop/Scripts/lowking.boxjs.json";if(!this.fs.existsSync(_p))return;this.log("using node");let _q=["settings","keys"];const _r="https://raw.githubusercontent.com/Orz-3";let boxJsJson={},scritpUrl="#lk{script_url}";if(boxJsJson.id=`${this.a}${this.id}`,boxJsJson.name=this.name,boxJsJson.desc_html=`⚠️使用说明</br>详情【<a href='${scritpUrl}?raw=true'><font class='red--text'>点我查看</font></a>】`,boxJsJson.icons=[`${_r}/mini/master/Alpha/${this.id.toLocaleLowerCase()}.png`,`${_r}/mini/master/Color/${this.id.toLocaleLowerCase()}.png`],boxJsJson.keys=[],boxJsJson.settings=[{id:`${this.a}IsEnableLog${this.id}`,name:"开启/关闭日志",val:!0,type:"boolean",desc:"默认开启"},{id:`${this.a}NotifyOnlyFail${this.id}`,name:"只当执行失败才通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.a}IsEnableTgNotify${this.id}`,name:"开启/关闭Telegram通知",val:!1,type:"boolean",desc:"默认关闭"},{id:`${this.a}TgNotifyUrl${this.id}`,name:"Telegram通知地址",val:"",type:"text",desc:"Tg的通知地址,如: https://api.telegram.org/bot-token/sendMessage?chat_id=-100140&parse_mode=Markdown&text="}],boxJsJson.author="#lk{author}",boxJsJson.repo="#lk{repo}",boxJsJson.script=`${scritpUrl}?raw=true`,!this.isEmpty(info))for(let key of _q){if(this.isEmpty(info[key]))break;if(key==="settings")for(let i=0;i<info[key].length;i++){let input=info[key][i];for(let j=0;j<boxJsJson.settings.length;j++){let def=boxJsJson.settings[j];input.id===def.id&&boxJsJson.settings.splice(j,1)}}boxJsJson[key]=boxJsJson[key].concat(info[key]),delete info[key]}Object.assign(boxJsJson,info),this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{_c,_d,_e,_f}=this.fc(this.c),_g=boxJsJson.s(null,"	");_e?this.fs.writeFileSync(_c,_g):_f?this.fs.writeFileSync(_d,_g):this.fs.writeFileSync(_c,_g);let boxjsJson=this.fs.readFileSync(_p).o();if(!boxjsJson?.apps||!Array.isArray(boxjsJson.apps)){this.log(`⚠️请在boxjs订阅json文件中添加根属性: apps, 否则无法自动构建`);return}let apps=boxjsJson.apps,targetIdx=apps.indexOf(apps.filter(app=>app.id==boxJsJson.id)[0]);targetIdx>=0?boxjsJson.apps[targetIdx]=boxJsJson:boxjsJson.apps.push(boxJsJson);let ret=boxjsJson.s(null,2);if(!this.isEmpty(param))for(const key in param){let val=param[key];if(!val)switch(key){case"author":val="@lowking";break;case"repo":val="https://github.com/lowking/Scripts";break;default:continue}ret=ret.replaceAll(`#lk{${key}}`,val)}const regex=/(?:#lk\{)(.+?)(?=\})/;let m=regex.exec(ret);m!==null&&this.log(`⚠️生成BoxJs还有未配置的参数,请参考:
${this.p}https://github.com/lowking/Scripts/blob/master/util/example/ToolKitDemo.js#L17-L19
${this.p}传入参数: `);let _n=new Set;for(;(m=regex.exec(ret))!==null;)_n.add(m[1]),ret=ret.replace(`#lk{${m[1]}}`,``);_n.forEach(p=>console.log(`${this.p}${p}`)),this.fs.writeFileSync(_p,ret)}isJsonObject(obj){return typeof obj=="object"&&Object.prototype.toString.call(obj).toLowerCase()=="[object object]"&&!obj.length}appendNotifyInfo(info,type){type==1?this.s=info:this.s.push(info)}prependNotifyInfo(info){this.s.splice(0,0,info)}execFail(){this.r=!1}isRequest(){return typeof $request!="undefined"}isSurge(){return typeof $httpClient!="undefined"}isQuanX(){return typeof $task!="undefined"}isLoon(){return typeof $loon!="undefined"}isJSBox(){return typeof $app!="undefined"&&typeof $http!="undefined"}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}isNode(){return typeof require=="function"&&!this.isJSBox()}sleep(ms){return this.n+=ms,new Promise(resolve=>setTimeout(resolve,ms))}randomSleep(minMs,maxMs){return this.sleep(this.randomNumber(minMs,maxMs))}randomNumber(min,max){return Math.floor(Math.random()*(max-min+1)+min)}log(message){if(!this.f)return;this.ac===this.ab.debug&&console.log(`
${this.o}DEBUG${this.o}${message}`)}info(message){if(!this.f)return;this.ac&this.aa.info&&console.log(`
${this.o}INFO${this.o}${message}`)}warn(message){if(!this.f)return;this.ac&this.aa.warn&&console.log(`
${this.o}WARN${this.o}${message}`)}error(message){if(!this.f)return;this.ac&this.aa.error&&console.log(`
${this.o}ERROR${this.o}${message}`)}debug(message){if(!this.f)return;this.ac===this.ab.debug&&console.log(`
${this.o}DEBUG${this.o}${message}`)}logErr(message){if(this.r=!0,this.f){let msg="";this.isEmpty(message.error)||(msg=`${msg}
${this.p}${message.error.s()}`),this.isEmpty(message.message)||(msg=`${msg}
${this.p}${message.message.s()}`),msg=`${this.o}${this.name}执行异常:${this.p}${msg}`,message&&(msg=`${msg}
${this.p}${message.s()}`),console.log(msg)}}ff(mapping,message){for(let key in mapping){if(!mapping.hasOwnProperty(key))continue;message=message.replaceAll(key,mapping[key])}return message}msg(subtitle,message,openUrl,mediaUrl,copyText,disappearS){if(!this.isRequest()&&this.g&&this.r)return;if(this.isEmpty(message)&&(Array.isArray(this.s)?message=this.s.join(`
`):message=this.s),this.isEmpty(message))return;if(this.h){this.log(`${this.name}Tg通知开始`);const fa=this.i&&this.i.indexOf("parse_mode=Markdown")!=-1;if(fa){message=this.ff(this.v,message);let _t=this.y;this.i.indexOf("parse_mode=MarkdownV2")!=-1&&(_t=this.x),message=this.ff(_t,message)}message=`📌${this.name}
${message}`,fa&&(message=this.ff(this.w,message));let u=`${this.i}${encodeURIComponent(message)}`;this.req.get({url:u})}else{let options={};const _u=!this.isEmpty(openUrl),_v=!this.isEmpty(mediaUrl),_w=!this.isEmpty(copyText),_x=disappearS>0;this.isSurge()||this.isLoon()||this.isStash()?(_u&&(options.url=openUrl,options.action="open-url"),_w&&(options.text=copyText,options.action="clipboard"),this.isSurge()&&_x&&(options["auto-dismiss"]=disappearS),_v&&(options["media-url"]=mediaUrl),$notification.post(this.name,subtitle,message,options)):this.isQuanX()?(_u&&(options["open-url"]=openUrl),_v&&(options["media-url"]=mediaUrl),$notify(this.name,subtitle,message,options)):this.isNode()?this.log("⭐️"+this.name+`
`+subtitle+`
`+message):this.isJSBox()&&$push.schedule({title:this.name,body:subtitle?subtitle+`
`+message:message})}}getVal(key,defaultValue){let value;return this.isSurge()||this.isLoon()||this.isStash()?value=$persistentStore.read(key):this.isQuanX()?value=$prefs.valueForKey(key):this.isNode()?(this.data=this.fh(),value=process.env[key]||this.data[key]):value=this.data&&this.data[key]||null,value||defaultValue}fg(key,val){if(key==this.u)return;const _y=`${this.a}${this.id}`;let _z=this.getVal(this.t,"{}").o();if(!_z.hasOwnProperty(_y))return;let curSessionId=_z[_y],_aa=this.getVal(this.u,"[]").o();if(_aa.length==0)return;let _ab=[];if(_aa.forEach(_ac=>{_ac.id==curSessionId&&(_ab=_ac.datas)}),_ab.length==0)return;let _ad=!1;_ab.forEach(kv=>{kv.key==key&&(kv.val=val,_ad=!0)}),_ad||_ab.push({key,val}),_aa.forEach(_ac=>{_ac.id==curSessionId&&(_ac.datas=_ab)}),this.setVal(this.u,_aa.s())}setVal(key,val){return this.isSurge()||this.isLoon()||this.isStash()?(this.fg(key,val),$persistentStore.write(val,key)):this.isQuanX()?(this.fg(key,val),$prefs.setValueForKey(val,key)):this.isNode()?(this.data=this.fh(),this.data[key]=val,this.fi(),!0):this.data&&this.data[key]||null}fh(){if(!this.isNode())return{};this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{_c,_d,_e,_f}=this.fc(this.b);if(_e||_f){const _m=_e?_c:_d;return this.fs.readFileSync(_m).o()}return{}}fi(){if(!this.isNode())return;this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const{_c,_d,_e,_f}=this.fc(this.b),_g=this.data.s();_e?this.fs.writeFileSync(_c,_g):_f?this.fs.writeFileSync(_d,_g):this.fs.writeFileSync(_c,_g)}fj(data){const _s=`${this.p}${this.p}`;let ret="";return Object.keys(data).forEach(key=>{let lines=data[key]?.s().split(`
`);key=="output"&&(lines=lines.slice(0,-2)),ret=`${ret}
${_s}${key}:
${_s}${this.p}${lines?.join(`
${_s}${this.p}`)}`}),ret}fk(response){return response&&(response.status=response?.status||response?.statusCode,delete response.statusCode,response)}get(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.get(options,(error,response,body)=>{callback(error,this.fk(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="GET",$task.fetch(options).then(response=>{callback(null,this.fk(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request(options,(error,response,body)=>{callback(error,this.fk(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.get(options))}post(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?$httpClient.post(options,(error,response,body)=>{callback(error,this.fk(response),body)}):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="POST",$task.fetch(options).then(response=>{callback(null,this.fk(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?this.node.request.post(options,(error,response,body)=>{callback(error,this.fk(response),body)}):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}put(options,callback=()=>{}){this.isSurge()||this.isLoon()||this.isStash()?(options.method="PUT",$httpClient.put(options,(error,response,body)=>{callback(error,this.fk(response),body)})):this.isQuanX()?(typeof options=="string"&&(options={url:options}),options.method="PUT",$task.fetch(options).then(response=>{callback(null,this.fk(response),response.body)},reason=>callback(reason.error,null,null))):this.isNode()?(options.method="PUT",this.node.request.put(options,(error,response,body)=>{callback(error,this.fk(response),body)})):this.isJSBox()&&(typeof options=="string"&&(options={url:options}),options.header=options.headers,options.handler=function(resp){let error=resp.error;error&&(error=resp.error.s());let body=resp.data;typeof body=="object"&&(body=resp.data.s()),callback(error,this.adapterStatus(resp.response),body)},$http.post(options))}sum(a,b){let aa=Array.from(a,Number),bb=Array.from(b,Number),ret=[],c=0,i=Math.max(a.length,b.length);for(;i--;)c+=(aa.pop()||0)+(bb.pop()||0),ret.unshift(c%10),c=Math.floor(c/10);for(;c;)ret.unshift(c%10),c=Math.floor(c/10);return ret.join("")}fl(){let info=`${this.name}, 执行完毕!`;this.isNode()&&this.isExecComm&&(info=`指令【${this.e[1]}】执行完毕!`);const endTime=(new Date).getTime(),ms=endTime-this.q,fl=ms/1e3,count=this.sum(this.m,"1"),total=this.sum(this.l,ms.s()),average=(Number(total)/Number(count)/1e3).toFixed(4);info=`${info}
${this.p}耗时【${fl}】秒(含休眠${this.n?(this.n/1e3).toFixed(4):0}秒)`,info=`${info}
${this.p}总共执行【${count}】次,平均耗时【${average}】秒`,info=`${info}
${this.p}ToolKit v1.5.0 build 204.`,this.log(info),this.setVal(this.j,`${total},${count}`.s())}done(value={}){this.fl(),(this.isSurge()||this.isQuanX()||this.isLoon()||this.isStash())&&$done(value)}getRequestUrl(){return $request.url}getResponseBody(){return $response.body}isMatch(reg){return!!($request.method!="OPTIONS"&&this.getRequestUrl().match(reg))}isEmpty(obj){return typeof obj=="undefined"||obj==null||obj.s()=="{}"||obj==""||obj.s()=='""'||obj.s()=="null"||obj.s()=="undefined"||obj.length===0}isNumeric(s){return!isNaN(parseFloat(s))&&isFinite(s)}randomString(len,chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"){len=len||32;let maxPos=chars.length,pwd="";for(let i=0;i<len;i++)pwd+=chars.charAt(Math.floor(Math.random()*maxPos));return pwd}autoComplete(str,prefix,suffix,fill,len,direction,ifCode,clen,startIndex,cstr){if(str+=``,str.length<len)for(;str.length<len;)direction==0?str+=fill:str=fill+str;if(ifCode){let temp=``;for(let i=0;i<clen;i++)temp+=cstr;str=str.substring(0,startIndex)+temp+str.substring(clen+startIndex)}return str=prefix+str+suffix,this.toDBC(str)}customReplace(str,param,prefix,suffix){try{this.isEmpty(prefix)&&(prefix="#{"),this.isEmpty(suffix)&&(suffix="}");for(let i in param)str=str.replace(`${prefix}${i}${suffix}`,param[i])}catch(e){this.logErr(e)}return str}toDBC(txtstring){let tmp="";for(let i=0;i<txtstring.length;i++)txtstring.charCodeAt(i)==32?tmp=tmp+String.fromCharCode(12288):txtstring.charCodeAt(i)<127&&(tmp=tmp+String.fromCharCode(txtstring.charCodeAt(i)+65248));return tmp}hash(str){let h=0,i,chr;for(i=0;i<str.length;i++)chr=str.charCodeAt(i),h=(h<<5)-h+chr,h|=0;return String(h)}formatDate(date,format){let o={"M+":date.getMonth()+1,"d+":date.getDate(),"H+":date.getHours(),"m+":date.getMinutes(),"s+":date.getSeconds(),"q+":Math.floor((date.getMonth()+3)/3),S:date.getMilliseconds()};/(y+)/.test(format)&&(format=format.replace(RegExp.$1,(date.getFullYear()+"").substr(4-RegExp.$1.length)));for(let k in o)new RegExp("("+k+")").test(format)&&(format=format.replace(RegExp.$1,RegExp.$1.length==1?o[k]:("00"+o[k]).substr((""+o[k]).length)));return format}getCookieProp(ca,cname){const name=cname+"=";ca=ca.split(";");for(let i=0;i<ca.length;i++){let c=ca[i].trim();if(c.indexOf(name)==0)return c.substring(name.length).replace('"',"").trim()}return""}parseHTML(htmlString){let parser=new DOMParser,document=parser.parseFromString(htmlString,"text/html");return document.body}}(scriptName,scriptId,options)}