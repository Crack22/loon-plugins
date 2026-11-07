// fmz_open_capture.js — 通用“去抓取”手动按钮（許諾签到合集）
// 用法：在插件 [Script] 里加一行 cron（手动点着用，定时几乎不触发）：
// cron "0 0 29 2 *" script-path=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/fmz_open_capture.js, tag=<服务>去抓取, img-url=<图标>, argument="title=<服务名>&url=<抓取目标，百分号编码，可空>&hint=<提示>", enable={capture}
// 点一下（Loon → 脚本 → 点这行）就发一条通知；点通知打开抓取页/App，停几秒即自动抓取。
// 定时写 2 月 29 日：只有闰年才触发一次，平时只手动点；不要用 2 月 31 日（非法日期）。
// url 只能填真实可用的地址：插件抓取规则能匹配到的网页（如京东个人中心页），
// 或已确认的 App URL Scheme；不确定的就留空，只发文字提示，绝不编造链接。
(function () {
  var title = "签到", url = "", hint = "";
  try {
    var arg = (typeof $argument !== "undefined") ? $argument : null;
    if (typeof arg === "string" && arg) {
      var parts = arg.split("&");
      for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].split("=");
        var k = kv[0];
        var v = kv.slice(1).join("=");
        if (k === "title") title = v;
        else if (k === "url") url = v;
        else if (k === "hint") hint = v;
      }
    } else if (arg) {
      if (arg.title) title = arg.title;
      if (arg.url) url = arg.url;
      if (arg.hint) hint = arg.hint;
    }
  } catch (e) {}
  try { url = decodeURIComponent(url); } catch (e) {}
  var content = hint || ("请打开「" + title + "」停留几秒，收到 Cookie 获取成功即抓取成功");
  try {
    if (url) {
      $notification.post("👉 点我打开" + title + "抓取 Cookie", "", content, { openUrl: url });
    } else {
      $notification.post("👉 " + title + "抓取 Cookie", "", content);
    }
  } catch (e) {}
  $done({});
})();
