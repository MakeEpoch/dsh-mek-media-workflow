# 执行与恢复

本参考说明现有插件和 CLI 的实际操作。制作方向与质量判断见 [creation.md](creation.md)，评审协议见 [review.md](review.md)。以下命令中的 skill 路径均需替换为当前技能的绝对路径。

## 创建与继续任务

先确定唯一任务数据根，再创建任务。DSH 加载本技能时会附带工作台的实际数据根，所有 CLI 命令的 `--root` 必须使用该路径；工作区可以存放来源、需求草稿和阶段响应文件，但不能另建一份任务库。数据根下面才是 `tasks/<taskId>`，不要把 `tasks` 层重复拼接。若没有写入权限，说明需要为该目录取得写入权限，不要静默换到另一个目录后声称工作台已同步。

独立 CLI 默认使用 `MEDIA_WORKFLOW_HOME`；未指定时，有 `DSH_HOME` 就使用 `$DSH_HOME/media-workflow`，否则使用 `~/.media-workflow`。可运行 `workflow.mjs help` 查看解析后的 `root`。DSH 中以宿主附带的实际数据根为准，因为宿主可能配置了自定义路径。已有任务沿用原根、任务 ID、审批和产物；位置不一致时先说明，不重新创建。

先校验完整需求：

```sh
node /absolute/skill/scripts/brief.mjs --input /absolute/brief.json --output /absolute/normalized-brief.json
node /absolute/skill/scripts/workflow.mjs create --root /absolute/task-store --brief /absolute/normalized-brief.json --start
```

`--approve-brief` 仅用于用户已确认当前需求的情况，包括 UI 的“确认需求并开始”。不能为了让流程继续而自行批准。`none` 不需要伪造需求审批。

CLI 返回结构化任务状态，任务目录是 `<root>/tasks/<taskId>`。DSH 中使用工作台展示同一份数据。读取和恢复时沿用原任务 ID，不重新创建同一任务：

```sh
node /absolute/skill/scripts/workflow.mjs status TASK --root /absolute/task-store
node /absolute/skill/scripts/workflow.mjs run TASK --root /absolute/task-store
```

CLI 不自行调用某个 harness 的模型。若阶段需要内容生成，状态为 `blocked`，`requests/<step>.json` 包含当前输入摘要、结构与来源。由当前 harness 完成内容，并通过以下命令导入：

```sh
node /absolute/skill/scripts/workflow.mjs complete TASK --root /absolute/task-store --step script --input /absolute/response.json --digest REQUEST_INPUT_DIGEST
```

导入后会自动继续后续已具备输入的阶段，直到约定评审关、必需输入缺失或执行结束；`none` 可能从分镜导入直接推进到成片。仅制作任务的交付包装自动复用已生成文稿，无需再写平台包装。阶段结果必须基于请求内的实际资料。视频无旁白时 script 是画面字幕文稿，不代表要合成口播。不得编造脚本已执行、截图已取得、词边界已验证、成片已观看或内容已发布。工作台独立模型可自动完成这些结构化生成阶段。任务沿用创建时的模型与工具配置；后来修改全局设置不会自动更新旧任务。

## 执行与评审

视频按 `workflow.json` 的十步推进；文章与图文按 `lib/profiles.mjs` 的九步推进，不执行 voice。任务保存流程版本及阶段快照，界面、恢复和依赖失效使用对应类型。普通步骤完成只更新产物；只在需求约定的关口呈现评审。审批绑定产物与输入版本，恢复时复用有效决定。

当状态为 `needs_review`，向用户呈现本关摘要、实际产物与检查结果。收到明确决定后调用：

```sh
node /absolute/skill/scripts/workflow.mjs review TASK --root /absolute/task-store --review REVIEW_ID --decision approve
node /absolute/skill/scripts/workflow.mjs review TASK --root /absolute/task-store --review REVIEW_ID --decision changes --feedback '用户的实际修改意见'
```

`redo` 使用当前阶段有效输入重新生成；`changes` 按反馈修改。TTS 音色/语速、合成或成片的标题/镜头/字幕参数通过 stage-edit 请求应用，只改当前阶段的工程副本并保留上游。发布关可在本关修改包装。修改意见属于输入摘要，不能沿用旧请求结果。事实、账号、实际录音或本阶段不支持的修改需补真实输入或明确重新提交需求，不能把相同参数重复执行称为已修改。保留旧产物，只更新受影响的下游。不要重问已经通过且内容未变的关口。不要直接编辑审批 JSON 冒充用户回答。

