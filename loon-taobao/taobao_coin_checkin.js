// 淘宝淘金币每日签到
// 重放抓取到的 mtop.coingame.sign.supply 请求完成签到
// 支持 3 个固定账号 + 多账号文本框（每行一个抓取到的请求 JSON）
// 作者：許諾

var KEYS = ["taobao_coin_req", "taobao_coin_req2", "taobao_coin_req3"];
var ACCOUNTS_KEY = "taobao_coin_accounts";
var TIMEOUT = 15000;

// ---------- 自定义签到时间 ----------
// BoxJs 设置：
// taobao_time_enabled：开关，启用自定义签到时间（默认关 = 每天 09:00）
// taobao_time_mode：fixed = 指定时间 / random = 时间区间随机
// taobao_time：指定时间 "HH:MM"，如 09:30
// taobao_time_range：时间区间 "HH:MM-HH:MM"，如 08:00-10:00
const TIME_ENABLED_KEY = "taobao_time_enabled";
const TIME_MODE_KEY = "taobao_time_mode";
const TIME_KEY = "taobao_time";
const TIME_RANGE_KEY = "taobao_time_range";
const TIME_TARGET_KEY = "taobao_time_target"; // 当天随机挑好的时间，格式 "YYYY-MM-DD HH:MM|HH:MM-HH:MM"
const TIME_DONE_KEY = "taobao_time_done"; // 自动签到今天已跑过的日期
const MANUAL_DONE_KEY = "taobao_manual_done"; // 手动运行一次今天已跑过的日期
const DEFAULT_TIME_MIN = 9 * 60; // 默认 09:00

// 开关值可能是 "true"/true/"1"/1，都当作开
function isTrue(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}
// 本地日期 YYYY-MM-DD（不用 toISOString，那是 UTC 日期，凌晨会差一天）
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
// 现在是今天的第几分钟（本地时间）
function nowMin() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
// "HH:MM" 转分钟，非法返回 null
function parseHM(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}
// 分钟转 "HH:MM"
function fmtHM(min) {
  const h = Math.floor(min / 60), mi = min % 60;
  return String(h).padStart(2, "0") + ":" + String(mi).padStart(2, "0");
}
// 今天的目标签到时间（分钟）。未启用或配置非法时回落到 09:00
function todayTargetMin() {
  if (!isTrue($persistentStore.read(TIME_ENABLED_KEY))) return DEFAULT_TIME_MIN;
  const mode = ($persistentStore.read(TIME_MODE_KEY) || "").trim();
  if (mode === "fixed") {
    const t = parseHM($persistentStore.read(TIME_KEY));
    return t === null ? DEFAULT_TIME_MIN : t;
  }
  if (mode === "random") {
    const range = ($persistentStore.read(TIME_RANGE_KEY) || "").trim();
    const parts = range.split("-");
    if (parts.length !== 2) return DEFAULT_TIME_MIN;
    const start = parseHM(parts[0]), end = parseHM(parts[1]);
    if (start === null || end === null || end <= start) return DEFAULT_TIME_MIN;
    const today = todayStr();
    const stored = $persistentStore.read(TIME_TARGET_KEY) || "";
    if (stored) {
      const sp = stored.split("|");
      if (sp.length === 2 && sp[0].slice(0, 10) === today && sp[1] === range) {
        const t = parseHM(sp[0].slice(11));
        if (t !== null) return t;
      }
    }
    const pick = start + Math.floor(Math.random() * (end - start + 1));
    $persistentStore.write(today + " " + fmtHM(pick) + "|" + range, TIME_TARGET_KEY);
    return pick;
  }
  return DEFAULT_TIME_MIN;
}
// 自动定时是否该跑：目标时间起 60 分钟内且今天还没跑过（窗口外不跑，避免打开 Loon 时补跑）
// 手动运行开关：没传参数时默认关
function manualOn() {
  try {
    if (typeof $argument === "undefined" || !$argument) return false;
    const v = $argument["manualRun"];
    return v === true || v === "true";
  } catch (e) { return false; }
}
function shouldRunAuto() {
  const today = todayStr();
  if (($persistentStore.read(TIME_DONE_KEY) || "") === today) return false;
  const target = todayTargetMin();
  const now = nowMin();
  return now >= target && now < target + 60;
}

