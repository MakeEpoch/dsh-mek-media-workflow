# 媒体工作台 · media-workflow

用同一套任务管理文章、图文贴图和视频：记录灵感，整理真实素材，制作和预览作品，按需要评审、改版、交付或发布。作品类型决定流程和产物；主题、素材核对策略、写作风格、画面方向和交付渠道可以分别选择。

## 从哪里开始

- **DSH 内**：打开「媒体工作台」。首页可记录灵感，也可从「新建」写一句制作说明，选作品类型、创作风格并附上资料。会话右侧「媒体任务」可以查看同一任务、预览产物和处理评审；只有主动展开才切到完整工作台。[插件使用指南](packages/dsh-media-workflow/README.md)
- **让当前对话制作**：加载 `media-workflow` 技能，读取任务阶段请求、处理素材，再把结果导入同一任务。工作台不会自动唤醒聊天助手。[技能入口](packages/media-workflow-skill/SKILL.md) · [执行与恢复](packages/media-workflow-skill/references/execution.md)
- **让工作台按模板制作**：选用宿主已配置的模型。模型负责整理需求和生成结构化内容；执行器负责排版或合成。没有配置模型时仍可创建任务，等待当前对话接手需要生成的阶段。

| 成品 | 已有原生交付 | 主要依赖 |
| --- | --- | --- |
| 文章 | Markdown、阅读版 HTML、可编辑工程、出处清单；九阶段，无配音 | 不依赖 FFmpeg、TTS 或 Chrome 截图导出 |
| 图文贴图 | 有序 PNG、HTML 阅读预览、配文和可编辑页面；九阶段，无配音 | 本机 Chrome 导出 PNG，并检查尺寸和文字溢出 |
| 视频 | 成片、封面、音频/字幕（按任务）、预览和工程；十阶段 | FFmpeg/ffprobe；可选 TTS、用户录音或 huashu-motion 工程 |

文章和图文支持四种静态主题及每页多图，另有可编辑文字、图形、图层和页序的画布。FFmpeg 和 huashu-motion 都有固定模板边界，不把自然语言方案直接变成任意动画，也不调用文生图/视频模型。需要定制工程时，用专业工具实际制作，再按[交付导入协议](packages/media-workflow-skill/references/imports.md)登记新版本。[画面、音频及依赖清单](packages/media-workflow-skill/references/capabilities.md)

## 工作台功能

| 功能 | 当前实现及边界 |
| --- | --- |
| 首页 | 展示灵感、未归档任务及待处理任务的计数和入口，可直接记灵感。「热门素材」只有 RSS 展示组件和待接入空态，未接实际订阅源。 |
| 灵感墙 | 可记录、编辑或删除文字、链接与图片/视频附件。从一张卡制作文章、图文或视频时，每种类型各对应一份任务；再次打开同类型沿用原任务。 |
| 创作风格 | 8 类、15 个内置写作预设，可以启用工作区默认、为单个作品另选风格，也可在本机从自己写过的文本提炼风格卡。它影响写法，不代替视觉模板和事实依据。 |
| 复盘 | 粘贴 JSON 或简单 CSV 导入阅读、互动数据，按本地统计规则给建议，不自动拉取平台数据、不承诺传播效果。导入替换本次数据集；确认后的规则单独保存。可导出写作 Skill 文件，不会自动装进 DSH。 |
| 制作与版本 | 作品页先显示当前产物和待办；步骤、历史、检查和发布记录在「制作详情」。风格与已确认规则在任务开始时保存，改需求默认沿用旧快照；可切换作品风格，或明确重新读取选中风格和规则。 |

本地素材识别可保留 OCR、语音转录、视频抽帧和待核实项；支持图像输入的 DSH 模型经附件服务获得实际像素。传输和交付支持断点续传与目录依赖；通常任务与导入单文件最多 2 GiB，单次交付导入最多 8 GiB，灵感墙单个附件最多 40 MiB。识别环境需显式准备，不在制作时安装依赖或下载模型。

评审在需求中选择：按关口、按业务阶段，或免阶段评审。「开始制作」可同时通过需求关，发布授权仍独立。PostFaro 按文章、图文、短视频类型读取实际桥接与账号；准备、填入、已提交和等待登录都不等于发布成功。未知结果核查原请求，不自动重发。任务时间按浏览器时区显示，需求的业务时区可单独设置（默认 `Asia/Shanghai`）。

## 数据放在哪里

