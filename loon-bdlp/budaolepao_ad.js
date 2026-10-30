/**
 * 步道乐跑 · 广告字段清洗 v2 —— Loon (http-response)
 * v2 修复点：
 *  1. 插件里 script-path 已改成绝对 URL，远程导入即自动下载，不用手动放 JS
 *  2. 处理字符串里套 JSON 的情况（很多 App 把广告列表塞在 string 字段里）
 *  3. 列表项判定放宽：type/adId/advertisement 等明确是广告的也踢掉，不只认 is_ad
 *  4. 更多中文 App 常见广告 key：sponsor、chaping、kaiping、tuiguang、gg 等
 * 用法：插件里挂 http-response，requires-body=true
 */

const CONFIG = {
  DEBUG: false,
  DROP_MODE: 'empty',
  DROP_DOMAINS_KEEP: [],

  dropKeys: [
    'splash', 'splash_ad', 'splashad', 'open_screen', 'openscreen', 'open_screen_ad',
    'openscreenad', 'start_page', 'startpage', 'start_ad', 'startad', 'kaiping',
    'kaiping_ad', 'launch_ad', 'launchad', 'boot_ad', 'bootad', 'cold_splash',
    'welcome_ad', 'welcomead', 'chaping', 'chaping_ad', 'interstitial_ad',
  ],

  adTokens: [
    'ad', 'ads', 'adv', 'advert', 'adverts', 'advertise', 'advertisement', 'advertising',
    'adlist', 'adinfo', 'adunit', 'adslot', 'adzone', 'adbanner', 'adconfig', 'adcfg',
    'banner', 'banners', 'bannerlist', 'bannerinfo',
    'splash', 'openad', 'openscreen', 'startpage', 'kaiping',
    'promotion', 'promote', 'promoted', 'tuiguang', 'tuiguanglist',
    'pangle', 'csj', 'gdt', 'interstitial', 'interstitialad',
    'feedad', 'nativead', 'nativeads', 'preloadad', 'adview', 'adpopup', 'popupad',
    'sponsor', 'sponsored', 'sponsorship', 'marketing', 'commercial',
    'reward', 'rewarded', 'rewardad', 'incentive',
    'gg', 'guanggao',
  ],

  // 列表项是广告的判定：布尔/数字/字符串标志 + 类型字段
  flagKeys: [
    'is_ad', 'isad', 'is_ads', 'isads', 'is_advert', 'isadvert', 'isadv',
    'is_gg', 'isgg', 'is_promote', 'ispromote', 'is_advertisement',
    'adflag', 'ad_flag', 'is_ad_flag', 'has_ad', 'hasad',
  ],
  // type / materialType 等字段等于这些值时，整项就是广告
  adTypeValues: [
    'ad', 'ads', 'advert', 'advertisement', 'banner', 'splash', 'kaiping',
    'openscreen', 'interstitial', 'reward', 'rewarded', 'feed_ad', 'feedad',
    'native_ad', 'nativead', 'sponsor', 'promotion', 'tuiguang',
  ],

  ambiguousKeys: [
    'ad_type', 'adtype', 'ad_source', 'adsource', 'ad_position', 'adposition',
  ],

  keepKeys: [
    'load', 'loading', 'upload', 'download', 'read', 'reader', 'thread', 'threads',
    'header', 'headers', 'address', 'addresses', 'adcode', 'addresslist', 'addressinfo',
    'layout', 'layouts', 'badge', 'badges', 'admin', 'advance', 'advanced', 'adapt',
    'adapter', 'addition', 'add', 'adds', 'shade', 'shadow', 'grade', 'broadcast',
    'deadline', 'glad', 'readonly', 'headerimg', 'headimg', 'adress', 'shadead',
    // 步道乐跑正常业务字段，别误伤
    'run', 'running', 'pace', 'distance', 'step', 'steps', 'mileage', 'route',
    'user', 'userid', 'username', 'avatar', 'nickname', 'school', 'campus',
  ],
};

function tokensOf(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
    .split(/[_\-\.\s\/]+/)
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
    const v = item[keys[i]];
    if (CONFIG.flagKeys.indexOf(k) !== -1 && truthy(v)) return true;
    // adId / advertisementId 等只要有非空值，且同项没有正常业务主键，往往就是广告位
    if ((k === 'adid' || k === 'ad_id' || k === 'advertisementid' || k === 'advertisement_id') && v) return true;
    // type 字段明确是广告
    if ((k === 'type' || k === 'materialtype' || k === 'material_type' || k === 'itemtype' || k === 'item_type' || k === 'contenttype' || k === 'content_type') && typeof v === 'string') {
      if (CONFIG.adTypeValues.indexOf(v.trim().toLowerCase()) !== -1) return true;
    }
  }
  return false;
}

// 字符串里套 JSON 也要清，例如 data: "{\"ad_list\":[...]}"
function cleanStringMaybeJson(s, st) {
  const t = s.trim();
  if ((t.slice(0, 1) !== '{' && t.slice(0, 1) !== '[') || t.length < 3) return s;
  try {
    const parsed = JSON.parse(t);
    const before = JSON.stringify(parsed);
    const cleaned = clean(parsed, st);
    const after = JSON.stringify(cleaned);
    return before === after ? s : after;
  } catch (e) {
    return s;
  }
}

function clean(node, st) {
  if (typeof node === 'string') {
    return cleanStringMaybeJson(node, st);
  }
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
        node[k] = CONFIG.DROP_MODE === 'delete' ? undefined : emptyLike(node[k]);
        if (CONFIG.DROP_MODE === 'delete') delete node[k];
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
      console.log('[步道乐跑去广告 v2] ' + url + ' 清空 ' + st.cleaned + ' 删除 ' + st.dropped + ' 剔除 ' + st.removedItems);
    }
    $done({ body: newBody });
  } catch (e) {
    console.log('[步道乐跑去广告 v2] 异常: ' + (e && e.message ? e.message : e));
    $done({});
  }
})();
