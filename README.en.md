# Text File Editor

[中文](README.md)

Text File Editor is an Obsidian plugin for opening and editing common text files directly from Obsidian's native file explorer, including `txt`, `sql`, `json`, `log`, `config`, `yml`, `yaml`, `java`, `properties`, `xml`, `html`, and more.

## Features

- Show and open non-Markdown text files directly in Obsidian's file explorer.
- View, edit, save, and reload text files.
- Syntax highlighting for formats such as `xml`, `java`, `yml/yaml`, `sql`, `json`, and `html`.
- Syntax highlighting for developer file types, including `sh/bash/zsh`, `bat/cmd`, `ps1`, `toml`, `dockerfile`, `gradle`, `js/ts`, `css`, and `properties`.
- A highlighting capability matrix is available at [`docs/highlighting/text-file-editor-highlighting-matrix.md`](docs/highlighting/text-file-editor-highlighting-matrix.md) for the current status and follow-up priorities of `xml / yaml / sql / shell / batch / ps1`.
- `Ctrl/Cmd+S` save shortcut.
- `Ctrl/Cmd+F` find support with an in-editor search and replace panel.
- Per-file read-only and word-wrap state, so one file's editing mode does not affect another file.
- Status display for file size, last modified time, encoding, line endings, language mode, and cursor position.
- Large-file warnings to avoid accidentally editing huge logs or SQL files.
- Automatic encoding detection and manual encoding selection for ASCII, UTF-8, GBK, GB18030, Big5, Shift_JIS, and UTF-16.
- Draft autosave for unsaved changes to reduce accidental data loss.
- Automatically enables Obsidian's `showUnsupportedFiles` setting so non-Markdown files can appear in the file explorer.
- Tries to refresh the file explorer when the plugin is enabled, reducing the need to restart Obsidian after first install.
- Adds a toolbar format button for JSON, XML, YAML, and SQL files to improve readability on demand.
- Falls back to the Vault Adapter when Obsidian's file index cannot read or write a file directly.

## Supported Extensions

Default supported extensions:

```text
txt, sql, json, log, config, yml, yaml, properties, xml, html, htm, java, conf, ini, env, sh, bash, zsh, bat, cmd, ps1, toml, dockerfile, gradle, js, mjs, cjs, ts, css
```

You can customize the supported extensions in the plugin settings tab. When upgrading from an older version, newly added default extensions are merged into the existing settings.

## Installation

### Install With BRAT

1. Install and enable the community plugin `BRAT` in Obsidian.
2. Open the `BRAT` settings tab.
3. Choose `Add Beta plugin`.
4. Enter the repository: [Jinmoli/textFileEditor](https://github.com/Jinmoli/textFileEditor)

5. Follow the prompts to install and enable `Text File Editor`.
6. The plugin will usually refresh the file explorer automatically after enabling. If files still do not appear, restart Obsidian or press `Ctrl+R` to reload.

### Manual Installation

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

## Usage

- Open a supported text file, edit it directly, and save it with the toolbar button.
- Use `Ctrl/Cmd+S` to save the current file.
- Use `Ctrl/Cmd+F` to open the in-editor find and replace panel.
- If an older file is garbled, switch the editor toolbar encoding dropdown to `GBK`, `GB18030`, or `ASCII` and reload it.
- Use the toolbar format button to improve readability for JSON, XML, YAML, and SQL files before saving.
- Read-only and word-wrap states are remembered per file and do not globally affect other files.

## Capability Boundaries

- `Highlighting`: `xml`, `yaml`, `sql`, `json`, `html`, `java`, `properties`, `sh/bash/zsh`, `bat/cmd`, `ps1`, `toml`, `dockerfile`, `gradle`, `js/ts`, and `css` are readable in-place. Script highlighting focuses on common control-flow, variable, function, and label patterns.
- `Formatting`: built-in formatting currently covers only `JSON / XML / YAML / SQL`. Other formats are not automatically rewritten.
- `Encoding and line endings`: common text encodings can be reloaded manually, and the status bar shows `LF / CRLF / mixed` line endings with a warning when mixed endings are detected.
- `Edit with caution`: legacy non-`UTF-8/ASCII` files, mixed line endings, very large logs or SQL files, and scripts that require exact syntax preservation should be reviewed carefully before saving or formatting.

## Development

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

## Release

Current stable version: `v1.3.0`

Pushing a tag like `v1.3.0` triggers GitHub Actions to run tests, type checks, build the plugin, and upload a zip file to the GitHub Release.

## License

This project is licensed under the [MIT License](LICENSE).