- **DSH 插件**：默认数据根是 `$DSH_HOME/media-workflow`，未设置 `DSH_HOME` 时为 `~/.dsh/media-workflow`。可以在工作台设置中切换数据根；默认根的 `location.json` 保存所选路径。切换只改变读写位置，不搬迁旧任务。以工作台显示的路径或会话技能附带的实际路径为准。
- **独立 CLI**：显式 `--root` 优先，其次 `MEDIA_WORKFLOW_HOME`、`$DSH_HOME/media-workflow`、`~/.media-workflow`。独立 CLI 不查询插件的 `location.json`。在 DSH 对话中操作同一任务时，始终用技能附带的 `--root` 和 CLI 路径。
- **任务、草稿与成品**：任务存于 `<数据根>/tasks/<taskId>/`。已保存的草稿也是任务，未提交表单暂存在当前浏览器。正式产物按 `artifacts/<阶段>/<版本>/` 保存，以任务中的产物登记为准；素材上传、评审、发布回执和历史均分目录保存。归档只标记任务，不移动文件。配置额外交付目录时，正式产物仍保留在任务内。
- **工作台配置与辅助数据**：`ideas.json` / `ideas-media/` 保存灵感与附件，`styles.json` 保存风格，`metrics.json` / `rules.json` 保存复盘数据与规则，导出 Skill 默认写到 `skills/`。插件会写 `doctor.json` 和 `dsh.patch` 两份诊断快照；它们不是 DSH 配置。根目录缺少 `AGENTS.md` 时才补建，已有 `AGENTS.md` 或 `agents.md` 不覆盖；其中若有旧安装路径，优先用运行态技能给的路径。[目录引导模板](packages/media-workflow-skill/references/workspace-AGENTS.md)

完整导出保留素材、工程、有效产物及历史、审批与回执，不含运行锁和 `working/`。新版工作台和 CLI 的完整导出会过滤任务状态中的 MiMo Token；升级前已经导出的文件不会被改写，需要分享时请重新导出，并核对素材、回执及其他私密内容。关闭页面不会停止宿主任务；停止或退出前，先暂停并确认执行进程已退出，已提交的发布仍须核验。

## 源码、安装包和验证

| 项目 | 名称与目录 |
| --- | --- |
| DSH 插件 | `dsh-mek-media-workflow`，源码在 [`packages/dsh-media-workflow/`](packages/dsh-media-workflow/) |
| 通用技能与 CLI | 技能与命令名 `media-workflow`；独立包 `dsh-mek-media-workflow-skill`，源码在 [`packages/media-workflow-skill/`](packages/media-workflow-skill/) |

两个源码包当前为 `0.2.8`。插件构建把共享运行器打成 `lib/runtime.js`，把界面打成 `lib/client.js`，并复制完整技能到 `embedded-skill/`；安装包不依赖仓库兄弟目录。Node 要求 `>=22.16`，插件声明 DSH `>=0.2.1-rc.2 <0.3.0`。声明范围、打包通过和具体宿主上可用是不同结论。以目标 profile 解析到的包及技能为准，不要用源码版本号证明当前已安装或已发布。

```sh
npm ci
npm run build
npm test                 # 自动先构建，再跑 Node 测试
npm run test:browser     # 自动构建 demo；需本机 Chrome 和 FFmpeg
npm run test:host        # 真实 Cordis/技能服务、隔离连接；需本机 DSH CLI
npm run pack:check       # 打包并回读冻结包
npm run dev               # 本机开发服务，默认 127.0.0.1:3188，数据写 .data/
```

本地浏览器回归使用虚构资料、固定生成夹具和实际 FFmpeg，不访问日常 DSH 或发布平台，也不自动下载 Chrome。受限环境可用 `DSH_ESBUILD_MODULE`、`DSH_NODE_MODULES`、`DSH_PLAYWRIGHT_MODULE`、`CHROME_PATH` 指向已有依赖。`node scripts/preview-ux.mjs` 是另一个隔离交互预览（端口 3189）。与代理、模型、发布账号实际联通须分别验收，不以预览或夹具代替。

冻结包由 `npm run pack:check` 写到 `artifacts/packages/`；安装用 DSH 官方插件管理，不链接开发源码。安装、启用、回退与重启分别操作；停用或卸载不删除任务，不用旧 profile 覆盖后来新增的配置。[安装与回退](packages/dsh-media-workflow/README.md#安装与回退)

本仓库的 [市场索引](market-index.json) 当前为空，本机装有冻结包不代表已上架。实际发行后才运行 `scripts/market-index.mjs` 生成记录；npm 来源使用 `--source npm --published-at <真实 Unix 秒>`，Git 来源还需传实际仓库、40 位提交 SHA，并显式指定 `--path packages/dsh-media-workflow`（现有默认值多了一层目录）。生成索引不等于发布。

原始设计与历史验证见[多类型方案](docs/CONTENT-DESIGN.md)、[交互设计](docs/UX-DESIGN.md)、[0.2.1 本机发行记录](docs/RELEASE-0.2.1.md)。当前使用以本页和相应的插件/技能说明为准。

## 许可证

代码采用 [MIT License](LICENSE)。内置风格预设数据移植自 [woniuniuniu/dsh-media-desk](https://github.com/woniuniuniu/dsh-media-desk)（MIT，2.6.2），源码保留来源说明；本项目不共用第三方插件的数据目录。试听音频由 MiMo 合成，使用服务时遵循其条款。
