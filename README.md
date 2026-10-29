# 媒体工作流

定位为多风格、多类型内容制作，主题、文章/贴图/视频、表达方式、视觉风格与交付渠道分别选择。三种作品均有原生任务、版本、评审与实际交付，文章与图文不再经过配音或视频工具。能力设计见 [多类型内容方案](docs/CONTENT-DESIGN.md)，实际支持情况可用 `workflow.mjs capabilities` 查询。

原生流程包含通用技能/CLI 与 DSH UI：全局媒体工作台、任务列表与创建、按类型显示九或十步进度、会话右侧面板、原生评审入口、产物与媒体预览、版本差异、发布回执、任务归档与恢复、设置、自检与任务恢复。

## 原生作品与实际交付

| 类型 | 交付与检查 |
| --- | --- |
| 文章 | 完整 Markdown、可阅读 HTML、可编辑 publication.json、出处清单；不依赖 FFmpeg/TTS |
| 图文贴图 | 有序 PNG、HTML 阅读预览、配文、可编辑工程；检查真实尺寸与正文溢出，导出需要本机 Chrome |
| 视频 | 保留成片、音频/字幕、封面、工程与发布核验 |

文章和图文提供 editorial、knowledge-cards、collage、natural 四种静态主题及 text/image/split 版式，每页至多四张真实图片；文章与图组可在原生自由画布中编辑文字、图片、图层及页序。专业工具的设计与视频动画按 [交付导入](packages/media-workflow-skill/references/imports.md) 回纳新版本。预览留在会话右侧，只有主动展开才打开完整工作台。文章、图组和视频分别映射 PostFaro article、imageText、shortVideo，按实际桥接能力与账号准备并核验。

## 实际素材与可编辑交付

- 本地 OCR、扫描 PDF、语音转录和视频关键帧保留工具、摘要、时间码与待核实项；图像模型通过宿主附件服务读取真实像素。
- 文章/图组自由画布可拖动、缩放、旋转、调整图层和页面，改正文后同步工程、Markdown 与包装；保存生成新版本。
- 单文件最大 2GB、交付包总量 8GB，支持分片恢复、目录依赖清单、同版 HTML/CSS 资源预览。
- 所需识别依赖通过 scripts/setup-runtime.mjs 显式准备到独立目录，不在制作过程中自动安装或下载。

## 两个包，一套流程

| 包 | 内容 |
| --- | --- |
| `packages/media-workflow-skill` / `dsh-mek-media-workflow-skill` | SKILL.md、分类型流程定义、风格参考、CLI、持久化运行器、配音/渲染/发布适配 |
| `packages/dsh-media-workflow` / `dsh-mek-media-workflow` | DSH Host、工作台、会话右侧面板、设置、原生评审与鉴权媒体路由 |

两个包源码版本为 0.2.1，插件构建时复制完整技能，包内不依赖工作区的兄弟目录。开发目录明确使用共享源码；安装包使用内嵌副本。`workflow.json` 保留旧视频定义，`lib/profiles.mjs` 定义三种流程；新任务保存对应流程快照，旧视频任务继续兼容。

DSH 当前市场上架插件一个入口；纯技能包通过独立目录/npm/Git 分发。`market-index.json` 在实际发行前保持空列表，不宣称未发布版本可安装。发行后使用 `scripts/market-index.mjs --source npm --published-at <实际Unix秒>` 生成记录。

## 开发与验证

在本目录安装依赖，不在父工作区安装：

```sh
npm ci
npm run build
npm test
npm run build -- --demo
npm run test:browser
npm run pack:check
npm run dev
```

开发服务默认 `http://127.0.0.1:3188`，仅接受本机 Host/Origin。使用本目录忽略的 `.data/` 保存任务。它是实际服务与 UI，不内置虚构生成器；没有 DSH 模型时会输出阶段请求，可由当前 harness 生成后导入。浏览器测试单独使用明确标注的虚构资料和固定生成夹具，FFmpeg 为实际执行，不访问日常 DSH 或发布平台。

浏览器测试使用锁定的 playwright-core，不自动下载浏览器；需提供系统 Chrome 或 CHROME_PATH。

受限环境可以通过 `DSH_ESBUILD_MODULE`、`DSH_NODE_MODULES`、`DSH_PLAYWRIGHT_MODULE`、`CHROME_PATH` 指向已安装开发依赖。运行应用需要 Node >=22.16；所选媒体后端另需实际工具。插件声明的 DSH 兼容范围是 `>=0.2.1-rc.2 <0.3.0`，真实宿主验收与类型/隔离测试分别记录。

## 用户路径

全局入口“媒体工作台”承载任务列表、创建与完整制作；会话右侧“媒体任务”承载同一任务的进度、评审与产物。全局工作台拥有自身预览分栏，会话预览跟随宿主右栏布局。设置页只处理模型、工具、配音、发布连接和新任务默认项。插件启动会执行本地依赖自检，结果写入数据目录的 doctor.json 与 dsh.patch 诊断快照，不改宿主 Cordis 配置。

需求同时支持自然语言整理和结构化表单。标准模式的“确认需求并开始”就是需求关，不再弹一次确认。策略在运行中只读；更改策略或需求使用明确“重新提交需求”，形成新版本并保留可复用产物。上传资料和表单草稿持久化在本地；设置保存有 revision 冲突保护。

