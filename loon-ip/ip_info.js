// IP 查询：合并 ip.cx + iplark.com 的功能
// 在节点界面长按节点，点菜单里的「IP 查询」，对这个节点跑一次
// 查该节点出口 IP 的归属地、ISP、ASN、时区、多源定位对比，并检测常用网站连通性
// 数据源并行取：ip-api.com + ipinfo.io，哪个先回用哪个；都不通再试 Cloudflare trace 兜底
const IP_KEY = "ipinfo_ip"; // 指定查询的 IP，留空 = 查当前节点的出口 IP
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

function httpGet(url, headers, timeout) {
  return new Promise(function (resolve) {
    $httpClient.get({ url: url, headers: headers || {}, timeout: timeout || 12 }, function (error, response, body) {
      if (error) return resolve({ error: String(error), status: 0, body: "" });
      resolve({ error: null, status: response.status || 0, body: body || "" });
    });
  });
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
  const r = await httpGet(site.url, {}, 6);
  const ms = Date.now() - t0;
  const ok = !r.error && r.status > 0 && r.status < 500;
  return { name: site.name, ok: ok, ms: ms };
}

// 用 $done 把结果弹出来显示（generic 脚本必须返回 title/content，不然 Loon 会弹 empty content）
function finish(title, content) {
  $notification.post("IP 查询", title, content);
  $done({ title: title, content: content, icon: "network" });
}

// 统一解析两个数据源，返回 {ip, loc, isp, asn, tz, type} 或 null
function parseIPAPI(a, queryIp) {
  if (!a || a.status !== "success") return null;
  return {
    ip: a.query || queryIp || "未知",
    loc: [a.country, a.regionName, a.city].filter(Boolean).join(" "),
    isp: a.isp || "未知",
    asn: a.as || "未知",
    tz: a.timezone || "未知",
    type: ipType(a.isp, a.org)
  };
}
function parseIPInfo(b, queryIp) {
  if (!b || b.error || !b.ip) return null;
  return {
    ip: b.ip || queryIp || "未知",
    loc: [b.country, b.region, b.city].filter(Boolean).join(" "),
    isp: b.org || "未知",
    asn: b.org || "未知",
    tz: b.timezone || "未知",
    type: ipType(b.org, b.org)
  };
}
// Cloudflare trace 兜底：只给 IP 和国家代码
function parseCFTrace(body, queryIp) {
  if (!body) return null;
  const ip = (body.match(/^ip=([^\r\n]+)/m) || [])[1];
  const loc = (body.match(/^loc=([^\r\n]+)/m) || [])[1];
  if (!ip) return null;
  return {
    ip: ip,
    loc: loc || "",
    isp: "Cloudflare",
    asn: "AS13335 Cloudflare, Inc.",
    tz: "",
    type: "数据中心"
  };
}

async function main() {
  const customIp = read(IP_KEY).trim();
  const queryIp = customIp || "";

  const apiUrl = queryIp
    ? "https://ip-api.com/json/" + encodeURIComponent(queryIp) + "?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,query"
    : "https://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,query";
  const infoUrl = queryIp
    ? "https://ipinfo.io/" + encodeURIComponent(queryIp) + "/json"
    : "https://ipinfo.io/json";

  // 1) ip-api.com 和 ipinfo.io 并行取，哪个先回用哪个
  const results = await Promise.all([
    httpGet(apiUrl, {}, 12).then(function (r) {
      if (r.error || !r.body) return null;
      try { return parseIPAPI(JSON.parse(r.body), queryIp); } catch (e) { return null; }
    }),
    httpGet(infoUrl, {}, 12).then(function (r) {
      if (r.error || !r.body) return null;
      try { return parseIPInfo(JSON.parse(r.body), queryIp); } catch (e) { return null; }
    })
  ]);
  let info = results[0] || results[1] || null;
  let bLoc = "";
  if (results[0] && results[1] && results[1].loc && results[1].loc !== results[0].loc) {
    bLoc = results[1].loc; // 多源定位对比
  }

  // 2) 两个都失败，再试 Cloudflare trace 兜底（至少拿到 IP 和国家）
  if (!info) {
    const r3 = await httpGet("https://www.cloudflare.com/cdn-cgi/trace", {}, 12);
    if (!r3.error && r3.body) {
      info = parseCFTrace(r3.body, queryIp);
    }
  }
  if (!info) {
    finish("❌查询失败", "三个数据源都超时或无返回，这个节点可能不通，换个延迟正常的节点再试");
    return;
  }

  // 3) 连通性检测（可选，6 个站并行跑）
  let connLines = [];
  if (checkOn()) {
    const checks = await Promise.all(SITES.map(function (s) { return checkSite(s); }));
    connLines = checks.map(function (x) {
      return (x.ok ? "✅" : "❌") + x.name + (x.ok ? " " + x.ms + "ms" : "");
    });
  }

  const lines = [];
  lines.push("📍" + info.loc + (bLoc ? "\n多源：" + bLoc : ""));
  lines.push("🏢" + info.isp + " · " + info.type);
  lines.push("🔢" + info.asn + (info.tz ? " · " + info.tz : ""));
  if (connLines.length) lines.push("🌐" + connLines.join(" "));

  finish(info.ip, lines.join("\n"));
}

main().catch(function (e) {
  finish("❌执行异常", String(e && e.message || e));
});
