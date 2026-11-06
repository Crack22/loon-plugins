// GitHub Actions 每日签到：不用挂梯子，云端定时跑
// 每天 09:00（北京时间）由 .github/workflows/daily-checkin.yml 触发
// 账号来自 GitHub Secrets（用 Loon 里的「同步到 GitHub Secrets」插件从 BoxJs 上传）
// 覆盖 4 个境外站：蜗牛 / 乐蛙 / 乐观 / ChilledMelon
// 七日杀、WPS、大蓝树、微博是国内站，直连就能签，继续留在 Loon 里
// 运行结果只打印在 Actions 的日志里，不会把账号密码写进日志

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function env(name) { return (process.env[name] || "").trim(); }

async function parseJson(res) {
  try { return await res.json(); } catch { return null; }
}

// 从 Set-Cookie 里拼出 Cookie 头（跳过 Expires/Path 等属性）
function buildCookie(setCookies) {
  const pairs = [], seen = new Set();
  const skip = new Set(["expires", "max-age", "path", "domain", "samesite", "secure", "httponly"]);
  for (const sc of setCookies || []) {
    const m = sc.match(/^([A-Za-z0-9_-]+)=([^;,\s]+)/);
    if (!m || skip.has(m[1].toLowerCase()) || seen.has(m[1])) continue;
    seen.add(m[1]);
    pairs.push(m[1] + "=" + m[2]);
  }
  return pairs.join("; ");
}

function extractSession(setCookies) {
  for (const sc of setCookies || []) {
    const m = sc.match(/session_id=([^;,\s]+)/);
    if (m) return m[1];
  }
  return "";
}

// 收集账号：账号1（单独的 Secret）+ 多账号文本（每行一个 Cookie 或 账号----密码）
function collectAccounts(prefix, firstCookie, firstUser, firstPass) {
  const list = [];
  const cookie = env(firstCookie), user = env(firstUser), pass = env(firstPass);
  if (cookie || (user && pass)) list.push({ label: "账号1", cookie, user, pass });
  for (const line of (env(prefix + "_ACCOUNTS") || "").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const p = t.indexOf("----");
    if (p !== -1) {
      const u = t.slice(0, p).trim(), pw = t.slice(p + 4).trim();
      if (!u || !pw) continue;
      list.push({ label: "账号" + (list.length + 1), cookie: "", user: u, pass: pw });
    } else {
      list.push({ label: "账号" + (list.length + 1), cookie: t, user: "", pass: "" });
    }
  }
  const max = parseInt(env(prefix + "_MAX_ACCOUNTS") || "0", 10);
  return max > 0 ? list.slice(0, max) : list;
}

const results = [];
const failed = [];
function ok(site, label, msg) { results.push(`[${site}] ${label}：${msg}`); }
function bad(site, label, msg) { results.push(`[${site}] ${label}：${msg}`); failed.push(label); }

// ---------- 蜗牛 ----------
const WONIU_LOGIN = "https://www.wn4k.com/user/login.html";
const WONIU_CHECKIN = "https://www.wn4k.com/user/checkin.html";

async function woniuCheckin(acct, cookie, triedLogin) {
  let res;
  try {
    res = await fetch(WONIU_CHECKIN, {
      method: "POST",
      headers: { Cookie: cookie, "User-Agent": UA, Referer: WONIU_CHECKIN, "X-Requested-With": "XMLHttpRequest" },
      body: "",
    });
  } catch (e) { bad("蜗牛", acct.label, "签到网络异常"); return; }
  const r = await parseJson(res);
  if (r && r.code === 1) { ok("蜗牛", acct.label, "签到成功 +" + ((r.info && r.info.points) || "10") + " 积分"); return; }
  if (r && r.code === 1001) { ok("蜗牛", acct.label, "今日已签到"); return; }
  if (!triedLogin && acct.user && acct.pass) { await woniuLogin(acct); return; }
  bad("蜗牛", acct.label, "签到失败，" + ((r && r.msg) || "Cookie 或账号密码可能过期"));
}

