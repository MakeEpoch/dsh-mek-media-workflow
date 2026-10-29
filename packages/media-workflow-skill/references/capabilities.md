# 能力清单：画面、音频与排版分别由什么产出

本文回答「用什么生成」的问题。判断前先读本文，不要凭模型记忆猜测插件能做什么。**本工作台不调用任何文生图、文生视频或视频生成模型**——画面来自真实素材、代码绘制与模板合成，音频来自 TTS 或用户录音。

不确定某项是否可用时，运行 `doctor` 核对，不要假设：

```sh
node /absolute/skill/scripts/workflow.mjs doctor --root /absolute/task-store
```

## 一、画面由什么产出

按作品类型（`work.type`）分三条不同的路，互不通用。

### video：两个渲染后端，二选一

`brief.render.backend` 决定，值为 `ffmpeg`（默认）或 `huashu`。

| 后端 | 画面怎么来的 | 版式 | 产物 |
| --- | --- | --- | --- |
| `ffmpeg` | FFmpeg 滤镜链合成：真实素材 + `drawtext` 烧录标题与字幕 | 固定版式 | `final.mp4`、`cover.png`、抽帧 |
| `huashu` | 生成 HTML + GSAP 工程，由用户本机 Chrome 逐帧渲染后编码 | 固定版式（模板字符串生成） | `motion-raw.mp4` + 可编辑 `project/index.html` |

两者的能力上限一致，都由 `lib/guidance.mjs` 的 `RENDERERS` 声明：**每镜头至多一份视觉素材**，`arbitraryLayout: false`，镜头运动只有 `push / hold / pan` 三种。

### huashu 模板：12 个起始工程

`brief.render.template` 选择（仅 huashu 后端生效，ffmpeg 后端忽略）。每个模板是一个完整的 huashu-motion 工程，决定镜头语言与画面结构；`brief.templateVariables` 按模板变量填充内容，空字符串表示主动清空该处的默认值。变量白名单与结构约束见 `lib/templates.mjs`，来源是 `om scan` 的实际输出。

| 形态 | 模板 | 内容组织 |
| --- | --- | --- |
| segments（一拍一页） | blank、kinetic-type、whiteboard、kurzgesagt、math-3b1b、storytime | 沿用 script 分段，一条要点一屏 |
| dataset（单图表） | finance-chart | 整片一份数据序列，不分镜 |
| hero（连续镜头） | keynote-ui、vox-collage、ui-space、object-3d | 一支连续镜头，需先备齐截图 / SVG 素材 |
| talking（口播包装） | talking-head | 需要人像素材，元素按说话的词锚定 |

需要素材前提的模板（keynote-ui、vox-collage、ui-space、object-3d、talking-head）在素材缺失时会出占位画面——先导入真实素材，再选这些模板。模板能力边界之外的定制效果仍走定制工程路径。

所以「数字滚动、多素材同屏、分屏、图表、复杂转场」这类要求，**内置后端兑现不了**，不要写进 visual 假装能实现。

需要这类效果时走定制工程：用环境中可用的制作能力做出实际工程与成片，再按 [交付导入](imports.md) 回纳为正式版本。huashu 后端产出的 `project/index.html` 本身就是可编辑工程（HTML + GSAP + `om.js`），可以在此基础上扩展后导入。

### image-post：Chrome 无头截图出 PNG

正文与配图排成 HTML，用 `settings.browser`（默认 `google-chrome`）无头模式逐页截图为 `page-01.png` 起的连续 PNG，同时保留 `gallery.html` 阅读预览。

也可用[自由排版](canvas.md)：直接编辑文字、位置、图层与页序，工程存为 `publication.json`，仍由同一个 Chrome 导出 PNG。

配图**不是生成的**：`materialIds` 必须引用任务中已有的真实 PNG/JPEG/WebP 素材，每页至多四张。

### article：HTML 与 Markdown

产出 `article.html`、`article.md` 与可编辑 `publication.json`，同样走 Chrome 导出。

### 需要「生成的图片」时怎么办

插件本身没有文生图。需要插画、概念图时，用环境中可用的图像能力（如 ComfyUI、其他图像工具）实际生成文件，再作为素材导入任务，之后按上面的路径参与排版或合成。

生成的文件必须先落到磁盘成为真实素材，才能被引用；不能在 brief 或 visual 里写一个「待生成」的描述充当画面。

## 二、音频由什么产出

配音只用于 video，由 `brief.voice.mode` 决定：`tts` / `provided` / `none`。

| 来源 | 说明 | 时间轴精度 |
| --- | --- | --- |
| edge-tts | 默认，免费，返回**词级** WordBoundary | 词级 |
| MiMo 语音 | 小米，Token 存工作区设置（`mimoApiKey`） | 服务不返回词级时间码 → 自动降级为**句级** |
| 用户录音 | `provided`，需提供实际对齐 | 按实际对齐结果 |

`provider` 在需求写入时解析一次并锁定，后续阶段沿用，不会中途更换。选 MiMo 时 `requiredAlignment` 自动记为 `sentence`——这是能力限制，不是配置失误，不要为了拿到词级时间轴去伪造边界。

音频产出后由 FFmpeg 与画面合成（`muxMotion`）。**插件不会自动配乐**：没有 BGM 轨道，也没有音效床。

## 编码与硬件加速

编码器由工作区设置的「硬件编码授权」（`hardwareAcceleration`）决定，三档：

- `auto`（默认）：先实测——用 NVENC 真编码一帧，成功就用 GPU，失败自动回退 `libx264`，原因写入 doctor 与日志
- `gpu`：已授权使用 GPU；实测仍不可用时同样回退并说明
- `cpu`：始终 `libx264`，不再探测

