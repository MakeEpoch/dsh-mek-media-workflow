# 0.2.1 本机发行

发行范围：更新现有 DSH Web profile，提供独立 skill 安装包；不发布 npm 或插件市场。

## 本次改动

- 在内容工作目录根部补建 `AGENTS.md`，说明目录、当前有效产物、版本回纳、评审和发布约定。
- 补充常用 CLI 命令、参数示例及能力、执行、画布、导入、素材理解、配音和发布工具索引。
- 宿主启动、切换目录和 CLI 创建任务时仅在缺失时补建，保留已有 `AGENTS.md` / `agents.md`；聊天技能提示先读取当前工作目录引导。
- 插件与独立 skill 同步为 0.2.1，插件携带同版完整 skill。

## 验证

- 构建通过，65 项 Node 测试通过。
- 26 项隔离浏览器场景通过，页面错误为空；使用虚构资料和实际 FFmpeg，不访问发布平台。
- 真实 Cordis 与技能注册生命周期检查通过，包括目录切换、恢复和卸载。
- 冻结安装包校验通过，独立 skill 与插件内嵌 skill 的 54 个文件逐字节一致。
- 本机安装及热加载结果见 `artifacts/dsh-install.json` 和 `artifacts/releases/0.2.1/release.json`；文件安装与运行中生效分别记录。

## 发行文件

文件集中在 `artifacts/releases/0.2.1/`：

- `dsh-mek-media-workflow-0.2.1.tgz`：DSH 插件，包含内嵌 skill。
- `dsh-media-workflow-skill-0.2.1.tgz`：独立 npm 格式 skill 包。
- `media-workflow-skill-0.2.1.zip`：普通技能目录包，顶层为 `media-workflow/`，含 `SKILL.md`、脚本、库与参考文档。
- `SHA256SUMS` 与 `release.json`：摘要和本次发行验证记录。

独立技能 ZIP 可解压到目标工具实际使用的技能目录，形成 `<技能目录>/media-workflow/SKILL.md`。已有同名技能时先备份再替换，保留用户定制。脚本要求 Node >=22.16，依赖工具通过 doctor 检查；安装 skill 不代表 OCR/ASR、配音和渲染依赖均已就绪。

## 回退

本机安装脚本已备份目标 profile 的清单、锁文件和 Cordis 配置，具体备份位置见安装回执。需要回退时通过官方插件管理重新安装回执记录的旧冻结包并热加载，保留内容目录、原始素材、历史版本和发布回执。
