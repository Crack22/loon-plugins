# 許諾签到合集

把签到类任务全部转成 Loon 插件，共 87 个。签到脚本本身留在上游，这里只提供插件外壳（抓取 Cookie + 定时触发）和 BoxJs 设置。

BoxJs 订阅：https://raw.githubusercontent.com/Crack22/loon-plugins/main/boxjs-checkins.json

用法：装好插件，打开重写和 cron，打开对应 App 停留几秒，收到「Cookie 获取成功」即抓取成功；抓完后在插件设置里关掉「抓取开关」，只留定时签到。也可以在 Loon → 脚本里点「<服务>去抓取」手动触发：点一下发通知，点通知打开抓取页，停几秒即自动抓取（14 个有网页目标的在 BoxJs 里也有「点我打开抓取」链接）。Cookie 只保存在手机本地，不会上传。

注意：这些插件只在 Loon 本地跑，不进 GitHub Actions 云端；上游脚本年久未更新的可能已经失效，装之前先看一眼对应 App 还能不能签到。

| 插件 | 定时 | 安装 |
| --- | --- | --- |
| APK.TW每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/apktw/Apktw.plugin) |
| AcFun每日签到 | 08:01 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/acfun/Acfun.plugin) |
| CSDN每日签到 | 08:04 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/csdn/Csdn.plugin) |
| Funboat签到 | 08:04 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/funboat/Funboat.plugin) |
| IT之家每日签到 | 02:11 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ithome/Ithome.plugin) |
| NGA刮墙每日签到 | 00:10 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/nga/Nga.plugin) |
| QQ萌宠每日签到 | 00:04 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qqpet/QqPet.plugin) |
| QQ音乐每日签到 | 08:04 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qqmusic/QqMusic.plugin) |
| V2EX每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/v2ex/V2ex.plugin) |
| Zaker每日签到 | 08:08 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zaker/Zaker.plugin) |
| go语言中文网每日签到 | 09:00 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/studygolang/StudyGolang.plugin) |
| qq会员成长值 | 05:05 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qqvip/QqVip.plugin) |
| 七猫小说每日签到 | 08:07 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qimao/Qimao.plugin) |
| 万达电影每日签到 | 02:12 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/wanda/Wanda.plugin) |
| 中国联通每日签到 | 08:05 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/china-unicom/ChinaUnicom.plugin) |
| 京东成长分每日签到 | 08:10 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jd-czf/JdCzf.plugin) |
| 京东每日签到 | 01:15 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jd/JD.plugin) |
| 京东白条每日签到 | 03:05 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jd-baitiao/JdBaitiao.plugin) |
| 京东读书 | 00:14 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jd-read/JdRead.plugin) |
| 什么值得买每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/smzdm/Smzdm.plugin) |
| 今日头条极速版每日签到 | 08:05 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jrtt/Jrtt.plugin) |
| 全民K歌每日签到 | 08:06 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qmkg/Qmkg.plugin) |
| 加油广东每日签到 | 08:04 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/gdoil/Gdoil.plugin) |
| 南方周末每日签到 | 02:11 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/nfzm/Nfzm.plugin) |
| 去哪儿每日签到 | 08:02 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qunar/Qunar.plugin) |
| 叮咚买菜每日签到 | 08:06 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/dingdong/Dingdong.plugin) |
| 叮咚农场 | 08:01 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/dingdong-farm/DingdongFarm.plugin) |
| 吾爱破解每日签到 | 08:01 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/52pojie/52Pojie.plugin) |
| 哈啰出行每日签到 | 08:08 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/hellobike/HelloBike.plugin) |
| 哔哩哔哩每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/bilibili/Bilibili.plugin) |
| 哔哩哔哩漫画每日签到 | 08:01 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/bilibili-manga/BilibiliManga.plugin) |
| 哔哩哔哩银瓜子换硬币每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/bilibili-silver2coin/BilibiliSilver2Coin.plugin) |
| 喜马拉雅每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ximalaya/Ximalaya.plugin) |
| 多看每日签到 | 03:00 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/duokan/Duokan.plugin) |
| 太好购每日签到 | 00:10 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/thg/Thg.plugin) |
| 奇瑞汽车App签到 | 07:17 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/chery/Chery.plugin) |
| 威锋网每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/feng/Feng.plugin) |
| 工银e生活每日签到 | 08:10 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/icbc/Icbc.plugin) |
| 建行生活签到 | 07:17 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ccb-life/CCBLife.plugin) |
| 微信小程序-同程艺龙每日签到 | 08:10 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/tongcheng/Tongcheng.plugin) |
| 微商星球每日签到 | 00:16 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/wsxq/Wsxq.plugin) |
| 快手果园 | 01:30 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/kuaishou/Kuaishou.plugin) |
| 快看漫画每日签到 | 09:04 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/kuaikan/Kuaikan.plugin) |
| 懂球帝每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/dongqiudi/Dongqiudi.plugin) |
| 拼多多果园 | 01:30 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/pdd/PDD.plugin) |
| 掌上飞车每日签到 | 08:08 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zsfc/Zsfc.plugin) |
| 携程小程序每日签到 | 08:09 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ctrip-wx/CtripWx.plugin) |
| 携程旅行每日签到 | 08:29 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ctrip/Ctrip.plugin) |
| 斗鱼鱼吧签到 | 07:15 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/douyu/Douyu.plugin) |
| 旅行世界购物版每日签到 | 09:00 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/lxsj/Lxsj.plugin) |
| 时光相册每日签到 | 08:05 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/everphoto/Everphoto.plugin) |
| 晓晓优选每日任务 | 07:17 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/xxyx/XXYX.plugin) |
| 智行火车每日签到 | 08:07 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zxhc/Zxhc.plugin) |
| 有道云笔记每日签到 | 03:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/noteyoudao/NoteYoudao.plugin) |
| 柚子快报每日签到 | 00:11 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/yzkb/Yzkb.plugin) |
| 樊登读书每日签到 | 08:06 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/fandeng/Fandeng.plugin) |
| 欧可林商城每日签到 | 04:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/oclean-mall/OcleanMall.plugin) |
| 欧可林每日签到 | 10:00 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/oclean/Oclean.plugin) |
| 民盈国贸城每日签到 | 00:15 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/mygmc/Mygmc.plugin) |
| 海底捞每日签到 | 08:07 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/haidilao/Haidilao.plugin) |
| 海德汇一城每日签到 | 00:12 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/hdhyc/Hdhyc.plugin) |
| 爱奇艺每日签到 | 08:01 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/iqiyi/Iqiyi.plugin) |
| 猫咪音乐每日签到 | 08:05 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/maomicd/Maomicd.plugin) |
| 电信营业厅每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/telecom-10000/Telecom10000.plugin) |
| 百度签到(网页) | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/tieba-web/TiebaWeb.plugin) |
| 百度贴吧(客户端)每日签到 | 08:00 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/tieba-app/TiebaApp.plugin) |
| 百果园每日签到 | 02:11 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/pagoda/Pagoda.plugin) |
| 知音漫客每日签到 | 00:17 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zymk/Zymk.plugin) |
| 米游社每日签到 | 08:04 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/mihoyo/Mihoyo.plugin) |
| 索尼俱乐部签到 | 00:04 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/sony/Sony.plugin) |
| 网易严选每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/yanxuan/Yanxuan.plugin) |
| 网易新闻每日签到 | 08:02 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/neteasenews/NeteaseNews.plugin) |
| 美团外卖每日签到 | 08:05 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/meituan-waimai/MeituanWaimai.plugin) |
| 美团每日签到 | 08:05 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/meituan/Meituan.plugin) |
| 腾讯视频每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/videoqq/VideoQq.plugin) |
| 芒果TV每日签到 | 08:04 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/mgtv/Mgtv.plugin) |
| 苏宁易购每日签到 | 08:08 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/suning/Suning.plugin) |
| 蔚来每日签到 | 08:07 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/nio/Nio.plugin) |
| 追书畅读版每日签到 | 00:16 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zscdb/Zscdb.plugin) |
| 阿里云盘签到 | 07:00 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/aliyun/Aliyun.plugin) |
| 顺丰速运每日签到 | 08:03 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/sfexpress/SfExpress.plugin) |
| 飞客-签到 | 00:10 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/flyert/Flyert.plugin) |
| 飞客茶馆每日签到 | 08:02 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/flyertea/Flyertea.plugin) |
| 飞常准每日签到 | 08:10 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/fcz/Fcz.plugin) |
| 饿了么每日签到 | 08:09 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/eleme/Eleme.plugin) |
| 马克喵签到 | 07:22 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/macat/Macat.plugin) |
| 高德地图打车签到 | 00:01 | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/gaode-dache/GaodeDache.plugin) |

