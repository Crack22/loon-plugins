// IP 查询：合并 ip.cx + iplark.com 的功能
// 查当前出口 IP（或 BoxJs 里指定的 IP）的归属地、ISP、ASN、多源定位对比，并检测常用网站连通性
// 数据源：ip-api.com（主）+ ipinfo.io（多源对比），免费免 key
// 手动运行：打开插件里的「手动查询一次」开关，等一分钟出结果，记得关掉
const IP_KEY = "ipinfo_ip"; // 指定查询的 IP，留空 = 查当前出口 IP
const CHECK_KEY = "ipinfo_check"; // 是否检测常用网站连通性，默认开

// 连通性检测的网站（ip.cx 的国内外检测 + 常用服务）
const SITES = [
  { name: "Google", url: "https://www.google.com/generate_204" },
  { name: "YouTube", url: "https://www.youtube.com/generate_204" },
  { name: "GitHub", url: "https://api.github.com" },
  { name: "ChatGPT", url: "https://api.openai.com/v1/models" },
  { name: "百度", url: "https://www.baidu.com" },
  { name: "淘宝", url: "https://www.taobao.com" }
];

// 数据中心 / 机房 IP 的常见关键词（ip.cx 的 IP 类型、iplark 的使用场景的近似判断）
const DC_KEYWORDS = ["cloudflare", "google", "amazon", "microsoft", "alibaba", "tencent", "digitalocean", "vultr", "linode", "ovh", "hetzner", "datacenter", "data center", "hosting", "server", "cloud", "warp", "fastly", "akamai", "choopa", "quadranet", "psychz"];

function read(k) { return $persistentStore.read(k) || ""; }

function isTrue(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

// 开关值可能是 "true"/true/"1"/1，都当作开；没填过默认开
function checkOn() {
  const v = read(CHECK_KEY);
  if (v === "" || v === null || v === undefined) return true;
  return isTrue(v);
}

function manualOn() {
  try {
    if (typeof $argument === "undefined" || !$argument) return false;
    const v = $argument["manualRun"];
    return v === true || v === "true";
  } catch (e) { return false; }
}

function httpGet(url, headers, timeout) {
  return new Promise(function (resolve) {
    $httpClient.get({ url: url, headers: headers || {}, timeout: timeout || 8 }, function (error, response, body) {
      if (error) return resolve({ error: String(error), status: 0, body: "" });
      resolve({ error: null, status: response.status || 0, body: body || "" });
    });
  });
}

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// 判断是不是数据中心 / 机房 IP
function ipType(isp, org) {
  const s = ((isp || "") + " " + (org || "")).toLowerCase();
  for (const kw of DC_KEYWORDS) {
    if (s.indexOf(kw) !== -1) return "数据中心";
  }
  return "宽带/家庭";
}

// 连通性检测：返回 {name, ok, ms}
async function checkSite(site) {
  const t0 = Date.now();
  const r = await httpGet(site.url, {}, 5);
  const ms = Date.now() - t0;
  const ok = !r.error && r.status > 0 && r.status < 500;
  return { name: site.name, ok: ok, ms: ms };
}

async function main() {
  if (!manualOn()) {
    $done({});
    return;
  }

  const customIp = read(IP_KEY).trim();
  const queryIp = customIp || "";
  const apiUrl = queryIp
    ? "http://ip-api.com/json/" + encodeURIComponent(queryIp) + "?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,query"
    : "http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,query";

  // 1) 主数据源 ip-api.com
  const r1 = await httpGet(apiUrl, {}, 10);
  let a = null;
  if (!r1.error && r1.body) {
    try { a = JSON.parse(r1.body); } catch (e) { a = null; }
  }
  if (!a || a.status !== "success") {
    $notification.post("IP 查询", "❌查询失败", a ? (a.message || "接口无返回") : (r1.error || "网络错误"));
    $done({});
    return;
  }

  const ip = a.query || queryIp || "未知";
  const loc = [a.country, a.regionName, a.city].filter(Boolean).join(" ");
  const isp = a.isp || "未知";
  const asn = a.as || "未知";
  const tz = a.timezone || "未知";
  const type = ipType(a.isp, a.org);

  // 2) 第二数据源 ipinfo.io，做多源定位对比
  let bLoc = "";
  const infoUrl = queryIp
    ? "https://ipinfo.io/" + encodeURIComponent(queryIp) + "/json"
    : "https://ipinfo.io/json";
  const r2 = await httpGet(infoUrl, {}, 10);
  if (!r2.error && r2.body) {
    try {
      const b = JSON.parse(r2.body);
      if (b && !b.error && b.country) {
        bLoc = [b.country, b.region, b.city].filter(Boolean).join(" ");
      }
    } catch (e) {}
  }

  // 3) 连通性检测（可选）
  let connLines = [];
  if (checkOn()) {
    const results = [];
    for (const site of SITES) {
      results.push(await checkSite(site));
      await sleep(200);
    }
    connLines = results.map(function (x) {
      return (x.ok ? "✅" : "❌") + x.name + (x.ok ? " " + x.ms + "ms" : "");
    });
  }

  const lines = [];
  lines.push("📍" + loc + (bLoc && bLoc !== loc ? "\n多源：" + bLoc : ""));
  lines.push("🏢" + isp + " · " + type);
  lines.push("🔢" + asn + " · " + tz);
  if (connLines.length) lines.push("🌐" + connLines.join(" "));

  $notification.post("IP 查询", ip, lines.join("\n"));
  $done({});
}

main().catch(function (e) {
  $notification.post("IP 查询", "❌执行异常", String(e && e.message || e));
  $done({});
});
