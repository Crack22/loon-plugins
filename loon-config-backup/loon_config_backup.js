/**
 * Loon 配置状态备份 —— Loon cron 脚本
 *
 * 每天把 Loon 当前运行配置保存到你的私人 GitHub 仓库（单个文件 loon-config-state.json，
 * 有变化才提交，git 历史就是版本记录）。
 *
 * 能备份的（Loon 脚本 API 允许拿到的）：
 *   - $config.getConfig()：运行模式、各策略组、每个策略组当前选的节点、final
 *   - $config.getSubPolicies()：每个策略组里的节点名列表
 *   - 设备名、Loon 版本、备份时间
 * 不能备份的：
 *   - 完整的 .conf 文件原文（节点账号密码、订阅地址、规则、脚本原文、MITM 等）
 *     Loon 不允许脚本读取配置文件，脚本 API 里根本没有这个口子。
 *     完整配置请在 Loon 里手动导出 .conf 后放进同一个私人仓库。
 *
 * 配置（BoxJs 里填）：
 *   loon_backup_pat  - 细粒度 GitHub Token，只给备份仓库 Contents 读写权限
 *   loon_backup_repo - 仓库，格式：用户名/仓库名，例如 Crack22/loon-config-backup
 *
 * 注意：主流程必须包在 main() 里。Loon 用 JavaScriptCore 按普通脚本解析，
 * 顶层写 return 会直接报 SyntaxError（Node 的 --check 测不出来，因为 Node
 * 会把文件包进 CommonJS 函数里，顶层 return 在那里是合法的）。
 */

var FILE_PATH = 'loon-config-state.json';
var API_BASE = 'https://api.github.com';

// ---------- base64（Loon 的 JS 环境没有 btoa/atob/Buffer，自己写） ----------
var B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64encode(bytes) {
  var out = '';
  for (var i = 0; i < bytes.length; i += 3) {
    var b0 = bytes[i], b1 = i + 1 < bytes.length ? bytes[i + 1] : 0, b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? B64_CHARS[b2 & 63] : '=';
  }
  return out;
}
function b64decode(str) {
  var clean = str.replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/=]/g, '');
  var out = [];
  for (var i = 0; i < clean.length; i += 4) {
    var v0 = B64_CHARS.indexOf(clean.charAt(i));
    var v1 = B64_CHARS.indexOf(clean.charAt(i + 1));
    var v2 = clean.charAt(i + 2) === '=' ? 0 : B64_CHARS.indexOf(clean.charAt(i + 2));
    var v3 = clean.charAt(i + 3) === '=' ? 0 : B64_CHARS.indexOf(clean.charAt(i + 3));
    out.push((v0 << 2) | (v1 >> 4));
    if (clean.charAt(i + 2) !== '=') out.push(((v1 & 15) << 4) | (v2 >> 2));
    if (clean.charAt(i + 3) !== '=') out.push(((v2 & 3) << 6) | v3);
  }
  return out;
}
function utf8ToBytes(str) {
  var s = unescape(encodeURIComponent(str));
  var out = [];
  for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
  return out;
}
function bytesToUtf8(bytes) {
  var s = '';
  for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return decodeURIComponent(escape(s));
}

function beijingNow() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

function fail(title, content) {
  $notification.post('Loon配置备份', title, content);
  $done();
}

