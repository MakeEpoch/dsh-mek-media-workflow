# 实际素材理解

文章、图片、视频与音频先作为原始素材留存，再提取可追溯信息。素材阶段不会增加一轮用户审批，继续按 brief 中已选策略运行。

## 实际执行路径

- 图片：本地 RapidOCR 读取实际位图，保存文字、识别框和置信度；图像语义另由支持 image 的模型或当前对话实际看图完成。
- 扫描 PDF：逐页栅格化后 OCR，保留页号与图片；每份最多 40 页，过大时显式拆分，不静默只处理前几页。依赖 pdfinfo/pdftoppm，文字 PDF 沿用 pdftotext。
- 音频：faster-whisper 在本地模型上转录，保存实际时长、句段、词时间码、语言及机器置信信息。
- 视频：ffprobe 确认实际媒体，FFmpeg 提取音轨与带时间码的抽样帧。默认 4 帧，可在 1–12 帧之间设置；不能把抽样帧声称为整片已观看。

原件摘要、实际工具/版本、OCR/ASR 结果及待核实项保存为独立文件，并登记到素材产物。正文提取标记为 machine-ocr-unverified 或 machine-transcript-unverified；引述匹配只证明可在提取文本中定位，不代表已验证外部事实。ASR 词时间码不是 forced-alignment，不能自动替代用户录音的强制对齐协议。

## 当前对话与独立模型

materials 阶段可能先生成 kind=visual-analysis 的请求。读取其 images 中的实际路径，逐张使用环境的图像查看能力；视频帧以给出的时间码为准。按 schema 导入 observations 后继续读取同阶段的 facts 请求。响应包含 kind 标记，观察结果按素材摘要缓存；不要把图像观察响应当作 facts，或沿用旧版本摘要。

原生 DSH 图像请求先检查模型明确声明的 inputModalities 是否含 image，再经 attachments 服务验证并提交真实像素。只支持文本或能力未知时，不会用文件名冒充看图。可在设置中单独指定图像模型；不需要新的 API Key 字段。单次最多 12 张图、30MB，超过范围需要分批实际查看，保留未覆盖范围。

analysisMode=auto 尝试实际处理并保留缺失工具/能力的 unknown；当前对话需要图像生成请求时继续交给助手处理。required 要求完成所需提取与图像理解，缺失时明确阻塞；off 保留原件，由当前对话自行处理。新任务保存执行配置，安装新工具后不静默改旧任务。

## 显式准备本地运行环境

制作过程中不自动装包或下载模型。安装者可在确定的独立目录准备运行环境：

```sh
node /absolute/skill/scripts/setup-runtime.mjs --directory /absolute/media-runtime --model base
```

需要 uv 与 Python 3.12；脚本创建独立环境，安装随包固定的兼容依赖并下载本地模型，最后输出 mediaPython、asrModel 与运行记录。已有模型可用 --reuse-model /absolute/model-dir，缓存齐全时支持 --offline。更大的模型可显式选用，不擅自消耗用户的下载或计算资源。

把返回路径保存到媒体工作流设置；doctor 会报告 OCR/ASR 环境与本地模型状态。需要本机 FFmpeg/ffprobe；扫描 PDF 还需要 Poppler。实际本地 OCR/ASR 不上传用户素材；选择远程图像模型时，按用户对本次素材处理的授权与平台配置执行。
