// 作者：許諾
var cookieName = '七猫小说'
var qmnovel = init()
var DCURL = qmnovel.getdata("UrlDC")
var DCKEY = qmnovel.getdata("CookieDC")
var NCURL = qmnovel.getdata("UrlNC")
var NCKEY = qmnovel.getdata("CookieNC")
var LTURL = qmnovel.getdata("UrlLT")
var LTKEY = qmnovel.getdata("CookieLT")
var VCURL = qmnovel.getdata("UrlVC")

const Totalresult = {}
const time = 0

let isGetCookie = typeof $request !== 'undefined'

if (isGetCookie) {
   GetCookie()
   qmnovel.done()
} else {
   all()
   qmnovel.done()
}

async function all() {
  qmnovel.log(`🔔 ${cookieName}签到开始`)
  await DailyCheckin(time);
  await NoviceCheckin(time);
  for (let i = 0; i < 5; i++) { 
      await LuckyTurn(time);
  }
  await VideoCoin(time)
  Notify();
}

function GetCookie() {
  const dailycheckin = '/api/v1/sign-in/do-sign-in';
  const novice = '/api/v1/task/get-novice-reward';
  const turn = '/api/v2/lucky-draw/do-extracting';
  const video = '/api/v1/sign-in/sign-in-video-coin';
  var url = $request.url;
  if (url.indexOf(dailycheckin) != -1) {
     if (url) {
        var UrlKeyDC = "UrlDC";
        var UrlNameDC = "七猫小说日常签到";
        var UrlValueDC = url;
        if (qmnovel.getdata(UrlKeyDC) != (undefined || null)) {
           if (qmnovel.getdata(UrlKeyDC) != UrlValueDC) {
              var urlDC = qmnovel.setdata(UrlValueDC, UrlKeyDC);
              if (!urlDC) {
                 qmnovel.msg("更新" + UrlNameDC + "Url失败‼️", "", "");
                 } else {
                 qmnovel.msg("更新" + UrlNameDC + "Url成功🎉", "", "");
                 }
           } else {
              qmnovel.msg(UrlNameDC + "Url未变化❗️", "", "");
           }
        } else {
           var urlDC = qmnovel.setdata(UrlValueDC, UrlKeyDC);
           if (!cookieDC) {
              qmnovel.msg("首次写入" + UrlNameDC + "Url失败‼️", "", "");
              } else {
              qmnovel.msg("首次写入" + UrlNameDC + "Url成功🎉", "", "");
              }
        }
     } else {
        qmnovel.msg("写入" + UrlNameDC + "Url失败‼️", "", "配置错误, 无法读取URL, ");
     }
     if ($request.headers) {
        var CookieKeyDC = "CookieDC";
        var CookieNameDC = "七猫小说日常签到及视频奖励";
        var CookieValueDC = JSON.stringify($request.headers);
        if (qmnovel.getdata(CookieKeyDC) != (undefined || null)) {
           if (qmnovel.getdata(CookieKeyDC) != CookieValueDC) {
              var cookieDC = qmnovel.setdata(CookieValueDC, CookieKeyDC);
              if (!cookieDC) {
                 qmnovel.msg("更新" + CookieNameDC + "Cookie失败‼️", "", "");
                 } else {
                 qmnovel.msg("更新" + CookieNameDC + "Cookie成功🎉", "", "");
                 }
           } else {
              qmnovel.msg(CookieNameDC + "Cookie未变化❗️", "", "");
           }
        } else {
           var cookieDC = qmnovel.setdata(CookieValueDC, CookieKeyDC);
           if (!cookieDC) {
              qmnovel.msg("首次写入" + CookieNameDC + "Cookie失败‼️", "", "");
              } else {
              qmnovel.msg("首次写入" + CookieNameDC + "Cookie成功🎉", "", "");
              }
        }
     } else {
        qmnovel.msg("写入" + CookieNameDC + "Cookie失败‼️", "", "配置错误, 无法读取请求头, ");
     }
  } else if (url.indexOf(novice) != -1) {
     if (url) {
        var UrlKeyNC = "UrlNC";
        var UrlNameNC = "七猫小说新人签到";
        var UrlValueNC = url;
        if (qmnovel.getdata(UrlKeyNC) != (undefined || null)) {
           if (qmnovel.getdata(UrlKeyNC) != UrlValueNC) {
              var urlNC = qmnovel.setdata(UrlValueNC, UrlKeyNC);
              if (!urlNC) {
                 qmnovel.msg("更新" + UrlNameNC + "Url失败‼️", "", "");
                 } else {
                 qmnovel.msg("更新" + UrlNameNC + "Url成功🎉", "", "");
                 }
           } else {
              qmnovel.msg(UrlNameNC + "Url未变化❗️", "", "");
           }
        } else {
           var urlNC = qmnovel.setdata(UrlValueNC, UrlKeyNC);
           if (!urlNC) {
              qmnovel.msg("首次写入" + UrlNameNC + "Url失败‼️", "", "");
              } else {
              qmnovel.msg("首次写入" + UrlNameNC + "Url成功🎉", "", "");
              }
        }
     } else {
        qmnovel.msg("写入" + UrlNameNC + "Url失败‼️", "", "配置错误, 无法读取URL, ");
     }    
     if ($request.headers) {
        var CookieKeyNC = "CookieNC";
        var CookieNameNC = "七猫小说新人签到";
        var CookieValueNC = JSON.stringify($request.headers);
        if (qmnovel.getdata(CookieKeyNC) != (undefined || null)) {
           if (qmnovel.getdata(CookieKeyNC) != CookieValueNC) {
              var cookieNC = qmnovel.setdata(CookieValueNC, CookieKeyNC);
              if (!cookieNC) {
                 qmnovel.msg("更新" + CookieNameNC + "Cookie失败‼️", "", "");
                 } else {
                 qmnovel.msg("更新" + CookieNameNC + "Cookie成功🎉", "", "");
                 }
           } else {
              qmnovel.msg(CookieNameNC + "Cookie未变化❗️", "", "");
           }
        } else {
           var cookieNC = qmnovel.setdata(CookieValueNC, CookieKeyNC);
           if (!cookieNC) {
              qmnovel.msg("首次写入" + CookieNameNC + "Cookie失败‼️", "", "");
              } else {
              qmnovel.msg("首次写入" + CookieNameNC + "Cookie成功🎉", "", "");
              }
        }
     } else {
        qmnovel.msg("写入" + CookieNameNC + "Cookie失败‼️", "", "配置错误, 无法读取请求头, ");
     }
  } else if (url.indexOf(turn) != -1) {
     if (url) {
        var UrlKeyLT = "UrlLT";
        var UrlNameLT = "七猫小说幸运大转盘";
        var UrlValueLT = url;
        if (qmnovel.getdata(UrlKeyLT) != (undefined || null)) {
           if (qmnovel.getdata(UrlKeyLT) != UrlValueLT) {
              var urlLT = qmnovel.setdata(UrlValueLT, UrlKeyLT);
              if (!urlLT) {
                 qmnovel.msg("更新" + UrlNameLT + "Url失败‼️", "", "");
                 } else {
                 qmnovel.msg("更新" + UrlNameLT + "Url成功🎉", "", "");
                 }
           } else {
              qmnovel.msg(UrlNameLT + "Url未变化❗️", "", "");
           }
        } else {
           var urlLT = qmnovel.setdata(UrlValueLT, UrlKeyLT);
           if (!urlLT) {
              qmnovel.msg("首次写入" + UrlNameLT + "Url失败‼️", "", "");
              } else {
              qmnovel.msg("首次写入" + UrlNameLT + "Url成功🎉", "", "");
              }
        }
     } else {
        qmnovel.msg("写入" + UrlNameLT + "Url失败‼️", "", "配置错误, 无法读取URL, ");
     }
     if ($request.headers) {
        var CookieKeyLT = "CookieLT";
        var CookieNameLT = "七猫小说幸运大转盘";
        var CookieValueLT = JSON.stringify($request.headers);
        if (qmnovel.getdata(CookieKeyLT) != (undefined || null)) {
           if (qmnovel.getdata(CookieKeyLT) != CookieValueLT) {
              var cookieLT = qmnovel.setdata(CookieValueLT, CookieKeyLT);
              if (!cookieLT) {
                 qmnovel.msg("更新" + CookieNameLT + "Cookie失败‼️", "", "");
                 } else {
                 qmnovel.msg("更新" + CookieNameLT + "Cookie成功🎉", "", "");
                 }
           } else {
              qmnovel.msg(CookieNameLT + "Cookie未变化❗️", "", "");
           }
        } else {
           var cookieLT = qmnovel.setdata(CookieValueLT, CookieKeyLT);
           if (!cookieLT) {
              qmnovel.msg("首次写入" + CookieNameLT + "Cookie失败‼️", "", "");
              } else {
              qmnovel.msg("首次写入" + CookieNameLT + "Cookie成功🎉", "", "");
              }
        }
     } else {
        qmnovel.msg("写入" + CookieNameLT + "Cookie失败‼️", "", "配置错误, 无法读取请求头, ");
     }
  } else if (url.indexOf(video) != -1) {
     if (url) {
        var UrlKeyVC = "UrlVC";
        var UrlNameVC = "七猫小说视频奖励";
        var UrlValueVC = url;
        if (qmnovel.getdata(UrlKeyVC) != (undefined || null)) {
           if (qmnovel.getdata(UrlKeyVC) != UrlValueVC) {
              var urlVC = qmnovel.setdata(UrlValueVC, UrlKeyVC);
              if (!urlVC) {
                 qmnovel.msg("更新" + UrlNameVC + "Url失败‼️", "", "");
                 } else {
                 qmnovel.msg("更新" + UrlNameVC + "Url成功🎉", "", "");
                 }
           } else {
              qmnovel.msg(UrlNameVC + "Url未变化❗️", "", "");
           }
        } else {
           var urlVC = qmnovel.setdata(UrlValueVC, UrlKeyVC);
           if (!urlVC) {
              qmnovel.msg("首次写入" + UrlNameVC + "Url失败‼️", "", "");
              } else {
              qmnovel.msg("首次写入" + UrlNameVC + "Url成功🎉", "", "");
              }
        }
     } else {
        qmnovel.msg("写入" + UrlNameVC + "Url失败‼️", "", "配置错误, 无法读取URL, ");
     }
  }     
}

