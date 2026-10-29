---
name: media-workflow
description: 制作和修改文章、图文贴图与视频，支持 AI、科普、产品宣传、生活等主题以及多种叙事和视觉风格。负责资料理解、内容组织、实际制作与交付；原生插件管理三类任务、排版与媒体预览、版本和评审。含真实素材理解、自由排版和类型化发布。单纯图片修图使用对应图像能力。
---

# Media Workflow

目标是多风格、多类型内容制作。文章、图文贴图、视频是作品类型；AI、科普、产品、生活等是主题领域；表达、视觉与交付渠道分别选择。文章、图片、视频也可以是输入素材，不从素材格式直接推断作品类型。

先按 [作品与素材](references/formats.md) 确定路径，再阅读 [风格组合](references/styles.md) 中相关部分。视频沿用十步 [workflow.json](workflow.json)，文章与图文采用九步流程（无配音），类型定义见 [profiles.mjs](lib/profiles.mjs)。流程、创作方向和渠道分别选择。用 workflow.mjs capabilities 可查看 skill 路径与插件原生能力的区别。

**动手前先读 [能力清单](references/capabilities.md)**：画面用什么产出、音频用什么产出、huashu 有哪些具体能力都在那里。本工作台不调用任何文生图或视频生成模型；画面来自真实素材、代码绘制与模板合成，音频来自 TTS 或用户录音。不确定某项是否可用就运行 doctor 核对，不要凭记忆假设。

## 先确定内容方向与实际制作路径

制作或修改前读取 [制作指导](references/creation.md)。结合用户已经提供的目的、受众、重点、参考方向、时长和平台确定方案；对未指定的非关键偏好采用合理默认，不增加一轮默认确认。任务把目标与限制写入 description/requirements，把表达方式、视觉风格、语气和参考方向分别写入 creative.expression、creative.visualStyle、creative.tone、creative.reference。保留自定义风格，不把预设当硬限制。

需要资讯或产品证据时，按需读取 [资讯与事实](references/news.md) 或 [产品与真实素材](references/product.md)。brief.style 的 news/product/original 是素材核对策略（原文事实 / 真实产品 / 用户原创与生活素材），不能用来枚举所有内容类型或视觉风格。需要近期流行方向时按 [趋势证据](references/trends-2026-10.md) 的日期与范围判断，不把旧报告当实时热榜。

创建需求时显式填写 work.type=article/image-post/video；旧需求不填写时按 video 读取。类型在任务启动后不能改变，需要另一种作品时新建关联需求。文章与图文使用原生写作、编排、HTML 预览与正式交付，单页可组合至多四张真实配图。需要直接编辑正文、位置、图层和页序时，使用 [自由排版](references/canvas.md)；专业工具的设计可按 [交付导入](references/imports.md) 回纳。

三种作品均有两种内容生成入口：

- **当前对话制作**：由当前助手阅读来源、查看素材、组织内容并执行工具，读取阶段请求后导入结果。它不是工作台自动唤醒聊天模型的开关。遇到 generation-required 时继续处理请求，无需让用户手写 JSON。
- **工作台独立制作**：由任务创建时选定的 DSH 模型生成结构化内容，内置执行器按类型完成排版或固定模板视频合成。图像通过宿主附件服务作为真实像素输入，模型需明确支持 image；素材理解设置与证据边界见 [实际素材理解](references/understanding.md)。

当前内置 FFmpeg 与 huashu 后端都采用固定版式、每段一个镜头、每镜头至多一份视觉素材；**选择 huashu 后端时可通过 `brief.render.template` 选用 12 个起始模板**（动态文字、白板推导、科普星球、财经图表、发布卡片等），模板决定镜头语言与画面结构，见 [能力清单](references/capabilities.md)。ffmpeg 后端与 blank 模板保持固定版式；非 blank 模板按模板变量组织内容，不会把 visual/treatment 的自然语言自动编译成定制动画。依据用户要求选择路径；超出模板的效果应使用环境中可用的专业制作能力设计实际工程，不能静默降低要求。可在完成预览和质检后导入正式交付文件，生成工作台新版本；导入正文需包含可编辑 publication.json，视频需携带工程文件，具体结构见导入参考。完整边界与处理方式见制作指导。

## 在需求中一次确定评审