async function woniuLogin(acct) {
  let res;
  try {
    res = await fetch(WONIU_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA, Referer: WONIU_LOGIN, "X-Requested-With": "XMLHttpRequest" },
      body: "user_name=" + encodeURIComponent(acct.user) + "&user_pwd=" + encodeURIComponent(acct.pass),
    });
  } catch (e) { bad("蜗牛", acct.label, "登录网络异常"); return; }
  const r = await parseJson(res);
  if (!r || r.code !== 1) { bad("蜗牛", acct.label, "登录失败，" + ((r && r.msg) || "请检查账号密码")); return; }
  const cookie = buildCookie(res.headers.getSetCookie());
  if (!cookie || !cookie.includes("user_check=")) { bad("蜗牛", acct.label, "登录成功但没拿到 Cookie"); return; }
  await woniuCheckin(acct, cookie, true);
}

async function runWoniu() {
  const accounts = collectAccounts("WONIU", "WONIU_COOKIE", "WONIU_USERNAME", "WONIU_PASSWORD");
  if (!accounts.length) { console.log("[蜗牛] 未配置账号，跳过"); return; }
  for (const acct of accounts) {
    if (acct.cookie) await woniuCheckin(acct, acct.cookie, false);
    else await woniuLogin(acct);
  }
}

// ---------- EmbyPulse（乐蛙 / 乐观） ----------
async function embyCheckin(site, acct, sessionId, triedLogin) {
  const headers = { Cookie: "session_id=" + sessionId, Origin: site, Referer: site + "/", "User-Agent": UA };
  let infoRes;
  try {
    infoRes = await fetch(site + "/api/user/points/info", { headers });
  } catch (e) { bad(acct.site, acct.label, "查询状态网络异常"); return; }
  const info = await parseJson(infoRes);
  if (info && info.status === "success" && info.data && info.data.has_checked_in) {
    ok(acct.site, acct.label, "今日已签到，积分 " + info.data.points); return;
  }
  let res;
  try {
    res = await fetch(site + "/api/user/points/checkin", { method: "POST", headers, body: "" });
  } catch (e) { bad(acct.site, acct.label, "签到网络异常"); return; }
  const r = await parseJson(res);
  if (r && r.status === "success" && r.data) {
    ok(acct.site, acct.label, "签到成功 +" + (r.data.reward || 0) + " 积分，当前 " + (r.data.balance || "")); return;
  }
  if (r && r.message && r.message.includes("已经签到")) { ok(acct.site, acct.label, "今日已签到"); return; }
  if (!triedLogin && acct.user && acct.pass) { await embyLogin(site, acct); return; }
  bad(acct.site, acct.label, "签到失败，" + ((r && r.message) || ("HTTP " + res.status)));
}

async function embyLogin(site, acct) {
  let res;
  try {
    res = await fetch(site + "/api/requests/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: site, Referer: site + "/", "User-Agent": UA },
      body: JSON.stringify({ username: acct.user, password: acct.pass }),
    });
  } catch (e) { bad(acct.site, acct.label, "登录网络异常"); return; }
  const r = await parseJson(res);
  if (!r || r.status !== "success") { bad(acct.site, acct.label, "登录失败，" + ((r && r.message) || "请检查账号密码")); return; }
  const sessionId = extractSession(res.headers.getSetCookie());
  if (!sessionId) { bad(acct.site, acct.label, "登录成功但没拿到 session_id"); return; }
  await embyCheckin(site, acct, sessionId, true);
}

async function runEmby(name, site, prefix) {
  const accounts = collectAccounts(prefix, prefix + "_SESSION_ID", prefix + "_USERNAME", prefix + "_PASSWORD");
  if (!accounts.length) { console.log(`[${name}] 未配置账号，跳过`); return; }
  for (const acct of accounts) {
    acct.site = name;
    if (acct.cookie) await embyCheckin(site, acct, acct.cookie, false);
    else await embyLogin(site, acct);
  }
}

// ---------- ChilledMelon ----------
const CM_BASE = "https://www.chilledmelon.com";

