// 夸克签到参数自动抓取
// 打开夸克网盘或夸克浏览器时，自动保存签到请求里的参数（kps/sign/vcode 等），供每天 09:00 的签到脚本使用
// 两个 App 是两个账号：pr=qk_clouddrive 是夸克网盘，pr=ucpro 是夸克浏览器
const APPS = {
  qk_clouddrive: { name: "夸克网盘", queryKey: "quark_drive_query", uaKey: "quark_drive_ua" },
  ucpro: { name: "夸克", queryKey: "quark_browser_query", uaKey: "quark_browser_ua" }
};

function getQueryParam(url, name) {
  var m = url.match(new RegExp("[?&]" + name + "=([^&]*)"));
  return m ? m[1] : "";
}

var url = $request.url || "";
var pr = getQueryParam(url, "pr");
var app = APPS[pr];
if (app) {
  var q = url.split("?")[1] || "";
  // 去掉请求特有的 __t 和 sign_cyclic，只留鉴权参数
  var parts = q.split("&").filter(function (p) {
    return p.indexOf("__t=") !== 0 && p.indexOf("sign_cyclic=") !== 0;
  });
  var clean = parts.join("&");
  var old = $persistentStore.read(app.queryKey) || "";
  if (clean && clean !== old) {
    $persistentStore.write(clean, app.queryKey);
    var ua = $request.headers["User-Agent"] || $request.headers["user-agent"] || "";
    if (ua) $persistentStore.write(ua, app.uaKey);
    $notification.post(app.name + " 签到参数获取成功", "", "参数已保存，签到插件每天 09:00 自动生效");
  }
}
$done({});
