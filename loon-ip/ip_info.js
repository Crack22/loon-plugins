// IP 查询：合并 ip.cx + iplark.com 的功能
// 在节点界面长按节点，点菜单里的「IP 查询」，对这个节点跑一次
// 查该节点出口 IP 的归属地、ISP、ASN、时区、多源定位对比，并检测常用网站连通性
// 数据源：ip-api.com（主）+ ipinfo.io（多源对比/备用），免费免 key
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
    $httpClient.get({ url: url, headers: headers || {}, timeout: timeout || 15 }, function (error, response, body) {
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
  const r = await httpGet(site.url, {}, 8);
  const ms = Date.now() - t0;
  const ok = !r.error && r.status > 0 && r.status < 500;
  return { name: site.name, ok: ok, ms: ms };
}

// 用 $done 把结果弹出来显示（generic 脚本必须返回 title/content，不然 Loon 会弹 empty content）
function finish(title, content) {
  $notification.post("IP 查询", title, content);
  $done({ title: title, content: content, icon: "network" });
}

async function main() {
  const customIp = read(IP_KEY).trim();
  const queryIp = customIp || "";

  // 1) 主数据源 ip-api.com（HTTPS，15 秒超时）；失败则用 ipinfo.io 兜底
  const apiUrl = queryIp
    ? "https://ip-api.com/json/" + encodeURIComponent(queryIp) + "?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,query"
    : "https://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,query";
  const r1 = await httpGet(apiUrl, {}, 15);
  let a = null;
  if (!r1.error && r1.body) {
    try { a = JSON.parse(r1.body); } catch (e) { a = null; }
  }

  let ip = queryIp || "";
  let loc = "", isp = "", asn = "", tz = "", type = "", bLoc = "";
  if (a && a.status === "success") {
    ip = a.query || queryIp || "未知";
    loc = [a.country, a.regionName, a.city].filter(Boolean).join(" ");
    isp = a.isp || "未知";
    asn = a.as || "未知";
    tz = a.timezone || "未知";
    type = ipType(a.isp, a.org);
  } else {
    // ip-api.com 不通，改用 ipinfo.io 当主数据源
    const infoUrl = queryIp
      ? "https://ipinfo.io/" + encodeURIComponent(queryIp) + "/json"
      : "https://ipinfo.io/json";
    const r2 = await httpGet(infoUrl, {}, 15);
    let b = null;
    if (!r2.error && r2.body) {
      try { b = JSON.parse(r2.body); } catch (e) { b = null; }
    }
    if (!b || b.error || !b.ip) {
      finish("❌查询失败", "两个数据源都超时或无返回，节点可能太慢，换个节点再试");
      return;
    }
    ip = b.ip || queryIp || "未知";
    loc = [b.country, b.region, b.city].filter(Boolean).join(" ");
    isp = b.org || "未知";
    asn = b.org || "未知";
    tz = b.timezone || "未知";
    type = ipType(b.org, b.org);
  }

  // 2) 第二数据源做多源定位对比（主源是 ip-api.com 时再取 ipinfo.io；主源已是 ipinfo.io 时跳过）
  if (a && a.status === "success") {
    const infoUrl = queryIp
      ? "https://ipinfo.io/" + encodeURIComponent(queryIp) + "/json"
      : "https://ipinfo.io/json";
    const r2 = await httpGet(infoUrl, {}, 15);
    if (!r2.error && r2.body) {
      try {
        const b = JSON.parse(r2.body);
        if (b && !b.error && b.country) {
          bLoc = [b.country, b.region, b.city].filter(Boolean).join(" ");
        }
      } catch (e) {}
    }
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

  finish(ip, lines.join("\n"));
}

main().catch(function (e) {
  finish("❌执行异常", String(e && e.message || e));
});
