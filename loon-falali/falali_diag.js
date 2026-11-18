// 法拉利诊断：只探测，不签到、不改任何设置
// 注意：Loon $httpClient 的 timeout 单位是毫秒（不是秒），写 20 只给 20 毫秒，请求必超时
// 1) 出口 IP（看脚本请求走哪条路） 2) 网站首页 3) 账号1登录
// 用法：先停用「法拉利每日签到」插件（排除 MITM 影响），再到 Loon「脚本」里点「法拉利诊断」运行，跑完把通知截图发来
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
var lines = [];

function shortErr(e) {
  var s = String(e || "");
  if (/timeout/i.test(s)) return "请求超时";
  if (/cancel/i.test(s)) return "请求被取消";
  if (/not connected|offline|network connection/i.test(s)) return "网络未连接";
  if (/dns|host/i.test(s)) return "域名解析失败";
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}

function probeIP(next) {
  var t0 = Date.now();
  $httpClient.get({ url: "https://api.ipify.org?format=json", timeout: 20000 }, function (e, r, d) {
    var ms = Date.now() - t0;
    if (e) { lines.push("出口IP: 失败，" + shortErr(e) + " (" + ms + "ms)"); }
    else {
      var ip = "";
      try { ip = JSON.parse(d).ip || ""; } catch (err) { ip = String(d || "").slice(0, 40); }
      lines.push("出口IP: " + (ip || ("HTTP " + (r && r.status))) + " (" + ms + "ms)");
    }
    next();
  });
}

function probeHome(next) {
  var t0 = Date.now();
  $httpClient.get({ url: "https://pop67xra.faalaa.cc/", headers: { "User-Agent": UA }, timeout: 20000 }, function (e, r, d) {
    var ms = Date.now() - t0;
    if (e) { lines.push("首页: 失败，" + shortErr(e) + " (" + ms + "ms)"); }
    else { lines.push("首页: HTTP " + (r && r.status) + " (" + ms + "ms)"); }
    next();
  });
}

function probeLogin(next) {
  var user = ($persistentStore.read("falali_username") || "").trim();
  var pass = ($persistentStore.read("falali_password") || "").trim();
  if (!user || !pass) { lines.push("登录: 未填账号1邮箱密码，跳过"); next(); return; }
  var t0 = Date.now();
  $httpClient.post({
    url: "https://pop67xra.faalaa.cc/api/v1/passport/auth/login",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA },
    body: JSON.stringify({ email: user, password: pass }),
    timeout: 20000
  }, function (e, r, d) {
    var ms = Date.now() - t0;
    if (e) { lines.push("登录: 失败，" + shortErr(e) + " (" + ms + "ms)"); next(); return; }
    var body = null;
    try { body = JSON.parse(d); } catch (err) { body = null; }
    if (body && body.status === "success" && body.data && body.data.auth_data) {
      lines.push("登录: 成功拿到 Token (" + ms + "ms)");
    } else {
      lines.push("登录: HTTP " + (r && r.status) + "，" + ((body && body.message) || "无可用返回") + " (" + ms + "ms)");
    }
    next();
  });
}

function main() {
  probeIP(function () {
    probeHome(function () {
      probeLogin(function () {
        var body = lines.join("\n");
        $notification.post("法拉利诊断", "3 项探测完成", body);
        $done({ title: "法拉利诊断", content: body, icon: "network" });
      });
    });
  });
}
main();
