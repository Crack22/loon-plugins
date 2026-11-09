// 作者：許諾
const chavy = init()
const cookieName = '中国联通'
const KEY_loginurl = 'chavy_tokenurl_10010'
const KEY_loginheader = 'chavy_tokenheader_10010'
const KEY_signurl = 'chavy_signurl_10010'
const KEY_signheader = 'chavy_signheader_10010'
const KEY_loginlotteryurl = 'chavy_loginlotteryurl_10010'
const KEY_loginlotteryheader = 'chavy_loginlotteryheader_10010'
const KEY_findlotteryurl = 'chavy_findlotteryurl_10010'
const KEY_findlotteryheader = 'chavy_findlotteryheader_10010'
const chavygolottery = true
const chavygosign = true

const signinfo = {}
let VAL_loginurl = chavy.getdata(KEY_loginurl)
let VAL_loginheader = chavy.getdata(KEY_loginheader)
let VAL_signurl = chavy.getdata(KEY_signurl)
let VAL_signheader = chavy.getdata(KEY_signheader)
let VAL_loginlotteryurl = chavy.getdata(KEY_loginlotteryurl)
let VAL_loginlotteryheader = chavy.getdata(KEY_loginlotteryheader)
let VAL_findlotteryurl = chavy.getdata(KEY_findlotteryurl)
let VAL_findlotteryheader = chavy.getdata(KEY_findlotteryheader)
let golottery = JSON.parse(chavy.getdata("chavy_golottery_10010")||chavygolottery)
let gosign = JSON.parse(chavy.getdata("chavy_gosign_10010")||chavygosign)

;(sign = async () => {
    chavy.log(`🔔 ${cookieName}`)
    await loginapp()
    if (gosign == true) await signapp()
    if (golottery == true) {
      if (VAL_loginlotteryurl && VAL_findlotteryurl) await loginlottery()
      if (signinfo.encryptmobile) {
        await findlottery()
        if (signinfo.findlottery && signinfo.findlottery.acFrequency && signinfo.findlottery.acFrequency.usableAcFreq) {
            for (let i = 0; i < signinfo.findlottery.acFrequency.usableAcFreq; i++) {
                await lottery()
            }
        }
      }
    }
    await getinfo()
    showmsg()
})()
  .catch((e) => chavy.log(`❌ ${cookieName} 签到失败: ${e}`))
  .finally(() => chavy.done())

