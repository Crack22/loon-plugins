// qqvip_capture.js — qq 会员成长值 Cookie 抓取（許諾签到合集）
// 匹配 proxy.vac.qq.com/cgi-bin/srfentry.fcgi 的请求，
// 从 Cookie 请求头取 uin / skey，追加到 lkQQSignHeaderKey 的账号 JSON 数组（多账号共存）
(function () {
  var KEY = "lkQQSignHeaderKey";
  var title = "qq会员成长值";
  try {
    if (typeof $argument !== "undefined" && $argument && $argument.title) title = $argument.title;
  } catch (e) {}
  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  function getCookieProp(ca, cname) {
    var name = cname + "=";
    var parts = ca.split(";");
    for (var i = 0; i < parts.length; i++) {
      var c = parts[i].trim();
      if (c.indexOf(name) === 0) return c.substring(name.length).replace(/"/g, "").trim();
    }
    return "";
  }
  if (!$request) { $done({}); return; }
  var cookie = getHeader($request.headers, "Cookie");
  if (!cookie) { $done({}); return; }
  var uinRaw = getCookieProp(cookie, "uin");
  var skey = getCookieProp(cookie, "skey");
  if (!uinRaw || !skey) { $done({}); return; }
  var qq = NaN;
  try { qq = Number(uinRaw.substring(1)); } catch (e) {}
  if (isNaN(qq)) { $done({}); return; }
  var accounts = [];
  try { accounts = JSON.parse($persistentStore.read(KEY) || "[]") || []; } catch (e) {}
  if (!Array.isArray(accounts)) accounts = [];
  var changed = false;
  var found = false;
  for (var i = 0; i < accounts.length; i++) {
    if (accounts[i] && accounts[i].qq === qq) {
      found = true;
      if (accounts[i].cookie !== cookie || accounts[i].skey !== skey) {
        accounts[i].cookie = cookie;
        accounts[i].skey = skey;
        changed = true;
      }
      break;
    }
  }
  if (!found) {
    accounts.push({ qq: qq, skey: skey, cookie: cookie });
    changed = true;
  }
  if (!changed) { $done({}); return; }
  try { $persistentStore.write(JSON.stringify(accounts), KEY); } catch (e) {}
  try { $notification.post("✅ " + title + " Cookie 获取成功", "", "QQ " + qq + " 已保存"); } catch (e) {}
  $done({});
})();
