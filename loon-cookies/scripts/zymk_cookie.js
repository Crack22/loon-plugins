// 知音漫客 获取 Cookie
// 作者：許諾


const $XidN = XidN();

const logs=0;//设置0关闭日志,1开启日志


//++++++++++++++++++++++++++++++++-


var dd="知音漫客APP";


//++++++++++++++++++++++++++++++++


function main()
{
XidN_degin();}


 
async function XidN_degin()
 {
let a0=await XidN_Sign();
 log(dd,"",a0);
   
}


  
  
  


function XidN_Sign()
  {
  return  new Promise((resolve, reject) => {
    
   var result1="每日打卡🌟";
   var result2="";

var zymkurl=$XidN.read("zymkurlname");
var zymkhd=$XidN.read("zymkhdname");
var zymkbd=$XidN.read("zymkbdname");
  const llUrl1={
      url:zymkurl,
      headers:JSON.parse(zymkhd),
      body:zymkbd,
      timeout:60000};
  $XidN.post(llUrl1,function(error, response, data) {
if (logs==1)console.log(data)
var obj=JSON.parse(data);
if(obj.status== 0)

result2="✅"+obj.data.sign_message+",获得"+obj.data.daytreat.message+",连续签"+obj.data.continue_days+"天";

else
if(obj.status== 2)
result2="签到说明:"+obj.msg;
else
result2="签到失败获取cookie";
result2="<"+result1+">"+result2+"\n";
console.log(result2);
resolve(result2);
})
})
}


   
   


function XidN_zymk() {

  if ($request.headers) {

 var urlval = $request.url;
var md_hd=$request.headers;
var md_bd=$request.body;

if(urlval.indexOf("app_api/v5/sign_signaction")>=0)
{

 var ao= $XidN.write(urlval,"zymkurlname");
var so= $XidN.write(md_bd,"zymkbdname");
var bo= $XidN.write(JSON.stringify(md_hd),"zymkhdname");

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
  XidN_zymk()
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


