# 步道乐跑 · 全量去广告（Loon 插件）v2

## v2 改了什么（上一版为什么“什么都不行”）
- **主因：远程导入的脚本地址错了。** 上一版插件里 `script-path=budaolepao_ad.js` 只是文件名，Loon 远程导入时不会自动下载这个 JS，只有手动把 JS 放进本地 Scripts 才生效。v2 已改成绝对地址 `https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-bdlp/budaolepao_ad.js`，导入即生效，不用手动放 JS。
- MITM 和 Script 匹配放宽：不再只认 `.com/.cn`，任何含 `budaolepao/lepao/bdty/bdlp` 的域名都走脚本。
- 脚本新增：字符串里套 JSON 也清、列表项按 `type/adId` 也踢、更多广告 key（sponsor/chaping/tuiguang/gg 等）。
- 导入后务必：插件已启用、MitM 证书已安装并信任、杀掉步道乐跑重开。

## 如果 v2 还有广告，先这样排查
1. Loon → 配置 → 插件，确认本插件是启用状态，且不是只导入了没开。
2. Loon → 设置 → MitM，确认证书已安装，系统设置 → 通用 → 关于本机 → 证书信任设置里已打开 Loon。
3. Loon → 日志/请求记录，打开步道乐跑刷几下，看广告请求到底是哪个域名，把那个域名告诉我，我再补进 Rule/MITM。
4. 如果广告和正常内容走同一个接口、同一个字段，脚本只能按 key 清，域名拦截是拦不住的，得靠第 3 步抓到的真实字段名再补。

---

# 步道乐跑 · 全量去广告（Loon 插件）

```
BudaolepaoAD.plugin   ← Loon 插件本体，直接装
budaolepao_ad.js      ← 广告字段清洗脚本，插件会调用它
README.md             ← 就是你正在看的
```

---

## 一、它干了三件事

| 层 | 手段 | 干掉什么 |
|---|---|---|
| 1 | `[Rule]` 域名 REJECT | 穿山甲、优量汇、快手联盟、百度联盟、Mintegral、AppLovin 等 SDK 的请求根本出不去 |
| 2 | `[URL Rewrite]` reject-dict | 路径里明确带 `ad` / `splash` / `openscreen` 的接口，直接回一个空 JSON |
| 3 | `[Script]` 响应清洗 | 接口正常返回但里面塞了广告字段，脚本递归把广告节点清空、把 `is_ad:1` 的列表项剔掉 |

第三层是关键。国内 App 的广告很多是「自己的接口里带 ad 字段」，光拦域名拦不住 API 返回的广告数据。

---

## 二、安装

### 1. 放文件

- `budaolepao_ad.js` → Loon App「配置」→「Scripts」→ 新建同名文件，粘进去。
- `BudaolepaoAD.plugin` → 存到 iCloud /「文件」App 任意目录。

### 2. 装插件

Loon App →「配置」→ 右上角 `+` →「从文件导入」→ 选 `BudaolepaoAD.plugin` → 启用。

或者把插件托管到自己的服务器/Gist，用 URL 导入。

### 3. 信任证书

Loon 插件里的 `[MITM]` 会自动往你现有配置里追加域名。首次用要装证书：

Loon →「设置」→「MitM」→ 安装证书 → 设置 → 通用 → 关于本机 → 证书信任设置 → 打开 Loon。

### 4. 打开步道乐跑

清一下 App 缓存（或直接杀掉重开），开屏广告没了就说明生效。

---

## 三、脚本清洗规则详解

`budaolepao_ad.js` 顶部 `CONFIG` 就是全部可调项。

### 1. 整个节点清空 `dropKeys`

开屏、启动图这类：

```
splash, splash_ad, open_screen, openscreen, start_page, startpage,
kaiping, launch_ad, cold_splash ...
```

默认**清空成 `{}` 而不是删除**，因为有些 App 直接读 `data.splash.url`，key 不存在会崩，空对象取属性是 undefined 不会崩。想真删就把 `DROP_MODE` 改成 `'delete'`。