**列表里有 NVENC 编码器不等于设备可用**，所以判断依据是实测而非 `-encoders` 输出。GPU 编码需要在设置中明确授权，插件不会自行申请提权；实测失败也不会假装加速成功。预览始终走 CPU（`ultrafast`），只有正式渲染使用解析后的编码器。

### 两个后端各自的 GPU 使用情况

| 后端 | Chrome 逐帧渲染 | FFmpeg 编码 |
| --- | --- | --- |
| `ffmpeg` | 不涉及 | **受本设置控制**，可为 NVENC |
| `huashu` | **默认启用 GPU 合成**（`--software` 才退回 SwiftShader 软件渲染） | 上游固定 `libx264`，**不可切换** |

huashu-motion 的 `om render` 把编码器硬编码在各容器配置里（mp4 → `libx264`、mov → `prores_ks`、webm → `libvpx-vp9`、gif → `libx264`），`--preset` / `--crf` 是仅有的编码参数，不提供编码器选择。这是上游设计，不是本插件的限制。

所以「硬件编码授权」只对 ffmpeg 后端生效；选 huashu 后端时编码仍走 CPU，但耗时的逐帧截图已经由 GPU 合成承担，编码只是收尾步骤。不要因为选了 huashu 就认为 GPU 未被使用，也不要声称 huashu 后端支持 GPU 编码。

### huashu 的声音能力，插件当前不自动调用

huashu-motion 自带 `om sound`（按场景生成 ABC 乐谱配乐 + 音效）与 `om voice`（旁白与词级 cue）。但插件的 huashu 路径只调用 `om new / om check / om render`，**不调用 `om sound` 或 `om voice`**——声音仍由插件自己的 edge-tts / MiMo 链路产出后再混流。

需要配乐或特殊音效时，在任务外用 huashu 工具链做好音频，再随交付一起导入；不要在交付说明里声称成片「自带配乐」。

## 三、huashu-motion 有哪些能力

huashu-motion 是**独立的用户级技能**（`~/.agents/skills/huashu-motion`，MIT），插件通过 `findOm()` 解析它的 CLI（`cli/om.js`）后调用。它是 HTML + GSAP 的代码出片方案，画面由用户本机 Chrome 逐帧渲染。

### 12 个起始模板

`om templates` 列出，每个是成套的导演语言：

| 模板 | 适合 |
| --- | --- |
| `blank` | 自定义起点（**插件后端用的就是这个**） |
| `finance-chart` | 数据图表：柱状、折线、K 线，数据生长 + 一处标注 |
| `keynote-ui` | 深色发光背景，玻璃卡片弹出，数字滚动，发布片 |
| `kinetic-type` | 文字为主角，关键词砸入，色带转场 |
| `kurzgesagt` | 发光星球 + 卫星节点，镜头推进到节点内部 |
| `math-3b1b` | 黑板推导，公式变形，曲线演化 |
| `object-3d` | 产品实物打光，连续镜头运动 |
| `storytime` | 小人角色讲第一人称故事 |
| `talking-head` | 口播包装：名牌、数字卡、花字，可导出透明 ProRes 4444 |
| `ui-space` | 截图分层飞散，3D 镜头巡游界面 |
| `vox-collage` | 截图贴纸墙 + 红线圈点 |
| `whiteboard` | 白板逐句书写，图标连线 |

### 主要命令

| 命令 | 用途 |
| --- | --- |
| `om new <dir> --template t` | 建工程 |
| `om studio <dir>` | 实时预览、直接编辑、评论 |
| `om inbox <dir> --wait` | 阻塞等用户评论（**指着画面改**的闭环） |
| `om look <id>` | 把用户评论的那一帧与点击处放大成 PNG |
| `om done <id> --note` | 回复已处理 |
| `om check <dir>` | 渲染前查结构、脚本、文件、动效规则与抽样帧 |
| `om qa <dir>` | 渲染后查爆帧、死时间、硬切、动效曲线 |
| `om still <dir> --at 1.2,3.4` | 抽任意时刻的帧 |
| `om render <dir>` | 导出，支持 mp4/mov/webm/gif、`--blur`、`--transparent` |
| `om sound / om voice` | 配乐、音效、旁白（**插件不自动调用**，见上节） |
| `om grab <url\|folder>` | 抓取产品真实素材：截图、Logo、配色、字体 |
| `om vars / om set / om scan` | 变量与结构（给 agent 用） |
| `om learn / om learn harvest` | 用户偏好与既往经验 |

### 音效与音乐库

`om sound --list` 给出 21 个音效（pop、tick、whoosh、thud、impact、ding、riser、count、glitch、shutter…）、12 类产品的配乐方向（ai / hardware / data / explainer / guofeng / hype…）与 12 种风格（pulse、lofi、funk、cinematic、ambient、piano…）。

**这些属于 huashu 工具链，需要插件流程之外手动调用**，不等于工作台任务会自动产出配乐。

## 四、素材理解

真实素材（图片、录音、视频）的实际理解由本地 Python 适配器 `scripts/understand.py` 完成：OCR 取图内文字、ASR 转录、视频抽关键帧。`analysisMode` 为 `off / auto / required`，关键帧数上限 12，转录时长上限可配置。

视觉判断（主体、动作、可读性）由模型看实际像素完成，见 [understanding.md](understanding.md)。OCR/ASR 结果保留机器提取标记，不自动升级为事实真实性证明。

## 五、发布

发布走 PostFaro CLI 与浏览器桥接，按 [publishing.md](publishing.md) 核对真实能力与账号。插件只提交内容并核验回执，不代替平台账号与授权。
