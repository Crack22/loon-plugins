# 許諾的 Loon 插件合集

[![更新图标合集](https://github.com/Crack22/loon-plugins/actions/workflows/update-icons.yml/badge.svg)](https://github.com/Crack22/loon-plugins/actions/workflows/update-icons.yml)
[![每日签到](https://github.com/Crack22/loon-plugins/actions/workflows/daily-checkin.yml/badge.svg)](https://github.com/Crack22/loon-plugins/actions/workflows/daily-checkin.yml)

許諾自用的 Loon 插件合集：每日签到、去广告、BoxJs 订阅、图标库，全部亲测可用。

> 提示：Loon 里更新插件不会刷新插件的标题和描述，更新后请删除插件再重新导入。

## 目录结构

```text
loon-plugins/
├── loon-*/            # 插件：每个插件一个文件夹（.plugin + 脚本）
├── boxjs.json         # BoxJs 统一订阅：許諾自用应用
├── boxjs-leguan.json  # BoxJs 独立订阅：乐观专用
├── icons/             # 图标与图标库
├── docs/              # 使用指南
└── actions/           # GitHub Actions 云端签到脚本
```

## 插件

| 插件 | 功能 | 定时 | 安装 |
| --- | --- | --- | --- |
| 步道乐跑 · 全量去广告 | 去除步道乐跑广告 | — | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-bdlp/BudaolepaoAD.plugin) |
| WPS Office 每日签到 | WPS 每日签到领会员 | 10:00 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-wps/WPSCheckin.plugin) |
| 大蓝树每日签到 | 大蓝树每日签到 | 08:30 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-dalanshu/DalanshuCheckin.plugin) |
| 蜗牛每日签到 | 蜗牛 4K 每日签到，+10 积分 | 09:00 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-woniu/WoNiuCheckin.plugin) |
| 七日杀每日签到 | 七日杀中文网每日签到 | 08:30 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-7risha/7risha.plugin) |
| ChilledMelon 每日签到 | ChilledMelon 每日签到，+5~20 积分 | 09:00 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-chilledmelon/ChilledMelonCheckin.plugin) |
| 微博超话每日打卡 | 黄子弘凡超话签到 + 打卡发帖 | 09:00 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-weibo/WeiboChaohuaCheckin.plugin) |
| 乐蛙每日签到 | EmbyPulse 乐蛙每日签到，+100~120 积分 | 09:00 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-embypulse1/EmbyPulseTaotuCheckin.plugin) |
| 乐观每日签到 | EmbyPulse 乐观每日签到，+90~130 积分 | 09:00 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-embypulse2/EmbyPulseDijiaCheckin.plugin) |
| 夸克每日签到 | 夸克网盘 + 夸克浏览器每日签到领容量 | 09:00 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-quark/QuarkCheckin.plugin) |
| GLaDOS 每日签到 | GLaDOS 每日签到领积分 | 09:00 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-glados/GladosCheckin.plugin) |
| X 网页版会员标签页 | X 网页版会员标签页 | — | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-x/XWebEnhance.plugin) |
| lume 相机 | Lume 相机 VIP 验证响应修改 | — | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-lume/LumeCamera.plugin) |
| 同步 Git Secrets | 把 BoxJs 里的签到账号同步到 GitHub Secrets | 手动 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-gh-sync/GitHubSecretsSync.plugin) |
| Loon 配置状态备份 | 每天备份 Loon 运行配置到私人仓库 | 04:00 | [一键安装](loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-config-backup/LoonConfigBackup.plugin) |

签到类插件支持多账号：Cookie 和账号密码二选一，Cookie 过期时有账号密码会自动重新登录。Cookie 和密码只保存在手机本地，不会上传。

## BoxJs 订阅

| 订阅 | 内容 | 导入 |
| --- | --- | --- |
| 許諾自用应用 | 12 个应用：上面全部签到插件 + 同步 Git Secrets + Loon 配置状态备份 | https://raw.githubusercontent.com/Crack22/loon-plugins/main/boxjs.json |
| 乐观专用 | 乐观每日签到 + 同步 Git Secrets（可分享给别人用） | https://raw.githubusercontent.com/Crack22/loon-plugins/main/boxjs-leguan.json |

乐观专用完整使用指南：[docs/leguan-guide.md](docs/leguan-guide.md)

## 图标库

| 图标库 | 内容 | 链接 |
| --- | --- | --- |
| 許諾图标合集 | 15 个上游图标库合并，4968 个图标，每天 06:00 自动更新 | https://raw.githubusercontent.com/Crack22/loon-plugins/main/icons/icons-merged.json |
| 許諾 BoxJs 图标 | 本仓库全部 BoxJs 图标，13 个图标，每天 06:00 自动更新 | https://raw.githubusercontent.com/Crack22/loon-plugins/main/icons/icons-boxjs.json |

图标库来源在 [icons/sources.json](icons/sources.json) 里，改它就能增减上游库。`icons/zishi-cs.json` 是 LovedGM 图标库的原样备份，不参与合并。

## 自动运行

GitHub Actions 每天自动跑两件事，仓库是公开的，不花钱：

- **每日签到**（09:00）：蜗牛、乐蛙、乐观、冰瓜在云端签到，不用挂梯子；本地 Loon 插件保持不变，两边谁先签到谁赢，另一边会看到今日已签到。
- **更新图标合集**（06:00）：两个图标库有变化就自动提交更新。

## 致谢

### 脚本来源

- [fmz200/wool_scripts](https://github.com/fmz200/wool_scripts) — 大蓝树、X 插件脚本
- [MaYIHEI/paperclip](https://github.com/MaYIHEI/paperclip) — WPS 签到脚本
- [彭于晏](https://github.com/89996462/Quantumult-X) — 光卷（lume 相机原脚本）
- [Curtinp118/Scripthub](https://github.com/curtinp118/Scripthub) — GLaDOS 签到脚本（原脚本）
- [xh321/LiteLoaderQQNT-Anti-Recall](https://github.com/xh321/LiteLoaderQQNT-Anti-Recall) — QQ 防撤回（不在本仓库，仅致谢）

### 图标库来源

<details>
<summary>15 个上游图标库（点击展开）</summary>

- [TheMagic-Icons](https://github.com/Twoandz9/TheMagic-Icons) — Twoandz9
- [Quremini / QureColor / QureColor-All](https://github.com/Koolson/Qure) — Koolson
- [mini / miniColor / Color+](https://github.com/Orz-3/mini) — Orz-3
- [Sakura](https://github.com/baiitang/Sakura) — baiitang
- [Semporia](https://github.com/Semporia) — Semporia
- [EDC Airport](https://github.com/erdongchanyo) — erdongchanyo
- [Cute](https://github.com/tugepaopao) — tugepaopao
- [Catcat](https://github.com/Yuanxsxs) — Yuanxsxs
- [lige](https://github.com/lige47) — lige47
- [PVSZ](https://github.com/shoujiqiyuan) — shoujiqiyuan
- [wool_scripts 图标](https://github.com/fmz200/wool_scripts) — fmz200

</details>

## License

[MIT](LICENSE)
