// 作者：許諾
/*

 @𝐗𝐢𝐝𝐍 𝐃𝐃    
//++++++++++++++++++++++++++++++++-


说明:

民盈国贸城小程序 签到可以获得积分兑换物品
群友需要就写了 不是羊毛

圈x获取不到ck就把body改成header

打开软件签到获取ck 签过到可能获取不到ck


surge:远程


圈x:远程
签到获取ck


loon:远程
签到获取ck


MITM= appsmall.rtmap.com


*/


const $XidN = XidN();

const logs=0;//设置0关闭日志,1开启日志


//++++++++++++++++++++++++++++++++-


var dd="民盈国贸城小程序";


//++++++++++++++++++++++++++++++++


function main()
{
XidN_degin();}


 
async function XidN_degin()
 {
let d0=await XidN_infosign();
let d1=await XidN_Sign();
 log(dd,"",d0+d1);
   
}


  
  
  


function XidN_Sign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="每日打卡🏝🏝";
   var result2="";

var Recordurl=$XidN.read("Recordurlname");
var Recordhd=$XidN.read("Recordhdname");
var Recordbd=$XidN.read("Recordbdname");
  const Record={
      url:Recordurl,
      headers:JSON.parse(Recordhd),
      body:Recordbd,
      timeout:60000};
  $XidN.post(Record,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.code== 200)
result2="打卡✅,"+obj.data.today;
else
if(obj.code== 400)
result2="签到失败说明:"+obj.msg;
else
if(obj.code== 500)
result2="签到失败说明:"+obj.msg;

else
result2="签到失败获取cookie";

var Recordgeturl=$XidN.read("Recordgeturlname");
var Recordgethd=$XidN.read("Recordgethdname");
  const Recordget={
      url:Recordgeturl,
      headers:JSON.parse(Recordgethd),
      timeout:60000};
  $XidN.get(Recordget,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.code== 200)
result2+="[连续打卡]"+obj.data.serialSignDays+"天";

for(let i=0;i<obj.data.days.length;i++)
{
result2+="[已签到日期]"+obj.data.days[i];
}


var accounturl=$XidN.read("accounturlname");
var accounthd=$XidN.read("accounthdname");
  const accountget={
      url:accounturl,
      headers:JSON.parse(accounthd),
      timeout:60000};
  $XidN.get(accountget,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.code== 200)
result2+="[当前账户积分]"+obj.data.balance+"分";


result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
})
})
}


function XidN_infosign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="查询账户信息🔍";
   var result2="";

var customerurl=$XidN.read("customerurlname");
var customerhd=$XidN.read("customerhdname");
  const customer={
      url:customerurl,
      headers:JSON.parse(customerhd),
      timeout:60000};
  $XidN.get(customer,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.code== 200)
result2="昵称"+obj.data.member.nickname+",当前会员等级"+obj.data.member.cardName+"会员";

else
result2="失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}
   
   


function XidN_mygmc() {

  if ($request.headers) {

 var urlval = $request.url;
var md_hd=$request.headers;
var md_bd=$request.body;
if(urlval.indexOf("sign/signRecord/get?")>=0)
{

 var ko= $XidN.write(urlval,"Recordgeturlname");
var po= $XidN.write(JSON.stringify(md_hd),"Recordgethdname");

if (po==true&&ko==true) 
 log(dd,"[获取签到日期数据]","✅成功");}


else if(urlval.indexOf("wxapp-root/api/v1/score/account?")>=0)
{

 var ko= $XidN.write(urlval,"accounturlname");
var po= $XidN.write(JSON.stringify(md_hd),"accounthdname");

if (po==true&&ko==true) 
 log(dd,"[获取积分数据]","✅成功");}


else if(urlval.indexOf("wxapp-root/api/v1/customer/info?")>=0)
{

 var ko= $XidN.write(urlval,"customerurlname");
var po= $XidN.write(JSON.stringify(md_hd),"customerhdname");

if (po==true&&ko==true) 
 log(dd,"[获取个人信息数据]","✅成功");}


else if(urlval.indexOf("sign/signRecord")>=0)
{

 var ao= $XidN.write(urlval,"Recordurlname");
var so= $XidN.write(md_bd,"Recordbdname");
var bo= $XidN.write(JSON.stringify(md_hd),"Recordhdname");

if (ao==true&&bo==true&&so==true) 
 log(dd,"[获取签到数据]","✅成功");}


}  
}


function log(x,y,z){

$XidN.notify(x,y,z);}
function getRandom(start, end, fixed = 0) {
  let differ = end - start
  let random = Math.random()
  return (start + differ * random).toFixed(fixed)
}

if ($XidN.isRequest) {
  XidN_mygmc()
  $XidN.end()
} else {
  main();
  $XidN.end()
 }


function XidN() {
    const isRequest = typeof $request != "undefined"
    const isSurge = typeof $httpClient != "undefined"
    const isQuanX = typeof $task != "undefined"
    const notify = (title, subtitle, message) => {
        if (isQuanX) $notify(title, subtitle, message)
        if (isSurge) $notification.post(title, subtitle, message)
    }
    const write = (value, key) => {
        if (isQuanX) return $prefs.setValueForKey(value, key)
        if (isSurge) return $persistentStore.write(value, key)
    }
    const read = (key) => {
        if (isQuanX) return $prefs.valueForKey(key)
        if (isSurge) return $persistentStore.read(key)
    }
    const get = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = { url: options }
            options["method"] = "GET"
            $task.fetch(options).then(response => {
                response["status"] = response.statusCode
                callback(null, response, response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) $httpClient.get(options, callback)
    }
    const post = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = { url: options }
            options["method"] = "POST"
            $task.fetch(options).then(response => {
                response["status"] = response.statusCode
                callback(null, response, response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) $httpClient.post(options, callback)
    }
    const end = () => {
        if (isQuanX) isRequest ? $done({}) : ""
        if (isSurge) isRequest ? $done({}) : $done()
    }
    return { isRequest, isQuanX, isSurge, notify, write, read, get, post, end }
};


