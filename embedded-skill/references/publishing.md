# 发布与回执

使用已安装的 PostFaro CLI 和扩展 1.0.6 或兼容的更新版本。平台会话留在用户浏览器，不索取 Cookie、密码或原始认证响应。读取实际 bridges、capabilities 和 accounts；固定桥接与浏览器上下文，不自动切换账号。

平台支持、字数、标签及声明要求以当前 capabilities、prepare 和页面证据为准。分平台保存包装，不为了一个平台缩短全部主稿。哔哩哔哩、知乎等声明由真实情况决定，不能为了通过校验自动选择事实声明。

发布前读取新鲜账号状态。unknown、缓存、configured 与 detector/page 的当前登录证据分别呈现。显示名检查不能替代平台自身的账号隔离；发现不匹配或无法确认就停止提交。

在提交之前保存 requestId、bridgeId、browserContext、内容摘要与实际任务文件。prepare 是本地校验；fill 打开编辑器并填入；publish --yes 才提交，且 --yes 本身不代表用户授权。

回执等级：

| 状态 | 含义 |
| --- | --- |
| prepared | 本地包装已校验 |
| filled | 已填入编辑器 |
| submitted | 已发起提交，等待证据 |
| verified | fields.publish 为 applied、生命周期 published，并有允许的发布证据和公共链接 |
| needs_check | 不能确定发布结果，保留原请求核查 |
| verified_manual | 用户提供实际链接并人工确认，单独标明，保留原工具回执 |

超时、断线、扩展重启和 needs_check 都不触发自动重新发布。使用 status 查询原请求。某平台成功时保留结果，只继续未完成目标。只有明确失败或用户人工确认未发布后，显式“重试此平台”才创建一次新的稳定请求。

PostFaro 产品登录与目标平台登录分别处理。waiting_for_login 时提示登录 PostFaro 邮箱账号，保留原执行进程和素材服务器，登录后原任务自动继续；不要新建任务或请求 ID。

关闭页面不代表任务停止。插件停止时应请求取消并确认实际子进程退出；无法确认外部结果时继续保留待核验状态，不声称未发布。
