# 許諾签到合集（fmz200 定时任务）

从 [fmz200/wool_scripts](https://github.com/fmz200/wool_scripts) 的 `Loon/script/tasks.scripts` 里把签到类任务全部转成 Loon 插件，共 87 个。签到脚本本身留在上游，这里只提供插件外壳（抓取 Cookie + 定时触发）和 BoxJs 设置。

BoxJs 订阅：https://raw.githubusercontent.com/Crack22/loon-plugins/main/boxjs-checkins.json

用法：装好插件，打开重写和 cron，打开对应 App 停留几秒，收到「Cookie 获取成功」即抓取成功；抓完后在插件设置里关掉「抓取开关」，只留定时签到。Cookie 只保存在手机本地，不会上传。

注意：这些插件只在 Loon 本地跑，不进 GitHub Actions 云端；上游脚本年久未更新的可能已经失效，装之前先看一眼对应 App 还能不能签到。

| 插件 | 定时 | 上游脚本 | 安装 |
| --- | --- | --- | --- |
| APK.TW每日签到 | 08:03 | chavyleung/scripts（apktw.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/apktw/Apktw.plugin) |
| AcFun每日签到 | 08:01 | chavyleung/scripts（acfun.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/acfun/Acfun.plugin) |
| CSDN每日签到 | 08:04 | chavyleung/scripts（csdn.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/csdn/Csdn.plugin) |
| Funboat签到 | 08:04 | evilbutcher/Quantumult_X（funboat.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/funboat/Funboat.plugin) |
| IT之家每日签到 | 02:11 | chavyleung/scripts（ithome.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ithome/Ithome.plugin) |
| NGA刮墙每日签到 | 00:10 | chouchoui/QuanX（Scripts/nga/nga.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/nga/Nga.plugin) |
| QQ萌宠每日签到 | 00:04 | lowking/Scripts（QQPet/lkQQPet.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qqpet/QqPet.plugin) |
| QQ音乐每日签到 | 08:04 | chavyleung/scripts（qqmusic.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qqmusic/QqMusic.plugin) |
| V2EX每日签到 | 08:03 | chavyleung/scripts（v2ex.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/v2ex/V2ex.plugin) |
| Zaker每日签到 | 08:08 | chavyleung/scripts（zaker.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zaker/Zaker.plugin) |
| go语言中文网每日签到 | 09:00 | iepngs/Script（studygolang/index.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/studygolang/StudyGolang.plugin) |
| qq会员成长值 | 05:05 | lowking/Scripts（QQVip/qqVipCheckIn.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qqvip/QqVip.plugin) |
| 七猫小说每日签到 | 08:07 | chavyleung/scripts（qmnovel.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qimao/Qimao.plugin) |
| 万达电影每日签到 | 02:12 | chavyleung/scripts（wanda.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/wanda/Wanda.plugin) |
| 中国联通每日签到 | 08:05 | chavyleung/scripts（10010.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/china-unicom/ChinaUnicom.plugin) |
| 京东成长分每日签到 | 08:10 | barrym-chen/Script（jdczf/jdczf.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jd-czf/JdCzf.plugin) |
| 京东每日签到 | 01:15 | NobyDa/Script（JD_DailyBonus.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jd/JD.plugin) |
| 京东白条每日签到 | 03:05 | chavyleung/scripts（JD_BaiTiao.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jd-baitiao/JdBaitiao.plugin) |
| 京东读书 | 00:14 | XidNDD/2020scripts（jddsSign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jd-read/JdRead.plugin) |
| 什么值得买每日签到 | 08:03 | chavyleung/scripts（smzdm.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/smzdm/Smzdm.plugin) |
| 今日头条极速版每日签到 | 08:05 | iepngs/Script（jrtt/index.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/jrtt/Jrtt.plugin) |
| 全民K歌每日签到 | 08:06 | chavyleung/scripts（qmkg.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qmkg/Qmkg.plugin) |
| 加油广东每日签到 | 08:04 | chavyleung/scripts（gdoil.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/gdoil/Gdoil.plugin) |
| 南方周末每日签到 | 02:11 | chavyleung/scripts（nfzm.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/nfzm/Nfzm.plugin) |
| 去哪儿每日签到 | 08:02 | chavyleung/scripts（qunar.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/qunar/Qunar.plugin) |
| 叮咚买菜每日签到 | 08:06 | chavyleung/scripts（mcdd.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/dingdong/Dingdong.plugin) |
| 叮咚农场 | 08:01 | iepngs/Script（dingdong/index.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/dingdong-farm/DingdongFarm.plugin) |
| 吾爱破解每日签到 | 08:01 | NobyDa/Script（52pojie.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/52pojie/52Pojie.plugin) |
| 哈啰出行每日签到 | 08:08 | chavyleung/scripts（hellobike.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/hellobike/HelloBike.plugin) |
| 哔哩哔哩每日签到 | 08:03 | chavyleung/scripts（bilibili.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/bilibili/Bilibili.plugin) |
| 哔哩哔哩漫画每日签到 | 08:01 | NobyDa/Script（Manga.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/bilibili-manga/BilibiliManga.plugin) |
| 哔哩哔哩银瓜子换硬币每日签到 | 08:03 | chavyleung/scripts（bilibili.silver2coin.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/bilibili-silver2coin/BilibiliSilver2Coin.plugin) |
| 喜马拉雅每日签到 | 08:03 | chavyleung/scripts（ximalaya.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ximalaya/Ximalaya.plugin) |
| 多看每日签到 | 03:00 | chavyleung/scripts（duokan.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/duokan/Duokan.plugin) |
| 太好购每日签到 | 00:10 | id77/QuantumultX（task/thg.js，抓取见 task/thg.cookie.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/thg/Thg.plugin) |
| 奇瑞汽车App签到 | 07:17 | fmz200/wool_scripts（cheryAppSignin.js；抓取见 Scripts/cookie/get_cookie.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/chery/Chery.plugin) |
| 威锋网每日签到 | 08:03 | chavyleung/scripts（feng.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/feng/Feng.plugin) |
| 工银e生活每日签到 | 08:10 | barrym-chen/Script（icbc/icbc_sign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/icbc/Icbc.plugin) |
| 建行生活签到 | 07:17 | FoKit/Scripts（jhsh_checkIn.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ccb-life/CCBLife.plugin) |
| 微信小程序-同程艺龙每日签到 | 08:10 | barrym-chen/Script（tongc/tongc_sign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/tongcheng/Tongcheng.plugin) |
| 微商星球每日签到 | 00:16 | XidNDD/2020scripts（wsxqSign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/wsxq/Wsxq.plugin) |
| 快手果园 | 01:30 | fmz200/wool_scripts（ks_fruit.js；抓取见同目录 ks_getCookie.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/kuaishou/Kuaishou.plugin) |
| 快看漫画每日签到 | 09:04 | NobyDa/Script（KKMH.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/kuaikan/Kuaikan.plugin) |
| 懂球帝每日签到 | 08:03 | chavyleung/scripts（dongqiudi.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/dongqiudi/Dongqiudi.plugin) |
| 拼多多果园 | 01:30 | fmz200/wool_scripts（pdd_guoyuan.js；抓取见 pdd_getToken.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/pdd/PDD.plugin) |
| 掌上飞车每日签到 | 08:08 | chavyleung/scripts（zsfc.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zsfc/Zsfc.plugin) |
| 携程小程序每日签到 | 08:09 | barrym-chen/Script（ctrip_wx/ct_sign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ctrip-wx/CtripWx.plugin) |
| 携程旅行每日签到 | 08:29 | iepngs/Script（ctrip/index.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/ctrip/Ctrip.plugin) |
| 斗鱼鱼吧签到 | 07:15 | fmz200/wool_scripts（yubaSign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/douyu/Douyu.plugin) |
| 旅行世界购物版每日签到 | 09:00 | iepngs/Script（lxsj/index.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/lxsj/Lxsj.plugin) |
| 时光相册每日签到 | 08:05 | chavyleung/scripts（everphoto.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/everphoto/Everphoto.plugin) |
| 晓晓优选每日任务 | 07:17 | fmz200/wool_scripts（xxyx_signin.js；抓取见 Scripts/cookie/get_cookie.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/xxyx/XXYX.plugin) |
| 智行火车每日签到 | 08:07 | chavyleung/scripts（zxhc.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zxhc/Zxhc.plugin) |
| 有道云笔记每日签到 | 03:03 | chavyleung/scripts（noteyoudao.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/noteyoudao/NoteYoudao.plugin) |
| 柚子快报每日签到 | 00:11 | XidNDD/2020scripts（yzkbSign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/yzkb/Yzkb.plugin) |
| 樊登读书每日签到 | 08:06 | chavyleung/scripts（fandeng.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/fandeng/Fandeng.plugin) |
| 欧可林商城每日签到 | 04:03 | zZPiglet/Task（Oclean_mini.js；与欧可林共用同一账号签到） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/oclean-mall/OcleanMall.plugin) |
| 欧可林每日签到 | 10:00 | zZPiglet/Task（Oclean.js；与欧可林商城共用同一账号签到） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/oclean/Oclean.plugin) |
| 民盈国贸城每日签到 | 00:15 | XidNDD/2020scripts（mygmcSign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/mygmc/Mygmc.plugin) |
| 海底捞每日签到 | 08:07 | chavyleung/scripts（hdl.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/haidilao/Haidilao.plugin) |
| 海德汇一城每日签到 | 00:12 | XidNDD/2020scripts（hdhycSign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/hdhyc/Hdhyc.plugin) |
| 爱奇艺每日签到 | 08:01 | NobyDa/Script（iQIYI.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/iqiyi/Iqiyi.plugin) |
| 猫咪音乐每日签到 | 08:05 | chavyleung/scripts（maomicd.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/maomicd/Maomicd.plugin) |
| 电信营业厅每日签到 | 08:03 | chavyleung/scripts（10000.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/telecom-10000/Telecom10000.plugin) |
| 百度签到(网页) | 08:03 | chavyleung/scripts（tieba.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/tieba-web/TiebaWeb.plugin) |
| 百度贴吧(客户端)每日签到 | 08:00 | NobyDa/Script（TieBa.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/tieba-app/TiebaApp.plugin) |
| 百果园每日签到 | 02:11 | chavyleung/scripts（pagoda.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/pagoda/Pagoda.plugin) |
| 知音漫客每日签到 | 00:17 | XidNDD/2020scripts（zymkSign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zymk/Zymk.plugin) |
| 米游社每日签到 | 08:04 | chavyleung/scripts（mihoyo.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/mihoyo/Mihoyo.plugin) |
| 索尼俱乐部签到 | 00:04 | lowking/Scripts（sony/sonyClub.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/sony/Sony.plugin) |
| 网易严选每日签到 | 08:03 | chavyleung/scripts（yanxuan.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/yanxuan/Yanxuan.plugin) |
| 网易新闻每日签到 | 08:02 | chavyleung/scripts（neteasenews.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/neteasenews/NeteaseNews.plugin) |
| 美团外卖每日签到 | 08:05 | chavyleung/scripts（wmmeituan.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/meituan-waimai/MeituanWaimai.plugin) |
| 美团每日签到 | 08:05 | chavyleung/scripts（meituan.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/meituan/Meituan.plugin) |
| 腾讯视频每日签到 | 08:03 | chavyleung/scripts（videoqq.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/videoqq/VideoQq.plugin) |
| 芒果TV每日签到 | 08:04 | chavyleung/scripts（mgtv.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/mgtv/Mgtv.plugin) |
| 苏宁易购每日签到 | 08:08 | chavyleung/scripts（suning.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/suning/Suning.plugin) |
| 蔚来每日签到 | 08:07 | chavyleung/scripts（nio.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/nio/Nio.plugin) |
| 追书畅读版每日签到 | 00:16 | XidNDD/2020scripts（zscdbSign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/zscdb/Zscdb.plugin) |
| 阿里云盘签到 | 07:00 | Sliverkiss/gist（aliyun.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/aliyun/Aliyun.plugin) |
| 顺丰速运每日签到 | 08:03 | chavyleung/scripts（sfexpress.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/sfexpress/SfExpress.plugin) |
| 飞客-签到 | 00:10 | zirawell/R-Store（flyert.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/flyert/Flyert.plugin) |
| 飞客茶馆每日签到 | 08:02 | chavyleung/scripts（flyertea.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/flyertea/Flyertea.plugin) |
| 飞常准每日签到 | 08:10 | barrym-chen/Script（fcz/fcz_sign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/fcz/Fcz.plugin) |
| 饿了么每日签到 | 08:09 | songyangzz/QuantumultX（elem/elemSign.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/eleme/Eleme.plugin) |
| 马克喵签到 | 07:22 | fmz200/wool_scripts（macat_signin.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/macat/Macat.plugin) |
| 高德地图打车签到 | 00:01 | wf021325/qx（ampDache.js） | [一键安装](https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-fmz/gaode-dache/GaodeDache.plugin) |

没做出来的 10 个：电信余量、Alipay、合创、网易考拉、纵横小说、GitHub、lxhealth、中青看点、微信小程序-同程艺龙info、小米运动（有的是纯查询不是签到，有的是服务已停，有的脚本读不懂）。想要其中某个单独说。