function main() {
  var pat = $persistentStore.read('loon_backup_pat');
  var repo = $persistentStore.read('loon_backup_repo');
  if (!pat) { fail('还没填 Token', '请在 BoxJs「Loon配置状态备份」里填 GitHub Token，再点一下 App 立即备份一次。'); return; }
  if (!repo || repo.indexOf('/') < 0) { fail('还没填仓库', '请在 BoxJs「Loon配置状态备份」里填仓库，格式：用户名/仓库名，例如 Crack22/loon-config-backup。'); return; }

  // ---------- 1. 收集 Loon 当前运行配置 ----------
  var conf;
  try {
    conf = JSON.parse($config.getConfig());
  } catch (e) {
    fail('读不到当前配置', '错误：' + e);
    return;
  }
  var groups = conf.all_policy_groups || [];
  var subPolicies = {};
  var collected = 0;
  var finished = false;

  function collectDone() {
    if (finished) return;
    finished = true;
    upload();
  }

  if (groups.length === 0) {
    collectDone();
  } else {
    for (var gi = 0; gi < groups.length; gi++) {
      (function (name) {
        try {
          $config.getSubPolicies(name, function (subs) {
            subPolicies[name] = subs || [];
            collected++;
            if (collected >= groups.length) collectDone();
          });
        } catch (e) {
          subPolicies[name] = [];
          collected++;
          if (collected >= groups.length) collectDone();
        }
      })(groups[gi]);
    }
    // 兜底：15 秒内没收齐也照常备份已收到的部分，不让脚本一直挂着
    setTimeout(function () { collectDone(); }, 15000);
  }

  // ---------- 2. 上传到 GitHub 私人仓库 ----------
  function upload() {
    var loonInfo = '';
    try { loonInfo = JSON.stringify($loon); } catch (e) { loonInfo = ''; }
    var snapshot = {
      name: 'Loon配置状态备份',
      note: 'Loon 不允许脚本读取完整 .conf 文件；这份备份只含运行模式、策略组及当前选择、各组节点名。完整配置请手动导出 .conf 放进本仓库。',
      updated_at: beijingNow() + ' (北京时间)',
      device: loonInfo,
      config: conf,
      sub_policies: subPolicies
    };
    var content = JSON.stringify(snapshot, null, 2);
    var b64 = b64encode(utf8ToBytes(content));
    var url = API_BASE + '/repos/' + repo + '/contents/' + FILE_PATH;
    var headers = {
      'Authorization': 'Bearer ' + pat,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'loon-config-backup'
    };

    // 先读现有文件：拿到 sha（更新用），没变化就不提交；网络超时重试 2 次
    var getTries = 0;
    function doGet() {
      $httpClient.get({ url: url, headers: headers, timeout: 60 }, function (err, resp, data) {
      if (err) {
        getTries++;
        if (getTries <= 2) { console.log('[Loon配置备份] 读文件超时，第 ' + getTries + ' 次重试'); setTimeout(doGet, 3000); return; }
        fail('备份失败', '读仓库文件失败：' + err); return;
      }
      var status = resp && resp.status;
      var sha = null;
      if (status === 200) {
        try {
          var cur = JSON.parse(data);
          sha = cur.sha;
          if (cur.content && bytesToUtf8(b64decode(cur.content)) === content) {
            console.log('[Loon配置备份] 无变化，跳过提交');
            $done();
            return;
          }
        } catch (e) { /* 解析失败就继续走更新 */ }
      } else if (status !== 404) {
        fail('备份失败', '读仓库文件返回 HTTP ' + status + '，请检查 Token 和仓库名。');
        return;
      }
      var body = { message: '备份 Loon 配置状态 ' + beijingNow(), content: b64 };
      if (sha) body.sha = sha;
      var putTries = 0;
      function doPut() {
      $httpClient.put({ url: url, headers: headers, body: JSON.stringify(body), timeout: 60 }, function (err2, resp2, data2) {
        if (err2) {
          putTries++;
          if (putTries <= 2) { console.log('[Loon配置备份] 上传超时，第 ' + putTries + ' 次重试'); setTimeout(doPut, 3000); return; }
          fail('备份失败', '上传失败：' + err2); return;
        }
        var st = resp2 && resp2.status;
        if (st === 200 || st === 201) {
          $notification.post('Loon配置备份', '已备份', '已保存到 ' + repo + '（' + beijingNow() + '）');
          $done();
        } else if (st === 401) {
          fail('Token 无效或已过期', '请重新建一个 Token 填进 BoxJs。');
        } else if (st === 404) {
          fail('仓库不存在或 Token 没权限', '请检查仓库名 ' + repo + '，以及 Token 是否给了这个仓库 Contents 读写权限。');
        } else {
          fail('备份失败', 'GitHub 返回 HTTP ' + st + '：' + String(data2 || '').slice(0, 200));
        }
      });
      }
      doPut();
    });
    }
    doGet();
  }
}

main();
