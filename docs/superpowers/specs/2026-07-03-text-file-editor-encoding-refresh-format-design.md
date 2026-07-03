# Text File Editor 编码识别、刷新与格式化增强设计

## 背景

当前插件已经支持常见文本文件的查看和编辑，但还存在三个影响日常使用的问题：

1. `Auto` 编码模式对中文旧编码文件不够友好，部分 `txt`、`sql`、`log`、`properties` 会出现乱码。
2. 插件首次启用时虽然会打开 `showUnsupportedFiles`，但 Obsidian 文件树不会立刻刷新，导致新安装后必须重启或 `Ctrl+R` 才能看到文件。
3. 编辑器缺少手动“格式化”入口，`xml`、`json`、`yml`、`sql` 等内容可读性不足。

## 目标

- 优先提升常见中文文本文件的自动解码成功率，重点覆盖 `GBK`、`GB18030`、`UTF-8`、`UTF-16`。
- 插件启用时尽量立即刷新相关视图，让非 Markdown 文件无需重启即可出现。
- 在工具栏增加手动“格式化”按钮，提升 `json`、`xml`、`yaml/yml`、`sql` 文件的可读性。

## 非目标

- 不实现保存时自动格式化。
- 不引入重量级格式化框架或在线服务。
- 不承诺对所有历史编码、所有 SQL 方言做到完全精准格式化。

## 方案

### 1. 自动编码识别增强

保留现有手动编码切换能力，仅增强 `Auto` 模式策略。

新增“候选编码评分”流程：

- 先继续使用 BOM 识别 `UTF-8`、`UTF-16LE`、`UTF-16BE`。
- 无 BOM 时，对 `ascii`、`utf-8`、`gbk`、`gb18030`、`utf-16le`、`utf-16be` 等候选解码结果打分。
- 分值由多项信号组成：
  - `�` 替换字符数量。
  - 控制字符和异常空字节数量。
  - 中文字符命中率。
  - 可打印字符占比。
  - UTF-16 解码后是否出现高密度无意义空字符。
- 对中文常见编码给予更合理权重，避免仅因“没有替换字符”就误把中文文件判断成错误编码。

当多个编码分数接近时，优先选择更常见、风险更低的结果：

- 中文内容优先 `gb18030` 或 `gbk`。
- 非中文且内容干净时优先 `utf-8`。

### 2. 插件启用后的视图刷新

将 `obsidian-config` 从“只设置配置”扩展为“设置配置 + 尝试刷新”。

刷新策略遵循“尽量调用、失败静默降级”的原则：

- 先调用 Vault 的 `setConfig("showUnsupportedFiles", true)`。
- 再尝试调用 Obsidian 工作区或文件管理器上的已知刷新入口，例如文件浏览器视图的 `requestSort`、`setFile`、`reload`、`onOpen`、`view.refresh` 等可用方法。
- 如果运行时环境没有这些入口，不中断插件加载，只保留警告日志。

这样可以兼容不同 Obsidian 版本，尽量做到启用后立即可见。

### 3. 工具栏格式化按钮

在 `TextFileEditorView` 工具栏中新增“格式化”按钮，行为为手动触发。

支持范围：

- `json`：使用 `JSON.parse` + `JSON.stringify(value, null, 2)`。
- `xml`：使用轻量级缩进规则按标签层级格式化。
- `yaml/yml`：优先保证缩进与换行可读性，做保守格式化，不改写语义。
- `sql`：使用轻量关键字换行与缩进策略，优先增强可读性。

失败处理：

- 当前语言不支持格式化：提示“当前文件类型暂不支持格式化。”
- 内容解析失败：提示“格式化失败，请先确认当前文件语法完整。”
- 格式化结果与原文一致：提示“当前内容已是较易读格式，无需再次格式化。”

## 影响文件

- `src/text-encoding.ts`
- `src/text-encoding.test.ts`
- `src/obsidian-config.ts`
- `src/obsidian-config.test.ts`
- `src/editor-view.ts`
- `src/extension-map.ts`
- `styles.css`
- `README.md`
- `README.en.md`

## 测试策略

- 为中文编码识别增加回归测试，覆盖 `GBK / GB18030 / UTF-8 / UTF-16` 的自动判定。
- 为启用刷新增加测试，验证会设置 `showUnsupportedFiles`，并在存在刷新入口时尝试调用。
- 为格式化逻辑增加纯函数级测试，验证 `json`、`xml`、`yaml`、`sql` 的格式化输出及错误场景。
- 运行完整 `npm run test`、`npm run typecheck`、`npm run build`。

## 验收标准

- 常见中文旧编码文本文件在默认 `Auto` 模式下打开时，乱码情况显著减少。
- 新安装启用插件后，无需重启 Obsidian 也能更高概率立即看到受支持的非 Markdown 文件。
- 工具栏存在“格式化”按钮，且可手动整理 `json`、`xml`、`yaml/yml`、`sql` 文件内容。
- 不支持或格式错误时，提示信息明确、友好。
