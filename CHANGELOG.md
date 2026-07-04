# Changelog

## v1.2.1

- 修复 `file-metadata` 时间格式测试对本地时区的隐式依赖，避免 GitHub Actions 在 `UTC` 环境下失败。

## v1.2.0

- 新增编辑器内 `Ctrl/Cmd+F` 查找与替换面板，并完成中文界面文案适配。
- 完善 `xml / yaml / sql / properties / sh / bat / ps1` 等文件的高亮体验，并补充高亮能力矩阵文档。
- 按文件记忆只读与自动换行状态，避免不同文件之间互相影响。
- 改进 `Ctrl/Cmd+S` 快捷保存处理，只在当前文本编辑器上下文中接管快捷键。
- 新增 ASCII 手动编码选项，并保留旧编码文件重新读取入口。
- 补充 BRAT 安装说明，完善中英文 README 与发布信息。
- 优化正式构建配置，默认使用压缩产物，减小发布包体积。

## v1.1.0

- Add release workflow for automatic GitHub Release zip packaging.
- Improve plugin settings with extension previews, default reset, encoding selection, large-file threshold, and draft autosave interval.
- Add `Ctrl/Cmd+S` save shortcut in the text editor.
- Add large-file warnings and read-only recommendation.
- Add automatic and manual encoding support for legacy text files.
- Add status details for file size, modified time, encoding, language mode, and cursor position.
- Extend syntax highlighting for shell, PowerShell, TOML, Dockerfile, JavaScript/TypeScript, CSS, and properties-like files.
- Add draft autosave for unsaved changes.
- Add contribution guide and GitHub issue templates.

## v1.0.0

- Initial stable release.
- Open and edit common text files directly from Obsidian's native file explorer.
- Support syntax highlighting for SQL, JSON, XML, HTML, YAML, Java, and common configuration/script files.
- Support saving, reloading, read-only mode, word wrap, file metadata status, large-file warnings, and draft autosave.
- Add bilingual README, MIT License, issue templates, and automated release packaging.