function loginapp() {
    return new Promise((resolve, reject) => {
        const url = { url: VAL_loginurl, headers: JSON.parse(VAL_loginheader) }
        chavy.post(url, (error, response, data) => {
            try {
                resolve()
            } catch (e) {
                chavy.msg(cookieName, `登录结果: 失败`, `说明: ${e}`)
                chavy.log(`❌ ${cookieName} loginapp - 登录失败: ${e}`)
                chavy.log(`❌ ${cookieName} loginapp - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function signapp() {
    return new Promise((resolve, reject) => {
        if (VAL_signurl.endsWith('.do')) VAL_signurl = VAL_signurl.replace('.do', '')
        const url = { url: 'https://act.10010.com/SigninApp/signin/daySign', headers: JSON.parse(VAL_signheader) }
        chavy.post(url, (error, response, data) => {
            try {
                signinfo.signapp = JSON.parse(data)
                resolve()
            } catch (e) {
                chavy.msg(cookieName, `签到结果: 失败`, `说明: ${e}`)
                chavy.log(`❌ ${cookieName} signapp - 签到失败: ${e}`)
                chavy.log(`❌ ${cookieName} signapp - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function loginlottery() {
    return new Promise((resolve, reject) => {
        const url = { url: VAL_loginlotteryurl, headers: JSON.parse(VAL_loginlotteryheader) }
        chavy.get(url, (error, response, data) => {
            try {
                const encryptmobileMatch = data.match(/encryptmobile=([^('|")]*)/)
                if (encryptmobileMatch) {
                    signinfo.encryptmobile = encryptmobileMatch[1]
                } else {
                    chavy.msg(cookieName, `获取抽奖令牌: 失败`, `说明: ${e}`)
                    chavy.log(`❌ ${cookieName} loginlottery - 获取抽奖令牌失败: ${e}`)
                    chavy.log(`❌ ${cookieName} loginlottery - response: ${JSON.stringify(response)}`)
                }
                resolve()
            } catch (e) {
                chavy.msg(cookieName, `登录抽奖: 失败`, `说明: ${e}`)
                chavy.log(`❌ ${cookieName} loginlottery - 登录抽奖失败: ${e}`)
                chavy.log(`❌ ${cookieName} loginlottery - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function findlottery() {
    return new Promise((resolve, reject) => {
        VAL_findlotteryurl = VAL_findlotteryurl.replace(/encryptmobile=[^(&|$)]*/, `encryptmobile=${signinfo.encryptmobile}`)
        VAL_findlotteryurl = VAL_findlotteryurl.replace(/mobile=[^(&|$)]*/, `mobile=${signinfo.encryptmobile}`)
        const url = { url: VAL_findlotteryurl, headers: JSON.parse(VAL_findlotteryheader) }
        chavy.get(url, (error, response, data) => {
            try {
                signinfo.findlottery = JSON.parse(data)
                resolve()
            } catch (e) {
                chavy.msg(cookieName, `获取抽奖次数: 失败`, `说明: ${e}`)
                chavy.log(`❌ ${cookieName} findlottery - 获取抽奖次数失败: ${e}`)
                chavy.log(`❌ ${cookieName} findlottery - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function lottery() {
    return new Promise((resolve, reject) => {
        const url = { url: `https://m.client.10010.com/dailylottery/static/doubleball/choujiang?usernumberofjsp=${signinfo.encryptmobile}`, headers: JSON.parse(VAL_loginlotteryheader) }
        url.headers['Referer'] = `https://m.client.10010.com/dailylottery/static/doubleball/firstpage?encryptmobile=${signinfo.encryptmobile}`
        chavy.post(url, (error, response, data) => {
            try {
                signinfo.lotterylist = signinfo.lotterylist ? signinfo.lotterylist : []
                signinfo.lotterylist.push(JSON.parse(data))
                resolve()
            } catch (e) {
                chavy.msg(cookieName, `抽奖结果: 失败`, `说明: ${e}`)
                chavy.log(`❌ ${cookieName} lottery - 抽奖失败: ${e}`)
                chavy.log(`❌ ${cookieName} lottery - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function gettel() {
    const reqheaders = JSON.parse(VAL_signheader)
    const reqreferer = reqheaders.Referer
    const reqCookie = reqheaders.Cookie
    let tel = ''
    if (reqreferer.indexOf(`desmobile=`) >= 0) tel = reqreferer.match(/desmobile=(.*?)(&|$)/)[1]
    if (tel == '' && reqCookie.indexOf(`u_account=`) >= 0) tel = reqCookie.match(/u_account=(.*?);/)[1]
    return tel
}


function getinfo() {
    return new Promise((resolve, reject) => {
        const url = { url: `https://m.client.10010.com/mobileService/home/queryUserInfoSeven.htm?version=iphone_c@7.0403&desmobiel=${gettel()}&showType=3`, headers: {"Cookie": JSON.parse(VAL_loginheader)["Cookie"]}}
        chavy.get(url, (error, response, data) => {
            try {
                signinfo.info = JSON.parse(data)
                resolve()
            } catch (e) {
                chavy.msg(cookieName, `获取余量: 失败`, `说明: ${e}`)
                chavy.log(`❌ ${cookieName} getinfo - 获取余量失败: ${e}`)
                chavy.log(`❌ ${cookieName} getinfo - response: ${JSON.stringify(response)}`)
                resolve()
            }
        })
    })
}

function showmsg() {
    let subTitle = ''
    let detail = ''
    console.log(signinfo)
    // 签到结果
    if (gosign == true) {
      if (signinfo.signapp.status == '0000') {
        subTitle = `签到: 成功 `
        detail = `积分: +${signinfo.signapp.data.prizeCount}, 成长值: +${signinfo.signapp.data.growthV}, 鲜花: +${signinfo.signapp.data.flowerCount}`
      } else if (signinfo.signapp.status == '0002') {
        subTitle = `签到: 重复 `
      } else {
        subTitle = `签到: 失败 `
        chavy.log(`❌ ${cookieName} signapp - response: ${JSON.stringify(signinfo.signapp)}`)
      }
    }

    if (signinfo.info.code == 'Y') {
        // 基本信息
        detail = detail ? `${detail}\n` : ``
        const traffic = signinfo.info.data.dataList[0]
        const flow = signinfo.info.data.dataList[1]
        const voice = signinfo.info.data.dataList[2]
        const credit = signinfo.info.data.dataList[3]
        const back = signinfo.info.data.dataList[4]
        const money = signinfo.info.data.dataList[5]
        detail = `${traffic.remainTitle}: ${traffic.number}${traffic.unit}, ${flow.remainTitle}: ${flow.number}${flow.unit}, ${voice.remainTitle}: ${voice.number}${voice.unit}, ${credit.remainTitle}: ${credit.number}${credit.unit}, ${back.remainTitle}: ${back.number}${back.unit}, ${money.remainTitle}: ${money.number}${money.unit}`
    } else {
        chavy.log(`❌ ${cookieName} signapp - response: ${JSON.stringify(signinfo.info)}`)
    }
    
    if (golottery == true) {
      if (signinfo.findlottery && signinfo.findlottery.acFrequency && signinfo.lotterylist) {
        subTitle += `抽奖: ${signinfo.findlottery.acFrequency.usableAcFreq}次`
        detail += '\n查看详情\n'

        for (let i = 0; i < signinfo.findlottery.acFrequency.usableAcFreq; i++) {
            detail += `\n抽奖 (${i + 1}): ${signinfo.lotterylist[i].RspMsg}`
        }
      } else {
        chavy.log(`❌ ${cookieName} signapp - response: ${JSON.stringify(signinfo.findlottery)}`)
      }
    }

    chavy.msg(cookieName, subTitle, detail)
}

function init() {
    isSurge = () => {
        return undefined === this.$httpClient ? false : true
    }
    isQuanX = () => {
        return undefined === this.$task ? false : true
    }
    getdata = (key) => {
        if (isSurge()) return $persistentStore.read(key)
        if (isQuanX()) return $prefs.valueForKey(key)
    }
    setdata = (key, val) => {
        if (isSurge()) return $persistentStore.write(key, val)
        if (isQuanX()) return $prefs.setValueForKey(key, val)
    }
    msg = (title, subtitle, body) => {
        if (isSurge()) $notification.post(title, subtitle, body)
        if (isQuanX()) $notify(title, subtitle, body)
    }
    log = (message) => console.log(message)
    get = (url, cb) => {
        if (url['headers'] != undefined) {
            delete url['headers']['Content-Length']
            console.log(url['headers'])
        }
        if (isSurge()) {
            $httpClient.get(url, cb)
        }
        if (isQuanX()) {
            url.method = 'GET'
            $task.fetch(url).then((resp) => cb(null, resp, resp.body))
        }
    }
    post = (url, cb) => {
        if (url['headers'] != undefined) {
            delete url['headers']['Content-Length']
            console.log(url['headers'])
        }
        if (isSurge()) {
            $httpClient.post(url, cb)
        }
        if (isQuanX()) {
            url.method = 'POST'
            $task.fetch(url).then((resp) => cb(null, resp, resp.body))
        }
    }
    done = (value = {}) => {
        $done(value)
    }
    return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, done }
}
