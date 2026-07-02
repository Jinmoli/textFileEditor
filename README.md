# Text File Editor

[中文](#中文) | [English](#english)

## 中文

Text File Editor 是一个 Obsidian 插件，用于在 Obsidian 原生文件列表中直接查看和编辑常见文本文件，例如 `txt`、`sql`、`json`、`log`、`config`、`yml`、`yaml`、`java`、`properties`、`xml`、`html` 等。

### 功能特性

- 直接在 Obsidian 文件夹树中显示并打开非 Markdown 文本文件。
- 支持查看、编辑、保存和重新加载文本文件。
- 支持 `xml`、`java`、`yml/yaml`、`sql`、`json`、`html` 等格式的语法高亮。
- 支持 `sh/bash/zsh`、`ps1`、`toml`、`dockerfile`、`js/ts`、`css`、`properties` 等更多开发文件高亮。
- 支持 `Ctrl/Cmd+S` 快捷保存、只读模式和自动换行切换。
- 支持文件大小、最后修改时间、编码、语言模式、光标行列状态显示。
- 支持大文件打开提醒，避免误编辑大日志或大 SQL 文件造成卡顿。
- 支持常见编码自动检测和手动选择，包括 UTF-8、GBK、GB18030、Big5、Shift_JIS、UTF-16。
- 支持未保存内容草稿自动保存，降低误关窗口导致内容丢失的风险。
- 自动开启 Obsidian 的 `showUnsupportedFiles` 配置，方便显示非 Markdown 文件。
- 当 Obsidian 文件索引不可用时，使用 Vault Adapter 作为备用读取/写入方式。

### 支持的扩展名

默认支持：

```text
txt, sql, json, log, config, yml, yaml, java, properties, xml, html, htm, conf, ini, env, sh, bash, zsh, bat, cmd, ps1, toml, dockerfile, js, mjs, cjs, ts, css
```

可以在插件设置页中调整支持的扩展名。

### 安装方式

#### 手动安装

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

### 本地开发

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

### 发布说明

当前稳定版本：`v1.1.0`

推送形如 `v1.0.0` 的 tag 后，GitHub Actions 会自动运行测试、类型检查、构建，并上传插件 zip 到 GitHub Release。

### 许可证

本项目基于 [MIT License](LICENSE) 开源。

## English

Text File Editor is an Obsidian plugin for opening and editing common text files directly from Obsidian's native file explorer, including `txt`, `sql`, `json`, `log`, `config`, `yml`, `yaml`, `java`, `properties`, `xml`, `html`, and more.

### Features

- Show and open non-Markdown text files directly in Obsidian's file explorer.
- View, edit, save, and reload text files.
- Syntax highlighting for formats such as `xml`, `java`, `yml/yaml`, `sql`, `json`, and `html`.
- Syntax highlighting for more developer file types, including `sh/bash/zsh`, `ps1`, `toml`, `dockerfile`, `js/ts`, `css`, and `properties`.
- `Ctrl/Cmd+S` save shortcut, read-only mode, and word-wrap toggle.
- Status display for file size, last modified time, encoding, language mode, and cursor position.
- Large-file warnings to avoid accidentally editing huge logs or SQL files.
- Automatic encoding detection and manual encoding selection for UTF-8, GBK, GB18030, Big5, Shift_JIS, and UTF-16.
- Draft autosave for unsaved changes to reduce accidental data loss.
- Automatically enables Obsidian's `showUnsupportedFiles` setting so non-Markdown files can appear in the file explorer.
- Falls back to the Vault Adapter when Obsidian's file index cannot read or write a file directly.

### Supported Extensions

Default supported extensions:

```text
txt, sql, json, log, config, yml, yaml, java, properties, xml, html, htm, conf, ini, env, sh, bash, zsh, bat, cmd, ps1, toml, dockerfile, js, mjs, cjs, ts, css
```

You can customize the supported extensions in the plugin settings tab.

### Installation

#### Manual Installation

1. Download the plugin files from GitHub Releases.
2. Create the following folder in your Obsidian vault:

   ```text
   .obsidian/plugins/text-file-editor
   ```

3. Copy these files into the folder:

   ```text
   main.js
   manifest.json
   styles.css
   ```

4. Restart Obsidian or press `Ctrl+R` to reload.
5. Enable the community plugin `Text File Editor` in Obsidian settings.

### Development

```bash
npm install
npm run test
npm run typecheck
npm run build
```

Build output is written to:

```text
.obsidian/plugins/text-file-editor
```

### Release

Current stable version: `v1.1.0`

Pushing a tag like `v1.0.0` triggers GitHub Actions to run tests, type checks, build the plugin, and upload a zip file to the GitHub Release.

### License

This project is licensed under the [MIT License](LICENSE).
