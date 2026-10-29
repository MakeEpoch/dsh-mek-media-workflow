# 定制交付文件导入

专业排版、图像或视频工具制作的实际文件，可以导入现有任务的正式交付阶段。先完成需求、内容、编排、预览和质检；导入保留旧产物、旧决定，更新后续包装，并按已选评审策略重新呈现当前交付。它不代替上游素材核实，也不自动批准作品。

## 文件约定

| 类型 | 必要文件 |
| --- | --- |
| article | article.html、article.md、publication.json |
| image-post | gallery.html、article.md、publication.json、page-01.png 开始的连续 PNG 图片 |
| video | final.mp4、cover.png、render-project.json |

publication.json 至少包含 type 和 script。script 沿用本任务 script.json 的 title、sections、notes 结构及真实 sourceIds/factIds；改过正文时同时更新 script，后续包装会使用它。可沿用原生 publication.json 进行外部排版，额外保存工具工程。HTML 和图片必须是实际成品，不能用设计描述替代。图片尺寸应与 brief.output 一致。PNG、视频会接受格式或媒体检查，语义、视觉效果与版权仍需实际核查，记录为 unknown。

工程与依赖一并导入；支持目录内的唯一相对路径，引用资源使用相对路径或内嵌 data 图片。HTML/CSS 的本地图片和样式依赖需一并提供；可用 dependencies=[{path,sha256}] 显式列出工程依赖。缺失、越界或摘要不符会拒绝。网页预览在禁止脚本的 sandbox 中映射当前版本已登记资源，不读取任意任务文件，也不加载远程素材。文件最多 64 个，每个不超过 2GB，总量不超过 8GB；较大文件使用分片上传，不把大文件编码进 JSON。

## 工作台

在“正式交付 / 正式渲染”阶段展开“导入外部制作的交付文件”，选择完整文件或工程目录、填写真实改动说明后导入。大文件分片保存，可在中断后重选相同文件继续，并核对已上传分片。已上传文件先暂存到当前任务；成功导入才登记新产物版本。导入不会把文件追加到事实素材池。

## CLI

先获取当前导入摘要，不能自行计算或沿用旧摘要：

```sh
node /absolute/skill/scripts/workflow.mjs import-request TASK --root /absolute/task-store
```

将交付文件编码到本地 bundle.json：

```json
{
  "note": "实际编辑工具、本版修改与待核实项",
  "files": [
    { "name": "article.html", "base64": "实际文件的 Base64" },
    { "name": "article.md", "base64": "实际文件的 Base64" },
    { "name": "publication.json", "base64": "实际工程文件的 Base64" }
  ]
}
```

```sh
node /absolute/skill/scripts/workflow.mjs import-artifacts TASK --root /absolute/task-store --input /absolute/bundle.json --digest IMPORT_INPUT_DIGEST
node /absolute/skill/scripts/workflow.mjs status TASK --root /absolute/task-store
```

已通过上传接口保存的文件也可用 `{name,path}` 引用，path 只允许本任务 uploads/ 下的相对路径。拒绝外部路径和越界链接，文件会复制为独立快照并保留摘要，不依赖原编辑文件继续存在。

摘要同时绑定上游输入和当前交付版本，旧窗口不能覆盖较新的交付。导入期间任务更新、已有本版发布尝试、任务归档或正在执行时会拒绝；不要绕过状态文件。明确重做交付或提出新修改意见会撤销导入复用，按对应制作路径重新生成。

超过 8MB 的 CLI upload 自动采用分片，输出本任务 uploads/ 路径：

```sh
node /absolute/skill/scripts/workflow.mjs upload TASK --root /absolute/task-store --file /absolute/final.mp4 --staged
```

将返回 path 放进 bundle.files 的对应条目；name 可以是 assets/photo.png 等工程内路径。外部专业格式的依赖以提供的文件清单为准，不假装解析未支持的二进制工程内部结构。
