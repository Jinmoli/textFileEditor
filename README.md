# Text File Editor

[English](README.en.md)

Text File Editor 是一个 Obsidian 插件，用于在 Obsidian 原生文件列表中直接查看和编辑常见文本文件，例如 `txt`、`sql`、`json`、`log`、`config`、`yml`、`yaml`、`java`、`properties`、`xml`、`html` 等。

## 功能特性

- 直接在 Obsidian 文件夹树中显示并打开非 Markdown 文本文件。
- 支持查看、编辑、保存和重新加载文本文件。
- 支持 `xml`、`java`、`yml/yaml`、`sql`、`json`、`html` 等格式的语法高亮。
- 支持 `sh/bash/zsh`、`bat/cmd`、`ps1`、`toml`、`dockerfile`、`gradle`、`js/ts`、`css`、`properties` 等开发文件高亮。
- 支持 `Ctrl/Cmd+S` 快捷保存。
- 支持按文件记忆只读模式和自动换行状态，避免一个文件的编辑状态影响另一个文件。
- 支持文件大小、最后修改时间、编码、语言模式、光标行列状态显示。
- 支持大文件打开提醒，避免误编辑大日志或大 SQL 文件造成卡顿。
- 支持常见编码自动检测和手动选择，包括 ASCII、UTF-8、GBK、GB18030、Big5、Shift_JIS、UTF-16。
- 优化中文旧编码自动识别，默认 `Auto` 模式下更适合常见 `GBK / GB18030` 文档。
- 支持未保存内容草稿自动保存，降低误关窗口导致内容丢失的风险。
- 自动开启 Obsidian 的 `showUnsupportedFiles` 配置，方便显示非 Markdown 文件。
- 插件启用时会尽量主动刷新文件树，减少首次安装后必须重启才能看到文件的情况。
- 新增工具栏“格式化”按钮，可手动整理 `JSON / XML / YAML / SQL` 内容，提升可读性。
- 当 Obsidian 文件索引不可用时，使用 Vault Adapter 作为备用读取/写入方式。

## 支持的扩展名

默认支持：

```text
txt, sql, json, log, config, yml, yaml, properties, xml, html, htm, java, conf, ini, env, sh, bash, zsh, bat, cmd, ps1, toml, dockerfile, gradle, js, mjs, cjs, ts, css
```

可以在插件设置页中调整支持的扩展名。旧版本用户升级后，新增的默认扩展名会自动合并到现有配置中。

## 安装方式

### 通过 BRAT 安装

1. 在 Obsidian 中安装并启用社区插件 `BRAT`。
2. 打开 `BRAT` 设置。
3. 选择 `Add Beta plugin`。
4. 输入仓库地址：[Jinmoli/textFileEditor](https://github.com/Jinmoli/textFileEditor)

5. 按提示安装并启用 `Text File Editor`。
6. 插件启用后通常会自动刷新文件树；如果极少数情况下仍看不到非 Markdown 文件，再重启 Obsidian 或按 `Ctrl+R` 重新加载。

### 手动安装

1. 从 GitHub Release 下载插件文件。
2. 在你的 Obsidian 库中创建目录：

   ```text
   .obsidian/plugins/text-file-editor
   ```

3. 将以下文件复制到该目录：

   ```text
   main.js
   manifest.json
   styles.css
   ```

4. 重启 Obsidian 或按 `Ctrl+R` 重新加载。
5. 在 Obsidian 设置中启用社区插件 `Text File Editor`。

## 使用说明

- 打开支持的文本文件后，可直接编辑并使用工具栏的“保存”按钮保存。
- 推荐使用 `Ctrl/Cmd+S` 快捷保存当前文件。
- 如果某个老文件乱码，可在编辑器工具栏的“编码”下拉框中切换到 `GBK`、`GB18030` 或 `ASCII` 后重新读取。
- `JSON / XML / YAML / SQL` 文件可点击工具栏“格式化”按钮提升可读性；格式化后建议确认无误再保存。
- 只读和自动换行状态按文件记忆，不会全局影响其他文件。

## 本地开发

```bash
npm install
npm run test
npm run typecheck
npm run build
```

构建产物会输出到：

```text
.obsidian/plugins/text-file-editor
```

## 发布说明

当前稳定版本：`v1.1.0`

推送形如 `v1.1.0` 的 tag 后，GitHub Actions 会自动运行测试、类型检查、构建，并上传插件 zip 到 GitHub Release。

## 许可证

本项目基于 [MIT License](LICENSE) 开源。