### 2. 字段清空 `adTokens`

key 名按驼峰和下划线切词，任一词命中就清空：

```
ad, ads, adv, advert, advertisement, adlist, adinfo, adunit, adslot,
banner, banners, promotion, promote, tuiguang, pangle, csj, gdt,
interstitial, feedad, nativead, preloadad, adview, popupad ...
```

清空时保持类型：数组 → `[]`，对象 → `{}`，字符串 → `""`，数字 → `0`，布尔 → `false`。

### 3. 剔除广告列表项 `flagKeys`

列表里带明确布尔标志的项直接踢掉：

```
is_ad, isad, is_ads, is_advert, is_gg, is_promote ...
```

### 4. 不误伤的白名单

`keepKeys` 和 `ambiguousKeys` 里是明确不动的：

```
load / upload / download / read / thread / header / address / adcode /
layout / badge / admin / advance / adapter / grade / broadcast / deadline
ad_type / adtype / ad_source / adsource / ad_position
```

`ad_type` 这类字段语义有歧义（可能只是「素材是图片还是视频」，不是「是不是广告」），脚本既不清理也不当广告判据。**如果你发现某块正常内容被误删，把那个 key 加进 `keepKeys` 就行。**

---

## 四、域名对不上怎么办

国内 App 换域名是常事。插件里默认按这几个匹配：

```
*.budaolepao.com  *.budaolepao.cn  *.lepao.com  *.lepao.cn
```

如果你发现广告还在，先确认接口域名：

**方法 A（Loon 自带）**：Loon →「日志」/「请求记录」，打开步道乐跑刷几下，看 `api.xxx` 是哪个域名。

**方法 B（抓一次）**：临时在配置里加

```ini
[Script]
http-request ^https?:\/\/ script-path=logurl.js, requires-body=false, tag=记域名
```

`logurl.js`：

```javascript
$notification.post('URL', '', $request.url);
$done({});
```

`[MITM]` 临时改成 `hostname = %APPEND% *`，刷一遍 App，通知里就是全部域名，看完删掉。**用完一定把 `hostname` 改回来**，`*` 全量解密很吃性能，而且涉及你所有流量。

拿到真实域名后改插件两处：

```ini
[Script]
http-response ^https?:\/\/api\.你的域名\.com\/ script-path=budaolepao_ad.js, requires-body=true, max-size=0, tag=步道乐跑去广告

[MITM]
hostname = %APPEND% api.你的域名.com
```

---

## 五、验证情况

`budaolepao_ad.js` 用 mock 的 Loon 运行时（`$request` / `$response` / `$done`）跑了 11 个用例：

| 用例 | 结果 |
|---|---|
| 开屏 `splash` + `banners` + `ad_list` | `splash`→`{}`，两者→`[]`，正常 `user` 数据不动 ✔ |
| 列表含 `is_ad:1` / `ad_type:2` / `is_ad:0` | 只踢 `is_ad:1`，`ad_type` 项完整保留 ✔ |
| 正常字段（`header`/`address`/`adcode`/`load`） | 原样放行，零误伤 ✔ |
| 纯正常 JSON | 原样放行 ✔ |
| HTML 响应 | 原样放行（不碰非 JSON） ✔ |
| 空 body / base64 二进制 | 原样放行 ✔ |
| 驼峰 `isAd` / `adList` / `openScreen` | `adList`→`[]`，`openScreen`→`{}`，`isAd:true` 项被踢 ✔ |
| 三层嵌套 `ad_info` | 正确清空，兄弟字段保留 ✔ |
| 数组套数组 | 正确递归 ✔ |
| `ad:null` | 判定为无变化，不重写响应 ✔ |

`node --check` 语法通过。

**没验证的**：真机上的实际效果。沙箱里没有步道乐跑的账号和流量，`[Rule]` 里那批 SDK 域名是按行业通用域名写的，`*.budaolepao.*` 是按常见命名猜的。你装上后如果还有广告，按第四节抓域名补进来——脚本本身不用改。
