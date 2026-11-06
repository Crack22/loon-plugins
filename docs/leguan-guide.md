# 乐观专用 · 使用说明

这个订阅只包含两样东西：**乐观每日签到** 和 **同步Git Secrets**（云端签到用）。

乐观是 https://embyyh.dijia.de/ 这个站，每天自动签到一次，奖励 90-130 积分。

## 需要准备什么

- Loon（已装好插件功能）
- BoxJs（Relay 里自带）
- 一个乐观账号（网站上注册的 Emby 账号）

## 方法一：只用手机（最简单）

### 1. 安装 Loon 插件

在 Loon 里导入这个插件（点链接就能装）：

- 一键安装：loon://import?plugin=https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-embypulse2/EmbyPulseDijiaCheckin.plugin
- 如果一键安装打不开，在 Loon 里选「从 URL 导入」，粘贴这个地址：https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-embypulse2/EmbyPulseDijiaCheckin.plugin

### 2. 添加 BoxJs 订阅

在 BoxJs（Relay）→ 订阅 → 添加，粘贴这个地址：

https://raw.githubusercontent.com/Crack22/loon-plugins/main/boxjs-leguan.json

### 3. 填账号（二选一）

打开订阅里的「乐观每日签到」，有两种填法，选一种就行：

- **填 session_id**：装好插件后，用 Safari 打开一次 https://embyyh.dijia.de/ ，等弹出「Cookie 获取成功」的通知，就抓好了。也可以自己从浏览器里复制 session_id 粘贴进来。
- **填账号密码**：直接填乐观的账号和密码，脚本每次签到前会自动登录，不用管 Cookie。

### 4. 多账号（可选）

- **多账号**那一栏，每行写一个账号：填 session_id，或者写 `账号----密码`（四个短横线隔开）。
- **登录账号数量**：填数字就只签前 N 个账号，空着就是全部都签。

### 5. 完成

每天 09:00 自动签到，签到结果会发通知。不用每天手动点。

## 方法二：云端签到（不用挂梯子）

乐观的服务器在境外，手机不挂梯子就签不了。如果你不想一直挂着梯子，可以让 GitHub 的服务器每天到点帮你签，手机关机也行。本地 Loon 插件不用删，两边同时跑，谁先签上都行，另一个会显示今日已签到。

### 1. Fork 仓库

打开 https://github.com/Crack22/loon-plugins/fork ，把仓库 Fork 到你自己的 GitHub 账号下。

### 2. 在自己的 fork 上开启 Actions

打开你 fork 的仓库，点顶部的 **Actions**，页面会提示工作流被禁用了，点启用（"I understand my workflows, go ahead and enable them"）。

### 3. 创建一个 Token

打开 https://github.com/settings/tokens?type=beta ，创建一个 Fine-grained Token：

- Token name：随便起个名字，比如 `leguan-sync`
- Expiration：建议选 No expiration（永久有效）
- Repository access：选 Only select repositories，只选你 fork 的 loon-plugins
- Repository permissions：找到 **Secrets**，选 Read and write，其他什么都不用给

点 Generate token，生成的 Token 只会显示一次，马上复制下来，离开页面就看不到了。**不要把 Token 发给任何人。**

### 4. 在 BoxJs 里填 Token 和仓库

打开订阅里的「同步Git Secrets」：

- **GitHub Token**：粘贴第 3 步复制的 Token
- **仓库**：改成你自己的 fork，格式是 `你的用户名/loon-plugins`（比如你的 GitHub 用户名是 abc，就填 `abc/loon-plugins`）

### 5. 运行同步插件

在 Loon 里找到「同步Git Secrets」这个插件，点里面的脚本手动运行一次。它会把 BoxJs 里的乐观账号加密后传到你仓库的 Secrets 里，通知会告诉你传了几个。

重复运行也没关系：同一个名字传多少次都只会有一份，新的值会覆盖旧的，不会重复。

### 6. 检查一下（可选）

打开你 fork 的仓库 → Settings → Secrets and variables → Actions，应该能看到 LEGUAN_SESSION_ID（或 LEGUAN_USERNAME / LEGUAN_PASSWORD）这些名字。只能看到名字，看不到具体的值，这是正常的。

想马上试一次：打开你 fork 的仓库 → Actions → 左边选「每日签到」→ Run workflow → Run workflow，跑完点进去能看到每个账号的签到结果。

### 7. 完成

以后每天 09:00 自动签到，不用挂梯子，手机关机也能签。账号换了就在 BoxJs 里改好，再运行一次同步插件就行。

## 常见问题

- **签到失败，提示 Cookie 或 session 过期**：重新抓一次 Cookie（用 Safari 打开一次网站，等「Cookie 获取成功」），或者改成填账号密码的方式。
- **手机和云端同时跑会重复签到吗**：不会，先签上的生效，另一个会显示今日已签到。
- **定时任务晚了几分钟**：GitHub 的定时任务偶尔会延迟几分钟，是正常的。
- **Token / session_id 能不能发给别人**：不能。它们相当于你的账号密码，谁拿到都能登录你的账号。
- **只想在手机上签，不想用云端**：只做方法一就行，「同步Git Secrets」不用管。

## 相关链接

- Loon 插件：https://raw.githubusercontent.com/Crack22/loon-plugins/main/loon-embypulse2/EmbyPulseDijiaCheckin.plugin
- BoxJs 订阅（只含乐观）：https://raw.githubusercontent.com/Crack22/loon-plugins/main/boxjs-leguan.json
- BoxJs 订阅（全部签到，含 WPS、大蓝树、蜗牛、七日杀、冰瓜、微博、乐蛙、乐观）：https://raw.githubusercontent.com/Crack22/loon-plugins/main/boxjs.json
- 仓库：https://github.com/Crack22/loon-plugins