评审按 none/gates/steps 执行；发布默认保留一次确认，与发布关合并。审批绑定输入和产物版本，多入口不会重复批准。修改与重做保留历史，按依赖更新后续结果。TTS、画面与成片支持在本阶段生成并校验调整参数，实际应用到音频/工程；发布关可修改包装，支持的修改与所需输入分别说明。原生卡只支持两个选项，修改与重做的完整操作在工作台中提供。

## 实际工具与证据边界

- Edge TTS 使用 Python API 显式 WordBoundary，保留事件；PCM 按实际样本数拼接，字幕切分使用真实边界。无词边界时不伪造精度。
- FFmpeg 支持真实图像/视频与文稿合成，自动选择实际中文字体，预览和最终成片分别执行媒体检查。结构检查不代表视觉语义已验收。
- huashu-motion 使用已安装 CLI、真实素材和本地工程，不通过自检隐式 npx 安装。生成工程保留变量、镜头、品牌出处与源码，渲染前执行其 check。
- 产品缺真实界面、Logo 或品牌出处时阻塞；不会编造 UI 或降级占位。资讯引述必须在原文中可定位，未知事实保持未知。
- PostFaro 发布前读取实际能力和新鲜账号，先 prepare，再按当前授权提交。每次尝试先持久化 requestId。未知结果只查原请求，明确失败/人工确认未发布后才显式重试。人工结论与工具核验分开显示。
- 工作台中的模型使用 DSH 已配置模型服务；CLI 由当前 harness 消费阶段请求，无需复制宿主接口。两条路径收到同一套阶段制作指导；内置画面仍是固定模板，不将自然语言设计自动转成定制工程。

## 数据和恢复

任务位于 `<数据根>/tasks/<id>`：brief.json、state.json、requirements/、artifacts/、review/、receipts/、requests/、inputs/。上传、历史与执行失败的工作目录不会因打回清空。默认 DSH 数据根为 `$DSH_HOME/media-workflow`（DSH_HOME 未设置时为 `~/.dsh/media-workflow`）；技能 provider 会附带 Host 的实际数据根，聊天 CLI 必须显式使用该 `--root`。独立 CLI 优先 `MEDIA_WORKFLOW_HOME`，其次 `$DSH_HOME/media-workflow`，否则 `~/.media-workflow`。任务列表自动刷新并发现同根 CLI 新建的任务。

归档是任务上的可逆标记（`state.archivedAt`），不移动、不删除文件：归档任务从全部/待我处理/制作中/已完成/草稿等分组消失，只在“已归档”分组可见，恢复后回到原分组且状态、评审、回执、产物保持不变。执行中、有待评审或有未核验发布尝试的任务拒绝归档；已归档任务在执行、评审、改需求、补素材前必须先恢复，避免静默继续。CLI 使用 `archive TASK` / `unarchive TASK`，`list --group archived` 查看归档。

同一任务有跨进程执行锁。暂停先停止调度并等待可取消子进程退出；已发出的发布保留核验责任。关闭浏览器不停止 Host 任务。停止插件会请求取消发布并清理自身子进程，不把被中断的请求声称为未发布。

工作目录根部的 `AGENTS.md` 为大模型说明目录用途、当前有效产物查找、版本回纳、评审与发布约定。宿主启动、切换目录或 CLI 创建任务时仅在缺失时补建，保留用户已有的 `AGENTS.md` / `agents.md`。模板位于 `packages/media-workflow-skill/references/workspace-AGENTS.md`；会话技能指向当前根部引导。

完整导出包含原始资料、产物、工程、审批和回执，不含运行锁与失败工作目录。来源原始路径作为证据保留；工程媒体引用使用相对路径；完整导出保持目录结构后可重新渲染。原始来源路径只作为出处保存。默认交付目录是可选的额外副本，失败时任务内原始产物仍保留并显示交付失败。

## 安装与回退

先 build、test、浏览器检查和 pack:check。安装包在 `artifacts/packages/`。本次开发不自动替换日常 DSH，不重启服务。

安装到目标 profile 前备份其 package.json、锁文件与 Cordis 配置；使用 DSH 官方插件管理安装已验证 tarball，并确认包解析路径、内嵌技能、版本门槛和 Client bundle。Web 与 Desktop profile 分别选择。停用/卸载使用宿主插件管理，不删除任务数据；恢复时重新装回之前包并回读 profile。链接开发源码会让后续编辑影响宿主，日常使用优先冻结 tarball。

交互重设计说明见 [docs/UX-DESIGN.md](docs/UX-DESIGN.md)。运行 `node scripts/preview-ux.mjs` 可打开 3189 端口的独立交互预览；预览内仅有明确标注的虚构样例，不接入日常 DSH。

实际功能请以本仓库源码及当前环境验证结果为准。

媒体制作从 [SKILL.md](packages/media-workflow-skill/SKILL.md) 开始，按需读取 [制作指导](packages/media-workflow-skill/references/creation.md) 与 [执行和恢复](packages/media-workflow-skill/references/execution.md)。插件使用入口与能力说明见 [插件使用指南](packages/dsh-media-workflow/README.md)。

## 许可证

代码采用 [MIT License](LICENSE)。试听音频由 MiMo 合成，使用 MiMo 服务时请遵循其服务条款。

界面中的任务时间按浏览器所在时区显示；任务需求的业务时区可在创建任务时单独设置，默认 `Asia/Shanghai`。