function DailyCheckin(t) {
  return new Promise(resolve => { setTimeout(() => {
      url = { url: DCURL, headers: JSON.parse(DCKEY) }
      qmnovel.get(url, (error, response, data) => { 
        try {
            Totalresult.dailycheckin = JSON.parse(data)
            qmnovel.log(`${cookieName}日常签到, data: ${data}`)   
            resolve('done');        
         } catch (e) {
            qmnovel.log(`Error: ${error}`)
            qmnovel.msg(cookieName, '日常签到结果: 失败‼️', '请查看错误日志‼️')
            resolve('done')
         }
      })}, t)
   })
}

function NoviceCheckin(t) {
   return new Promise(resolve => { setTimeout(() => {
       url = { url: NCURL, headers: JSON.parse(NCKEY) }
       qmnovel.get(url, (error, response, data) => {
         try {
             Totalresult.novicecheckin = JSON.parse(data)
             qmnovel.log(`${cookieName}新人签到, data: ${data}`)
             resolve('done');
         } catch (e) {
             qmnovel.log(`Error: ${error}`)
             qmnovel.msg(cookieName, '新人签到结果: 失败‼️', '请查看错误日志‼️')
             resolve('done')
         }
     })}, t)
   })
 }

function VideoCoin(t) {
  return new Promise(resolve => { setTimeout(() => {
    url = { url: VCURL, headers: JSON.parse(DCKEY) }
    qmnovel.get(url, (error, response, data) => {  
      try {
          Totalresult.videocoin = JSON.parse(data)
          qmnovel.log(`${cookieName}视频奖励, data: ${data}`)
          resolve('done');
      } catch (e) {
          qmnovel.log(`Error: ${error}`)
          qmnovel.msg(cookieName, '领取视频奖励: 失败‼️', '请查看错误日志‼️')
          resolve('done');
      }
    })}, t)
  })
}

