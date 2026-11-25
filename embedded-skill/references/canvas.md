# 正文与自由排版

文章和图组的 publication.json 是可编辑原生工程。完成预览与质检后，可在正式交付阶段选择“编辑正文与自由排版”，仍留在当前工作台或会话右侧。

支持文字、实际图片、矩形/椭圆图层；可拖动、缩放、旋转，修改字号、色彩、透明度、圆角和图层顺序，增删装饰层、增删装饰页、调整页序或把图层移到其他页。图片来自本任务实际素材池；不会按文件名生成伪界面。正文图层保留 sectionId，修改后同步到 Markdown、工程与后续包装；删除整段正文需先改文稿，不能在排版中无声隐藏原需求。

修改历史提供撤销/恢复，保存后登记交付新版本，并按已选评审方式继续。旧窗口的输入摘要失效时保留编辑内容并明确提示，不能覆盖新版。对已有画布提出评审修改时，会生成 canvas-edit 请求，基于本版工程落实实际变化，保留此前正文；没有变化不能报告修复。

图组以实际画布导出 PNG，检查图片解码、像素尺寸和文字溢出；文字放不下时调整字号、区域或分页。文章可直接预览排版 HTML；视觉效果仍需实际阅读。图层遮挡、事实语义与审美不能只靠技术指标判断。

## 当前对话操作

```sh
node /absolute/skill/scripts/workflow.mjs canvas-get TASK --root /absolute/task-store
node /absolute/skill/scripts/workflow.mjs canvas-save TASK --root /absolute/task-store --input /absolute/canvas.json --digest CURRENT_INPUT_DIGEST --note '实际修改说明'
```

canvas-get 返回当前 canvas、project 与摘要。基于实际工程编辑完整 pages/elements，不生成不存在的 imageId。JSON 不接受 HTML、脚本、远程图片 URL 或任意 CSS。保存后读取同一任务的新产物，实际看图；不能只检查 JSON 就宣称排版已验收。

这是静态作品画布。视频镜头、剪辑、声音与复杂动效使用实际视频工程或环境中的专业制作能力，再按交付导入协议回纳。富文本平台可能重新排版文章，发布页的最终效果需按实际编辑器与回执确认。
