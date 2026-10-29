# 内容创作工作目录

这里是 media-workflow 的内容与任务数据根，不是插件源码目录。先读取当前会话加载的 media-workflow 技能；具体命令、输入结构和制作要求以技能及当前任务请求为准。

## 开始工作

- DSH 会话以技能附带的实际数据根和 CLI 绝对路径为准，所有命令显式传入 `--root <实际数据根>`。本文件所在目录应与该根一致。不一致时先核对，不另建平行任务库，不把 `tasks/` 当作数据根。
- 先用 `list` 查已有任务，必要时用 `list --group archived` 查归档任务；通过标题、需求和会话确认目标，再用 `status <taskId>` 读取完整状态。同一作品继续使用原任务 ID，不因中断、重试或目录权限问题重复创建。
- 读取任务的 `brief.json`、`state.json`，确认内容类型、当前需求、执行阶段、评审模式和待处理事项，再开始制作。评审方式沿用用户提交需求时的选择。

## 工具入口与使用索引

先从当前 DSH 技能上下文取得 CLI 的绝对路径：`<技能目录>/scripts/workflow.mjs`，其上两级就是技能目录。下面两处路径是占位符，必须替换为当前实际值；技能参考文档与辅助脚本均位于该技能目录下，不在内容工作目录下。

```sh
MEDIA_SKILL_DIR="/absolute/path/to/media-workflow-skill"
MEDIA_WORKFLOW_ROOT="/absolute/path/to/内容创作"
mw() { node "$MEDIA_SKILL_DIR/scripts/workflow.mjs" "$@" --root "$MEDIA_WORKFLOW_ROOT"; }

mw help          # 查看 CLI 命令和解析后的数据根
mw capabilities  # 查看内容类型与原生能力
mw list          # 查找现有任务
mw status TASK   # TASK 替换为实际任务 ID
```

以下命令沿用上述 `mw`，大写的 TASK、STEP、DIGEST、REVIEW_ID、RECEIPT_ID 和文件路径均需替换为当前真实值。先读对应文档和当前请求，不凭索引猜测 JSON 结构。

| 要做什么 | 工具或命令 | 详细说明（相对技能目录） |
| --- | --- | --- |
| 确定工具能力、画面/声音来源和限制 | `mw capabilities`；`mw doctor` 检查依赖并更新诊断文件 | `references/capabilities.md` |
| 选择文章、图文、视频与制作方向 | 先读作品类型和制作指导，再组织 brief | `references/formats.md`、`references/creation.md`、`references/styles.md` |
| 校验需求 | `node "$MEDIA_SKILL_DIR/scripts/brief.mjs" --input /absolute/brief.json --output /absolute/normalized-brief.json` | `references/brief-example.json`、`references/execution.md` |
| 创建并开始任务 | `mw create --brief /absolute/normalized-brief.json --start`；仅保存草稿用 `mw create --brief /absolute/brief.json --draft` | `references/execution.md`；`--approve-brief` 仅用于用户已确认的需求 |
| 查询、继续或暂停 | `mw list`、`mw status TASK`、`mw run TASK`、`mw pause TASK` | `references/execution.md`；run/complete 等操作可能继续后续阶段 |
| 上传原始素材 | `mw upload TASK --file /absolute/file --role source` | `references/execution.md`、`references/understanding.md`；启动后补素材先暂停，按协议用 `--staged` 暂存并提交新需求 |
| 回纳当前对话生成的阶段结果 | `mw complete TASK --step STEP --input /absolute/response.json --digest DIGEST` | `references/execution.md`；DIGEST 取自当前 `requests/<step>.json` 的 `inputDigest` |
| 按用户决定评审、按反馈修改 | `mw review TASK --review REVIEW_ID --decision approve`；要求修改用 `--decision changes --feedback '实际意见'`；重做用 `mw redo TASK --step STEP` | `references/review.md`、`references/execution.md`；不得自行批准 |
| 提交新一版需求 | `mw requirements TASK --brief /absolute/brief.json --new-requirement` | `references/execution.md`；保留原任务和旧版本 |
| 编辑文章或图文画布 | `mw canvas-get TASK`；`mw canvas-save TASK --input /absolute/canvas.json --digest DIGEST --note '实际修改'` | `references/canvas.md`；使用 canvas-get 返回的 `inputDigest` |
| 导入外部制作的正式成品 | `mw import-request TASK`；`mw import-artifacts TASK --input /absolute/bundle.json --digest DIGEST` | `references/imports.md`；使用 import-request 返回的 `inputDigest`，携带完整依赖 |
| 核验已有发布请求 | `mw verify TASK --receipt RECEIPT_ID`；人工核验用 `mw record-verification TASK --receipt RECEIPT_ID --input /absolute/verification.json` | `references/publishing.md`、`references/execution.md`；明确可重试后才用 `mw retry-target TASK --receipt RECEIPT_ID` |
| 归档、恢复与完整导出 | `mw archive TASK`、`mw list --group archived`、`mw unarchive TASK`、`mw export TASK --out /absolute/new-export-directory` | `references/execution.md`；导出目标应为尚不存在的新目录 |

### 制作工具与依赖