function collectAccounts() {
  var list = [];
  for (var i = 0; i < KEYS.length; i++) {
    var v = $persistentStore.read(KEYS[i]);
    if (v) {
      list.push({ name: "账号" + (i + 1), raw: v });
    }
  }
  var multi = $persistentStore.read(ACCOUNTS_KEY);
  if (multi) {
    var lines = multi.split("\n");
    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim();
      if (line) {
        list.push({ name: "多账号" + (j + 1), raw: line });
      }
    }
  }
  return list;
}

function parseResult(body) {
  var data = null;
  try {
    var obj = JSON.parse(body);
    data = obj && obj.data ? obj.data : obj;
  } catch (e) {
    return { ok: false, msg: "返回无法解析" };
  }
  if (!data) {
    return { ok: false, msg: "返回为空" };
  }
  var code = data.resultCode;
  var msg = data.resultMsg || "";
  var model = data.model || {};
  if (code === "SUCCESS" || code === 0 || code === "0") {
    var reward = "";
    if (model) {
      var coins = model.coinNum || model.gainCoin || model.rewardCoin || model.coin;
      if (coins) {
        reward = "，+" + coins + "金币";
      }
    }
    return { ok: true, msg: "签到成功" + reward };
  }
  if (msg && (msg.indexOf("已签") !== -1 || msg.indexOf("重复") !== -1 || msg.indexOf("已领") !== -1)) {
    return { ok: true, msg: "今日已签到" };
  }
  if (code && (String(code).indexOf("ALREADY") !== -1 || String(code).indexOf("SIGNED") !== -1)) {
    return { ok: true, msg: "今日已签到" };
  }
  return { ok: false, msg: (msg || ("resultCode=" + code)) + "，请重新抓取" };
}

function doSign(account, cb) {
  var rec = null;
  try {
    rec = JSON.parse(account.raw);
  } catch (e) {
    rec = null;
  }
  if (!rec || !rec.url) {
    cb(false, "保存的签到数据损坏，请重新抓取");
    return;
  }
  var headers = rec.headers || {};
  delete headers["Host"];
  delete headers["host"];
  delete headers["Content-Length"];
  delete headers["content-length"];
  $httpClient.get({ url: rec.url, headers: headers, timeout: TIMEOUT }, function (error, response, body) {
    if (error) {
      cb(false, "请求失败：" + error);
      return;
    }
    var r = parseResult(body || "");
    cb(r.ok, r.msg);
  });
}

function main() {
  var manual = manualOn();
  if (manual) {
    // 手动运行一次：今天已跑过就悄悄退出
    if (($persistentStore.read(MANUAL_DONE_KEY) || "") === todayStr()) {
      $done({});
      return;
    }
  } else if (!shouldRunAuto()) {
    $done({});
    return;
  }
  var accounts = collectAccounts();
  if (accounts.length === 0) {
    if (manual) $persistentStore.write(todayStr(), MANUAL_DONE_KEY);
    $notification.post("淘宝淘金币签到", "未抓取到签到请求", "打开淘宝 App → 淘金币 → 点一次签到");
    $done({});
    return;
  }
  var results = [];
  var idx = 0;
  function next() {
    if (idx >= accounts.length) {
      // 跑完一轮就写 done，不管成功失败（失败也不再每分钟重试）
      $persistentStore.write(todayStr(), TIME_DONE_KEY);
      if (manual) $persistentStore.write(todayStr(), MANUAL_DONE_KEY);
      var title = "淘宝淘金币签到";
      var subtitle = results.length > 1 ? ("共 " + results.length + " 个账号") : "";
      $notification.post(title, subtitle, results.join("\n"));
      $done({});
      return;
    }
    var acc = accounts[idx];
    idx++;
    doSign(acc, function (ok, msg) {
      results.push(acc.name + "：" + msg);
      next();
    });
  }
  next();
}

main();