function solveCaptcha(q) {
  const m = q.match(/(-?\d+)\s*([+\-×x*÷/])\s*(-?\d+)/);
  if (!m) return null;
  const a = parseInt(m[1], 10), b = parseInt(m[3], 10), op = m[2];
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "×" || op === "x" || op === "*") return a * b;
  if (op === "÷" || op === "/") return b === 0 ? null : Math.round(a / b);
  return null;
}

function beijingNow() {
  return new Date(Date.now() + 8 * 3600 * 1000);
}

async function runChilledMelon() {
  const accounts = collectAccounts("CHILLEDMELON", "", "CHILLEDMELON_USERNAME", "CHILLEDMELON_PASSWORD");
  if (!accounts.length) { console.log("[ChilledMelon] 未配置账号，跳过"); return; }
  for (const acct of accounts) {
    let res;
    try {
      res = await fetch(CM_BASE + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA },
        body: JSON.stringify({ username: acct.user, password: acct.pass }),
      });
    } catch (e) { bad("ChilledMelon", acct.label, "登录网络异常"); continue; }
    const login = await parseJson(res);
    if (res.status === 401 || res.status === 403) { bad("ChilledMelon", acct.label, "账号或密码错误"); continue; }
    if (res.status === 429) { bad("ChilledMelon", acct.label, "登录尝试过于频繁，请稍后再试"); continue; }
    if (!login || !login.accessToken) { bad("ChilledMelon", acct.label, "登录失败，" + ((login && login.message) || ("HTTP " + res.status))); continue; }
    const token = login.accessToken;
    const auth = { Authorization: "Bearer " + token, "User-Agent": UA };
    const now = beijingNow();
    let stRes;
    try {
      stRes = await fetch(`${CM_BASE}/api/auth/me/checkin?year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}`, { headers: auth });
    } catch (e) { bad("ChilledMelon", acct.label, "查询签到状态网络异常"); continue; }
    const st = await parseJson(stRes);
    if (st && st.checkedInToday) { ok("ChilledMelon", acct.label, "今日已签到，积分 " + (st.balance || "") + "，今日 +" + (st.todayReward || "") + " 积分"); continue; }
    let capRes;
    try {
      capRes = await fetch(CM_BASE + "/api/auth/me/checkin/captcha", { headers: auth });
    } catch (e) { bad("ChilledMelon", acct.label, "获取验证码网络异常"); continue; }
    const cap = await parseJson(capRes);
    if (!cap || !cap.token || !cap.question) { bad("ChilledMelon", acct.label, "获取验证码失败，" + ((cap && cap.message) || ("HTTP " + capRes.status))); continue; }
    const ans = solveCaptcha(cap.question);
    if (ans === null) { bad("ChilledMelon", acct.label, "无法解析运算题：" + cap.question); continue; }
    let subRes;
    try {
      subRes = await fetch(CM_BASE + "/api/auth/me/checkin", {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ captchaToken: cap.token, captchaAnswer: String(ans) }),
      });
    } catch (e) { bad("ChilledMelon", acct.label, "提交签到网络异常"); continue; }
    const sub = await parseJson(subRes);
    if (sub && sub.checkedIn) ok("ChilledMelon", acct.label, "签到成功 +" + sub.reward + " 积分，当前 " + sub.balance);
    else if (subRes.status === 200 && sub && sub.date) ok("ChilledMelon", acct.label, "今日已签到，今日 +" + (sub.reward || "") + " 积分，当前 " + (sub.balance || ""));
    else bad("ChilledMelon", acct.label, "签到失败，" + ((sub && sub.message) || ("HTTP " + subRes.status)));
  }
}

await runWoniu();
await runEmby("乐蛙", "https://ue2.taotu.ink", "LEWA");
await runEmby("乐观", "https://embyyh.dijia.de", "LEGUAN");
await runChilledMelon();

console.log("---- 签到结果 ----");
if (!results.length) console.log("没有配置任何账号");
else for (const line of results) console.log(line);
if (failed.length) {
  console.log("失败 " + failed.length + " 个账号");
  process.exit(1);
}