- **FFmpeg / ffprobe**：视频合成、媒体探测与抽帧；**Chrome**：图文 PNG 导出及 huashu 工程渲染；**Poppler**：PDF 提取与栅格化。先用 doctor 确认配置与可用性，边界见 `references/capabilities.md`。
- **OCR / ASR**：通过素材阶段调用本地适配器；配置与显式准备方法见 `references/understanding.md`、`scripts/setup-runtime.mjs`。准备环境会安装依赖或下载模型，按本次授权执行，不在普通制作中自动安装。
- **Edge TTS / MiMo / 用户录音**：按任务 voice 设置执行，时间轴依据与工具说明见 `references/capabilities.md`、`references/execution.md`。MiMo 句级时间轴不冒充词级对齐。
- **huashu-motion**：定制动画与可编辑 HTML 工程。使用前读取当前环境该技能的 `SKILL.md`，确认实际 CLI；`new/check/render` 等命令索引见 `references/capabilities.md`。它是独立工具，插件不自动调用其配乐与旁白功能；定制成品通过 import-artifacts 回纳。
- **PostFaro**：发布桥接、能力和账号查询、回执核验；先读当前环境 PostFaro 技能及 `references/publishing.md`。优先沿用任务发布流程和原 requestId，不另起独立发布绕过评审或重复提交。
- **独立渲染与视频质检脚本**：`scripts/render.mjs`、`scripts/qa.mjs` 的参数和适用范围需先读脚本及 `references/execution.md`。独立生成的文件不会自动登记为任务正式产物，应通过导入流程回纳；文章和图文走各自原生流程。

## 目录用途

```text
本目录/
├── AGENTS.md                  本引导，可按用户约定补充
├── settings.json              全局设置，可能含凭据，不原样输出或提交
├── doctor.json / dsh.patch     本地依赖与诊断结果
├── tasks/<taskId>/
│   ├── brief.json             当前需求
│   ├── state.json             执行状态、当前产物索引与历史
│   ├── requirements/<版本>.json  历次正式提交的需求
│   ├── uploads/               上传的原始素材
│   ├── transfers/             分片上传数据与恢复记录
│   ├── imports/               外部制作交付的导入快照
│   ├── requests/              需当前对话完成的阶段请求
│   ├── inputs/                导入的阶段响应、画布编辑等
│   ├── working/<阶段>-<UUID>/  执行中的文件；失败时可能保留
│   ├── artifacts/<阶段>/<版本>/  已登记的阶段产物与旧版本
│   ├── review/                评审决定与版本依据
│   └── receipts/              发布尝试、回执与核验记录
└── exports/                   完整任务导出包及导出记录
```

目录按需生成，尚未生成不代表任务损坏。归档是状态标记，任务目录仍留在原处。

## 找到当前产物

- 从 `state.json` 的阶段 `artifacts` 读取当前有效产物及相对路径，`history` 是历史版本。不要仅按最大版本号、修改时间或文件存在判断成品，未登记目录可能属于失败执行。
- 视频流程：`brief → materials → script → storyboard → voice → composition → qa → render → package → publish`。文章和图文没有 `voice`，`storyboard` 分别代表文章编排与分页设计。
- 视频正式产物在 `render` 阶段，包括 `final.mp4`、`cover.png` 等；配音、字幕和时间轴在 `voice`，合成工程与预览在 `composition`。
- 文章正式产物包括 `article.html`、`article.md`、`publication.json`、出处清单和质检记录。图文包括有序的 `page-01.png` 等图片、`gallery.html`、文案与可编辑工程。具体文件以当前登记清单为准。
- `package` 是标题、配文和平台包装，`publish` 是发布准备；实际回执与核验结果才说明发布情况。额外交付目录是正式渲染文件的副本，任务内登记产物仍是追溯依据。

## 制作与修改

- 使用工作台或技能 CLI 创建、继续、暂停、提交需求、导入产物、评审和归档。不要直接改写 `state.json`、需求历史、审批、回执或已登记产物，也不要重命名任务文件夹、移动内部目录或绕过运行锁。
- 需要生成时读取 `requests/<step>.json`，按实际 schema 和输入资料制作，通过 `complete` 和请求的当前 `inputDigest` 回纳阶段响应。实际成品用 `import-request` 获取摘要，再用 `import-artifacts` 回纳完整文件与依赖；阶段 JSON 响应不等于实际交付。
- 外部编辑先制作独立副本，通过导入登记新版本，保留旧产物、来源、审批和回执。工程资源使用相对路径或合法内嵌资源，完整交付应包含工程依赖。
- 临时素材、需求草稿和阶段响应可放在当前会话已有工作区或任务 `working/` 下独立临时子目录；它们不是正式产物，不自行给根目录增加另一套任务或成品结构。不要擅自清理失败现场、历史版本、上传原件或传输记录。
- 正在运行时先通过暂停操作等待实际执行结束，再修改输入或导入。使用当前版本摘要，遇到冲突重新读取状态，不以手改文件消除冲突。

## 评审、质量与交付

- 只在约定关口呈现评审，已有且仍有效的用户决定无需重复询问。不能代替用户批准，也不能为推进流程擅自跳过或增加评审关。
- 保留真实出处、作者、使用范围、事实依据及冲突。资料缺失、OCR/ASR 不确定、未观看或未听取的质量项保持未知，不把检查通过、渲染成功当作内容已验收。
- 按内容类型检查实际正文、图片或正常速度播放效果。交付时说明当前有效文件、已验证内容及仍未知的项，提供可访问的文件或预览。
- 发布按用户现有明确授权执行，没有发布授权就只制作和交付。`prepared`、`filled`、`submitted`、等待登录或 `needs_check` 不等于已发布。不确定时查询原请求，保留 requestId，不自动新建请求重发。
- 完整迁移或备份使用工作台导出或 CLI `export`，保留素材、工程、需求、审批和回执，不把单个工程 JSON 当作包含全部资源的备份。

本文件由插件在缺失时创建；已有的 `AGENTS.md`（或 `agents.md`）会保留，不被自动覆盖。
