// wechat_pay_coupon_capture.js — 微信支付有优惠：登录响应的 session_token + 奖品响应（許諾签到合集）
// http-response ^https://payapp\.weixin\.qq\.com/(coupon-center-user/home/login|coupon-center-award/award/detail)
(function () {

  function getHeader(headers, name) {
    if (!headers) return "";
    var lower = name.toLowerCase();
    for (var k in headers) {
      if (k.toLowerCase() === lower) return headers[k];
    }
    return "";
  }
  function read(key) {
    try { return $persistentStore.read(key) || ""; } catch (e) { return ""; }
  }
  function save(key, value) {
    value = (value || "").trim();
    if (!value) return false;
    if (read(key) === value) return false;
    try { $persistentStore.write(value, key); } catch (e) {}
    return true;
  }
  function loadList(key) {
    var list = [];
    try { list = JSON.parse(read(key) || "[]") || []; } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    return list;
  }
  function saveList(key, list) {
    var val = JSON.stringify(list);
    if (read(key) === val) return false;
    try { $persistentStore.write(val, key); } catch (e) {}
    return true;
  }
  function notify(title) {
    try { $notification.post("✅ " + title, "", "签到数据已保存"); } catch (e) {}
  }
  if (!$request || $request.method === "OPTIONS") { $done({}); return; }

  var url = $request.url || "";
  var body = null;
  try { body = JSON.parse(($response && $response.body) || ""); } catch (e) {}
  var changed = false;
  if (url.indexOf("coupon-center-user") > -1) {
    var ver = url.match(/coutom_version=([^&]*)/);
    if (ver) changed = save("wechat_pay_version", decodeURIComponent(ver[1])) || changed;
    var d = body && body.data;
    if (d && d.session_token && d.openid) {
      var list = loadList("wechat_pay_token");
      var idx = -1;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].openid === d.openid) { idx = i; break; }
      }
      var entry = { openid: d.openid, token: d.session_token };
      if (idx >= 0) { list[idx] = entry; } else { list.push(entry); }
      changed = saveList("wechat_pay_token", list) || changed;
    }
  } else if (url.indexOf("coupon-center-award") > -1) {
    var award = body && body.data && body.data.award;
    if (award && award.award_id) {
      changed = save("wechat_pay_exchange_award", award.award_id + ":" + (award.name || "")) || changed;
    }
  }
  if (changed) notify("微信支付有优惠数据获取成功");
  $done({});
})();