自动检查失败、缺资料或工具不可用属于执行阻塞，不能借此改成“一步一 review”。先尝试合理恢复；确需用户补充时集中说明阻塞和恢复入口。

## 归档

`archive` / `unarchive` 是任务的可逆标记，不是删除或移动：任务目录、产物、评审、回执都留在原位。归档任务不再出现在默认 `list` 中，用 `list --group archived` 查看，`summary.archived` 给出数量。

```sh
node /absolute/skill/scripts/workflow.mjs archive TASK --root /absolute/task-store
node /absolute/skill/scripts/workflow.mjs list --root /absolute/task-store --group archived
node /absolute/skill/scripts/workflow.mjs unarchive TASK --root /absolute/task-store
```

执行中、存在待评审或有未核验发布尝试的任务拒绝归档。已归档任务不能继续执行、评审、重做、改需求或补素材（`task-archived`），需先 `unarchive`；不要为绕过限制另建任务或直接改 state.json。归档不代替暂停、导出或发布核验。

## 配音、画面与交付

依赖检查使用 `workflow.mjs doctor`。视频本地渲染需要 ffmpeg/ffprobe；文章不需要配音和视频工具，图文 PNG 导出需要 settings.browser 指定的本机 Chrome；中文画面需要实际中文字体。NVENC 为可选加速，缺少 GPU 不阻止 CPU 制作。所选配音或画面后端才构成必需依赖，不自动安装或升级工具。

Edge TTS 通过 Python adapter 显式请求 WordBoundary，保留原始事件，统一 PCM 后按实际样本数拼接。MiMo 语音由 scripts/mimo-tts.py 调用 OpenAI 兼容的 chat/completions，逐句合成并把每句实际时长写入句级时间轴（alignmentMethod 为 sentence-boundary），令牌只通过环境变量传入、不落盘；预置音色、文本设计音色（voicedesign）与参考音频复刻（voiceclone）按模型分支处理，复刻需要任务里已有的音频素材。句级或录音时长不能冒充词级。用户录音应提供实际对齐结果。多段或词级录音会生成 voice 阶段请求；用相同 complete 命令导入 timeline 与 evidence（实际工具、结果出处），执行器核对文稿、词边界和真实音频时长。不得按字数均摊后声称已验证。

画面可使用 FFmpeg 的真实素材合成，或已安装的 huashu-motion 可编辑工程。使用后者时，需求与分镜关承担风格讨论，不另加一套默认评审。不得因渲染失败把产品界面降级为占位框、编造 UI 或重绘 Logo。

检查生成的实际画面与正常速度播放效果。结构检查通过不证明事实语义、品牌真实性或视觉质量。把无法自动确认的项保留为 `unknown`，提供证据与预览。

成片、封面、工程、素材清单和 QA 分别保留。`complete` 表示约定执行和检查结束，不能取代正常速度的主观观看；未完成的视觉判断继续保留 unknown。工程内部使用相对路径，迁移时导出完整任务与素材目录，单个工程 JSON 不包含媒体本身。不要把本地夹具、静态检查或健康检测当成真实账号或发布验收。

## 定制交付回纳

需要外部编辑或专业工具时按 [交付导入](imports.md) 保存新版本。仅导入 JSON 阶段响应使用 complete；导入实际文章、图组或成片使用 import-artifacts，二者不能互相冒充。

## 发布

文章、图组、视频分别使用 article、imageText、shortVideo，按实际桥接能力准备输入。文章正文和配图使用真实文件，图组保持导出顺序；发布准备不等于已发布。

按 [publishing.md](publishing.md) 使用 PostFaro。实际平台能力、账号和限制从目标桥接读取。发布前确认当前完整内容与需求授权相符。

提交前保存稳定 requestId 与任务 JSON。已填入、已点击、已提交、等待登录、`needs_check` 都不能报告为“已发布”。不确定时只查询原请求，不自动换 ID 重发。明确失败或人工确认未发布后，才按用户的重试动作提交新尝试。

暂停停止后续调度，并确认实际子进程状态。发布已发出时保留请求和回执，不能因关闭页面或重启恢复就重新执行发布。