原生任务将目标、受众、资料、表达方向、规格、验收和发布范围收为 brief；配音仅用于视频。结构参考 [虚构需求示例](references/brief-example.json)，替换成用户本次内容。

- gates：默认需求、编排/分镜、交付/成片、发布四关；“确认需求并开始”同时通过需求关。
- steps：按类型对应的九或十个业务阶段评审，内部生成、检查、重试不增加评审。
- none：仅本次明确免阶段评审时使用；发布授权仍单独处理。

文章与贴图按用户约定集中讨论内容、版式和成品，不因为沿用视频文档而新增分镜或配音评审。所有任务运行中保持评审策略不变。内部自查与修正按已声明策略推进，不把质量检查变成逐步找用户批准。已有选择和授权沿用本次上下文，完整协议见 [评审与版本](references/review.md)。

## 建立或继续同一任务

三种作品共用以下任务与版本命令，由 work.type 选择实际流程。DSH 会附带实际任务根和 CLI 路径；所有任务命令显式使用该 --root。先 list 查已有任务，再 create 或 status 继续同一 ID。CLI 使用 Node >=22.16，命令路径为本技能目录的绝对路径。

```sh
node /absolute/skill/scripts/workflow.mjs list --root /absolute/task-store
node /absolute/skill/scripts/brief.mjs --input /absolute/brief.json --output /absolute/normalized-brief.json
node /absolute/skill/scripts/workflow.mjs create --root /absolute/task-store --brief /absolute/normalized-brief.json --start
node /absolute/skill/scripts/workflow.mjs status TASK --root /absolute/task-store
```

--approve-brief 仅在用户已确认当前需求时使用。任务目录为 <root>/tasks/<taskId>，不要重复拼 tasks，不另建平行任务库。目录权限不足时取得实际目录权限，不能静默换根。上传、模型请求、评审、修改、归档、导出和恢复的具体命令按需读取 [执行与恢复](references/execution.md)。

需要当前对话生成时，读取 requests/<step>.json 的 guidance、schema、payload 与 inputDigest；查看其中真实资料，完成本阶段内容后导入：

```sh
node /absolute/skill/scripts/workflow.mjs complete TASK --root /absolute/task-store --step script --input /absolute/response.json --digest REQUEST_INPUT_DIGEST
```

每次命令后回读 status，处理下一个可执行的生成请求；只有约定评审、缺少必要输入或工具能力、发布待核验时才停止自动推进。请求中的指导和结构校验不能取代对实际作品的判断。不要直接编辑 state.json 或审批文件推动流程。

## 制作、检查与交付

素材包含图片、录音或视频时，按 [实际素材理解](references/understanding.md) 处理真实像素、OCR、转录与关键帧。materials 可能先请求 visual-analysis，再请求 facts；当前助手完成两类请求并继续推进，不把 JSON 工作交给用户。

按制作指导把脚本、画面、音频组合成同一套表达。检查实际画面和正常速度播放效果，对照需求核查信息主次、可读性、音画关系、时长和修改是否落实。发现问题回到实际负责的内容或工程修正；不要用无关参数变化声称满足反馈。

配音服务可按任务选择 edge-tts（免费，带词级 WordBoundary）或 MiMo 语音（小米，Token 存在工作空间设置里）；词级时间轴只来自服务 WordBoundary 或实际强制对齐，MiMo 不返回词级时间码时按每句真实时长做句级对齐，用户录音不能按字数均摊冒充真实边界。技术检查、语义判断、人工观看分别记录证据，未看的画面、未听的配音继续保留 unknown。完整音频和工具细节见执行参考。

交付说明实际成片、封面、可编辑工程、素材出处、检查范围及剩余问题，并回读同一任务状态。定制交付按导入协议回纳并回读新版本；未导入时明确说明在任务之外。不得伪造已回纳、已审批、已完整验收或已发布。

## 发布与核验

三种类型分别映射 article、imageText、shortVideo，先核对当前桥接的真实能力和账号。准备发布时读取 [发布与回执](references/publishing.md)。使用实际平台能力与账号，确认当前完整内容符合本次授权。发布默认确认一次，并与发布关合并；“直接出片”不等于允许发布。

先保存稳定 requestId。已填入、已点击、已提交、等待登录、needs_check 均不等于已发布。不确定时只查询原请求；确认失败或人工确认未发布后，才按授权重试。暂停或宿主中断后仍保留原请求与核验责任。
