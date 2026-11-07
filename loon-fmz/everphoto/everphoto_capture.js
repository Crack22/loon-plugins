// everphoto_capture.js — 时光相册签到抓取（許諾签到合集）
// 保存签到请求的 URL + 请求头 JSON（部分含 Body）到 $persistentStore，供 cron 签到脚本重放
// 匹配的请求由同目录 Everphoto.plugin 的 http-request 正则限定；只在值变化时保存并通知一次
// 脚本来源：chavyleung/scripts（everphoto.js 抓取逻辑的 Loon 改编）
(function () {
  var TITLE = "时光相册";
  var RULES = [
    { re: null, urlKey: "chavy_sign_url_everphoto", headerKey: "chavy_sign_header_everphoto", bodyKey: null, label: "签到", method: null, special: null },
  ];
  function save(key, val) {
    if (!key || !val) return false;
    var old = '';
    try { old = $persistentStore.read(key) || ''; } catch (e) {}
    if (old === val) return false;
    try { $persistentStore.write(val, key); } catch (e) {}
    return true;
  }
  if (typeof $request === 'undefined' || !$request || $request.method === 'OPTIONS') { $done({}); return; }
  var url = $request.url || '';
  var headers = $request.headers || {};
  var body = $request.body || '';
  var changed = [];
  for (var i = 0; i < RULES.length; i++) {
    var r = RULES[i];
    if (r.re && !r.re.test(url)) continue;
    if (r.method && $request.method !== r.method) continue;
    var hit = false;
    if (r.urlKey && save(r.urlKey, url)) hit = true;
    if (r.headerKey && save(r.headerKey, JSON.stringify(headers))) hit = true;
    if (r.bodyKey) {
      if (r.special === 'qmkg-body') {
        var cmd = '';
        try { cmd = JSON.parse(body).cmd || ''; } catch (e) {}
        hit = false;
        if (cmd === 'task.revisionSignInGetAward' && save(r.bodyKey, body)) hit = true;
      } else if (r.special === 'wm-fallback') {
        if (body) { if (save(r.bodyKey, body)) hit = true; }
        else {
          var tokenUrl = '';
          try { tokenUrl = $persistentStore.read('chavy_tokenurl_wmmeituan') || ''; } catch (e) {}
          var m1 = tokenUrl.match(/activityViewId=(.*?)(&|$)/);
          var m2 = tokenUrl.match(/lat=(.*?)(&|$)/);
          var m3 = tokenUrl.match(/lng=(.*?)(&|$)/);
          if (m1 && m2 && m3) {
            var fb = JSON.stringify({ activityViewId: m1[1], lat: m2[1], lng: m3[1], checkLogin: true, appType: 3, deviceType: 2 });
            if (save(r.bodyKey, fb)) hit = true;
          }
        }
      } else if (save(r.bodyKey, body)) hit = true;
    }
    if (hit) changed.push(r.label);
    break;
  }
  if (changed.length) {
    try { $notification.post('✅ ' + TITLE + ' Cookie 获取成功', '', '已保存：' + changed.join('、')); } catch (e) {}
  }
  $done({});
})();
