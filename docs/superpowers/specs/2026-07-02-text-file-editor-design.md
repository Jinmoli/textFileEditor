# Obsidian 文本文件编辑插件设计

## 目标

创建一个 Obsidian 本地插件，用于在 Obsidian 内查看和修改常见文本类文件，包括 `txt`、`sql`、`json`、`log`、`config`、`yml`、`yaml`、`properties`、`xml`、`html`、`htm`、`conf`、`ini` 等扩展名。

插件采用“源码工程 + 可直接加载插件目录”的形态：保留 TypeScript 源码和构建脚本，同时把构建产物输出到 `.obsidian/plugins/text-file-editor/`，方便直接在 Obsidian 中启用。

## 非目标

- 不实现二进制文件编辑。
- 不实现大型 IDE 功能，例如调试、项目索引、代码补全服务。
- 不绕过 Obsidian Vault API 直接写文件。
- 不在初版中处理文件合并冲突；文件被外部修改时以重新加载提示为主。

## 架构

项目根目录包含插件源码工程：

```text
package.json
tsconfig.json
esbuild.config.mjs
manifest.json
src/
  main.ts
  editor-view.ts
  extension-map.ts
  settings.ts
  extension-map.test.ts
  settings.test.ts
styles.css
.obsidian/plugins/text-file-editor/
  manifest.json
  main.js
  styles.css
```

构建脚本使用 esbuild 打包 `src/main.ts`，并把 `manifest.json`、`styles.css` 和生成的 `main.js` 输出到 `.obsidian/plugins/text-file-editor/`。

## 组件

### 插件入口

`src/main.ts` 负责：

- 加载和保存插件设置。
- 注册自定义文件扩展名。
- 注册编辑视图类型。
- 注册设置页。
- 提供命令，例如“保存当前文本文件”和“切换自动换行”。

### 编辑视图

`src/editor-view.ts` 负责：

- 读取当前 `TFile` 内容。
- 使用 CodeMirror 创建编辑器。
- 根据文件扩展名设置基础语言高亮。
- 跟踪未保存状态。
- 提供保存、重新加载、只读/编辑切换、换行切换。
- 关闭视图前发现未保存修改时给出明确提醒。

保存操作使用 `this.app.vault.modify(file, content)`。保存失败时展示精细化错误提示，例如文件不存在、没有权限、内容写入失败等。

### 扩展名和语言映射

`src/extension-map.ts` 负责：

- 标准化扩展名输入，例如去掉前导点并转小写。
- 判断文件是否受插件支持。
- 把扩展名映射到 CodeMirror 语言模式。

初始支持列表：

```text
txt, sql, json, log, config, yml, yaml, properties, xml, html, htm, conf, ini
```

其中 `json`、`yml/yaml`、`xml`、`html/htm`、`sql` 使用对应语言支持；其他格式使用纯文本。

### 设置页

`src/settings.ts` 负责：

- 管理支持的扩展名列表。
- 配置是否默认自动换行。
- 配置是否默认只读。
- 配置保存快捷键提示文本。

扩展名设置会做校验：不能为空、不能包含路径分隔符、不能重复。错误提示使用具体的人性化说明。

## 数据流

1. 用户在 Obsidian 文件列表中打开受支持扩展名的文件。
2. 插件拦截文件扩展名，创建文本文件编辑视图。
3. 编辑视图通过 Vault API 读取文件内容。
4. 用户修改内容后，视图状态变为未保存。
5. 用户点击保存按钮或执行保存命令。
6. 插件通过 Vault API 写回文件，保存成功后清除未保存状态。

## 错误处理

- 文件读取失败：展示“无法读取文件，请确认文件仍存在且 Obsidian 有访问权限。”
- 文件保存失败：展示“保存失败，请确认文件未被占用且磁盘可写。”
- 关闭未保存文件：弹出确认提醒，说明未保存修改会丢失。
- 设置校验失败：指出具体扩展名问题，例如“扩展名不能包含 `/` 或 `\`”。

## 测试计划

自动化测试覆盖：

- 扩展名标准化。
- 支持扩展名判断。
- 扩展名到语言类型的映射。
- 默认设置合并。
- 设置扩展名校验。

构建验证覆盖：

- `npm run test` 通过。
- `npm run build` 生成 `.obsidian/plugins/text-file-editor/main.js`。
- 插件目录包含 `manifest.json`、`main.js`、`styles.css`。

## 验收标准

- Obsidian 可以识别 `.obsidian/plugins/text-file-editor/manifest.json`。
- 受支持扩展名文件可以在 Obsidian 内打开。
- 文件内容可以查看、修改并保存回 Vault。
- 未保存修改有可见提示。
- 设置页可以调整扩展名和默认行为。
- 自动化测试和构建命令通过。
