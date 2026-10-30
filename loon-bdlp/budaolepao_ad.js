/**
 * 步道乐跑 · 广告字段清洗 —— Loon (http-response)
 * 作用：把 App 接口返回 JSON 里的广告节点、广告列表项、广告位字段整体清空
 * 用法：插件里挂 http-response，requires-body=true
 * 说明：不依赖具体接口路径，任何被 MITM 的 JSON 响应都会被清洗
 */

const CONFIG = {
  DEBUG: false,          // true 会在 Loon 日志里打印清洗了多少字段
  DROP_MODE: 'empty',    // 'empty' = 清空成 {} / [] / ""（推荐，结构完整不易崩）；'delete' = 整个 key 删掉
  DROP_DOMAINS_KEEP: [], // 想放行的域名后缀，例如 ['example.com']

  // 整个节点直接删除的 key（开屏 / 启动图这类）
  dropKeys: [
    'splash', 'splash_ad', 'splashad', 'open_screen', 'openscreen', 'open_screen_ad',
    'openscreenad', 'start_page', 'startpage', 'start_ad', 'startad', 'kaiping',
    'kaiping_ad', 'launch_ad', 'launchad', 'boot_ad', 'bootad', 'cold_splash',
  ],

  // 命中任一 token 就把该字段清空
  adTokens: [
    'ad', 'ads', 'adv', 'advert', 'adverts', 'advertise', 'advertisement', 'advertising',
    'adlist', 'adinfo', 'adunit', 'adslot', 'adzone', 'adbanner', 'adconfig', 'adcfg',
    'banner', 'banners', 'bannerlist', 'bannerinfo',
    'splash', 'openad', 'openscreen', 'startpage', 'kaiping',
    'promotion', 'promote', 'promoted', 'tuiguang', 'tuiguanglist',
    'pangle', 'csj', 'gdt', 'interstitial', 'interstitialad',
    'feedad', 'nativead', 'nativeads', 'preloadad', 'adview', 'adpopup', 'popupad',
  ],

  // 判断列表项是不是广告：只认明确的布尔标志，避免 ad_type 这种歧义字段误删正常内容
  flagKeys: [
    'is_ad', 'isad', 'is_ads', 'isads', 'is_advert', 'isadvert', 'isadv',
    'is_gg', 'isgg', 'is_promote', 'ispromote', 'is_advertisement',
  ],

  // 这些字段语义有歧义（可能只是广告素材类型），原样保留，既不清空也不当广告判据
  ambiguousKeys: [
    'ad_type', 'adtype', 'ad_source', 'adsource', 'ad_position', 'adposition',
  ],

  // 白名单：这些 key 一定不动（防止把 load / header / address 之类误伤）
  keepKeys: [
    'load', 'loading', 'upload', 'download', 'read', 'reader', 'thread', 'threads',
    'header', 'headers', 'address', 'addresses', 'adcode', 'addresslist', 'addressinfo',
    'layout', 'layouts', 'badge', 'badges', 'admin', 'advance', 'advanced', 'adapt',
    'adapter', 'addition', 'add', 'adds', 'shade', 'shadow', 'grade', 'broadcast',
    'deadline', 'glad', 'readonly', 'headerimg', 'headimg', 'adress', 'shadead',
  ],
};

function tokensOf(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
    .split(/[_\-.\s/]+/)
    .filter(function (x) { return x.length > 0; });
}

function lc(s) { return String(s).toLowerCase(); }

function isDropKey(key) {
  const k = lc(key);
  if (CONFIG.keepKeys.indexOf(k) !== -1) return false;
  if (CONFIG.dropKeys.indexOf(k) !== -1) return true;
  const parts = tokensOf(key);
  for (let i = 0; i < parts.length; i++) {
    if (CONFIG.dropKeys.indexOf(parts[i]) !== -1) return true;
  }
  return false;
}

function isAdKey(key) {
  const k = lc(key);
  if (CONFIG.keepKeys.indexOf(k) !== -1) return false;
  if (CONFIG.ambiguousKeys.indexOf(k) !== -1) return false;
  if (CONFIG.adTokens.indexOf(k) !== -1) return true;
  const parts = tokensOf(key);
  for (let i = 0; i < parts.length; i++) {
    if (CONFIG.adTokens.indexOf(parts[i]) !== -1) return true;
  }
  return false;
}

function emptyLike(v) {
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return {};
  if (typeof v === 'string') return '';
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  return null;
}

function truthy(v) {
  if (v === true) return true;
  if (v === false || v === null || v === undefined) return false;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'y';
  }
  return false;
}

function hasAdFlag(item) {
  const keys = Object.keys(item);
  for (let i = 0; i < keys.length; i++) {
    const k = lc(keys[i]);
    if (CONFIG.flagKeys.indexOf(k) !== -1 && truthy(item[keys[i]])) return true;
  }
  return false;
}

function clean(node, st) {
  if (Array.isArray(node)) {
    const out = [];
    for (let i = 0; i < node.length; i++) {
      const item = node[i];
      if (item && typeof item === 'object' && !Array.isArray(item) && hasAdFlag(item)) {
        st.removedItems++;
        continue;
      }
      out.push(clean(item, st));
    }
    return out;
  }

  if (node && typeof node === 'object') {
    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (isDropKey(k)) {
        if (CONFIG.DROP_MODE === 'delete') {
          delete node[k];
        } else {
          node[k] = emptyLike(node[k]);
        }
        st.dropped++;
        continue;
      }
      if (isAdKey(k)) {
        node[k] = emptyLike(node[k]);
        st.cleaned++;
        continue;
      }
      node[k] = clean(node[k], st);
    }
    return node;
  }

  return node;
}

(function () {
  try {
    if (typeof $response === 'undefined' || !$response) return $done({});

    const url = (typeof $request !== 'undefined' && $request && $request.url) ? String($request.url) : '';

    for (let i = 0; i < CONFIG.DROP_DOMAINS_KEEP.length; i++) {
      if (url.indexOf(CONFIG.DROP_DOMAINS_KEEP[i]) !== -1) return $done({});
    }

    let body = $response.body;
    if (body === undefined || body === null || body === '') return $done({});
    body = String(body);

    const head = body.trim().slice(0, 1);
    if (head !== '{' && head !== '[') return $done({});

    let obj;
    try { obj = JSON.parse(body); } catch (e) { return $done({}); }

    const st = { cleaned: 0, dropped: 0, removedItems: 0 };
    const out = clean(obj, st);

    if (st.cleaned === 0 && st.dropped === 0 && st.removedItems === 0) return $done({});

    const newBody = JSON.stringify(out);
    if (newBody === body) return $done({});
    if (CONFIG.DEBUG) {
      console.log('[步道乐跑去广告] ' + url + ' 清空字段 ' + st.cleaned +
        ' 删除节点 ' + st.dropped + ' 剔除广告项 ' + st.removedItems);
    }
    $done({ body: newBody });
  } catch (e) {
    console.log('[步道乐跑去广告] 异常: ' + (e && e.message ? e.message : e));
    $done({});
  }
})();
