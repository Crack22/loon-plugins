// 夸克每日签到：夸克网盘 + 夸克浏览器，两个账号一起签
// 参数由 quark_capture.js 在打开 App 时自动保存（quark_drive_query / quark_browser_query）
// 也可以在 BoxJs 里手动粘贴签到请求的完整 query（? 后面的那串）
// 签到接口：POST drive-member.quark.cn/1/clouddrive/capacity/growth/sign，body {"sign_cyclic":true}
// 状态接口：GET drive-member.quark.cn/1/clouddrive/capacity/growth/info
// 响应：code=0 成功（data.sign_daily_reward 是本次奖励容量，单位字节）；code=44210 今日已签到
const HOST = "https://drive-member.quark.cn";
const ORIGIN = "https://b.quark.cn";
const DEFAULT_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 27_3 like Mac OS X; zh-cn) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/24C5037i Quark/10.20.5.1093 QKCloud/10.20.5.1093 Mobile";

const APPS = [
  { name: "夸克网盘", queryKey: "quark_drive_query", uaKey: "quark_drive_ua" },
  { name: "夸克", queryKey: "quark_browser_query", uaKey: "quark_browser_ua" }
];

function read(k) { return $persistentStore.read(k) || ""; }
function parseJson(d) { try { return JSON.parse(d); } catch (e) { return null; } }
function mb(bytes) { return Math.round(bytes / 1048576); }

function headers(ua) {
  return {
    "Origin": ORIGIN,
    "Referer": ORIGIN + "/",
    "User-Agent": ua || DEFAULT_UA,
    "Accept": "*/*"
  };
}

var results = [];
var idx = 0;

function finish() {
  $notification.post("夸克每日签到", "", results.join("\n"));
  $done({});
}

// 查一次状态，返回 {ok, signed, progress, total}
function fetchInfo(query, ua, cb) {
  var url = HOST + "/1/clouddrive/capacity/growth/info?__t=" + Date.now() + "&sign_cyclic=true&" + query;
  $httpClient.get({ url: url, headers: headers(ua) }, function (e, r, d) {
    var info = parseJson(d);
    if (!info || info.code !== 0 || !info.data || !info.data.cap_sign) {
      cb(null);
      return;
    }
    var cap = info.data.cap_sign;
    var total = (info.data.cap_growth && info.data.cap_growth.cur_total_sign_day) || "";
    cb({ signed: !!cap.sign_daily, progress: cap.sign_progress, total: total });
  });
}

function checkOne(app, next) {
  var query = read(app.queryKey);
  if (!query) {
    results.push(app.name + "：未保存参数，打开一次 " + app.name + " App 自动获取");
    next();
    return;
  }
  var ua = read(app.uaKey);
  fetchInfo(query, ua, function (st) {
    if (!st) {
      results.push(app.name + "：状态查询失败，参数可能失效，打开一次 App 刷新");
      next();
      return;
    }
    var stat = "（连续第" + st.progress + "天，共" + st.total + "天）";
    if (st.signed) {
      results.push(app.name + "：今日已签到" + stat);
      next();
      return;
    }
    var hh = headers(ua);
    hh["Content-Type"] = "application/json";
    $httpClient.post({ url: HOST + "/1/clouddrive/capacity/growth/sign?" + query, headers: hh, body: '{"sign_cyclic":true}' }, function (e2, r2, d2) {
      var s = parseJson(d2);
      if (s && s.code === 0 && s.data) {
        var reward = mb(s.data.sign_daily_reward);
        fetchInfo(query, ua, function (st2) {
          if (st2) {
            results.push(app.name + "：签到成功 +" + reward + "MB（连续第" + st2.progress + "天，共" + st2.total + "天）");
          } else {
            results.push(app.name + "：签到成功 +" + reward + "MB");
          }
          next();
        });
      } else if (s && s.code === 44210) {
        results.push(app.name + "：今日已签到" + stat);
        next();
      } else {
        results.push(app.name + "：签到失败（" + (s ? (s.code + " " + (s.message || "")) : "无响应") + "），打开一次 App 刷新参数");
        next();
      }
    });
  });
}

function runNext() {
  if (idx >= APPS.length) { finish(); return; }
  var app = APPS[idx++];
  checkOne(app, runNext);
}
runNext();