function LuckyTurn(t) {
  return new Promise(resolve => { setTimeout(() => {
      url = { url: LTURL, headers: JSON.parse(LTKEY) }
      qmnovel.get(url, (error, response, data) => {
        try {
            Totalresult.luckyturnlist = Totalresult.luckyturnlist ? Totalresult.luckyturnlist : []
            Totalresult.luckyturnlist.push(JSON.parse(data))
            qmnovel.log(`${cookieName}幸运大转盘, data: ${data}`)
            resolve('done');  
         } catch (e) {
            qmnovel.log(`Error: ${error}`)
            qmnovel.msg(cookieName, '幸运大转盘: 失败‼️', '请查看错误日志‼️')
            resolve('done')
         }
      })}, t)
   })
}

function Notify() {
  let subTitle = '';
  let detail = '';
  if (Totalresult.dailycheckin) {
     if (Totalresult.dailycheckin.data) {
        subTitle += '日常签到结果: 成功🎉\n'
        detail += '日常签到奖励: '+ Totalresult.dailycheckin.data.coin +'金币\n'
     } else if (Totalresult.dailycheckin.errors) {
        if (Totalresult.dailycheckin.errors.code == 23010103) {
           subTitle += '日常签到结果: 成功(重复签到)🎉\n'
        } else {
           subTitle += '日常签到结果: 失败‼️\n'
           detail += '日常签到说明: ' + Totalresult.dailycheckin.errors.details + '\n'
        }
     }
  }
  if (Totalresult.videocoin) {
     if (Totalresult.videocoin.data) {
        subTitle += '领取视频奖励: 成功🎉\n'
        detail += '视频奖励: '+ Totalresult.videocoin.data.coin +'金币\n'
     } else if (Totalresult.videocoin.errors) {
        if (Totalresult.videocoin.errors.code == 23010107) {
           subTitle += '领取视频奖励: 成功(重复签到)🎉\n'
           detail += '视频奖励说明: ' + Totalresult.videocoin.errors.details + '\n'
        } else {
           subTitle += '领取视频奖励: 失败‼️\n'
           detail += '视频奖励说明: ' + Totalresult.videocoin.errors.details + '\n'
        }
     }
  }
  if (Totalresult.novicecheckin) {
     if (Totalresult.novicecheckin.data) {
        subTitle += '新人签到结果: 成功🎉\n'
        detail += '签到奖励: '+ Totalresult.novicecheckin.data.reward_cash +'金币\n'
     } else if (Totalresult.novicecheckin.errors) {
        if (Totalresult.novicecheckin.errors.code == 13101002) {
           subTitle += '新人签到结果: 成功(重复签到)🎉\n'
           detail += '新人签到说明: ' + Totalresult.novicecheckin.errors.details + '\n'
        } else {
           subTitle += '新人签到结果: 失败‼️\n'
           detail += '新人签到说明: ' + Totalresult.novicecheckin.errors.details + '\n'
        }
     }
  }
  if (Totalresult.luckyturnlist) {
     subTitle += '幸运大转盘次数: 5次';
     for (let i = 0; i < 5; i++) {
         n = i + 1
         if (Totalresult.luckyturnlist[i].data) {
            detail += '第' + n + '次' + '幸运大转盘: 成功🎉 转盘奖励: ' + Totalresult.luckyturnlist[i].data.prize_title + '\n'
         } else if (Totalresult.luckyturnlist[i].errors) {
            if (Totalresult.luckyturnlist[i].errors.code == 13101002) {
               detail += '幸运大转盘: 次数耗尽🚫 说明: ' + Totalresult.luckyturnlist[i].errors.details + '\n'
            } else {
               detail += '幸运大转盘: 失败‼️ 说明: ' + Totalresult.luckyturnlist[i].errors.details + '\n'
            }
         }
     }
  }
  qmnovel.msg(cookieName, subTitle, detail)
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
    if (isSurge()) {
      $httpClient.get(url, cb)
    }
    if (isQuanX()) {
      url.method = 'GET'
      $task.fetch(url).then((resp) => cb(null, {}, resp.body))
    }
  }
  post = (url, cb) => {
    if (isSurge()) {
      $httpClient.post(url, cb)
    }
    if (isQuanX()) {
      url.method = 'POST'
      $task.fetch(url).then((resp) => cb(null, {}, resp.body))
    }
  }
  put = (url, cb) => {
    if (isSurge()) {
      $httpClient.put(url, cb)
    }
    if (isQuanX()) {
      url.method = 'PUT'
      $task.fetch(url).then((resp) => cb(null, {}, resp.body))
    }
  }
  done = (value = {}) => {
    $done(value)
  }
  return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, put, done }
}
