# Text File Editor Encoding Refresh Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Chinese text decoding, refresh Obsidian file visibility on plugin enable, and add a manual formatting button for readable structured text files.

**Architecture:** Keep the editor view as the UI entry point, move formatting logic into pure helpers for testability, and extend the existing Obsidian config adapter so refresh behavior remains best-effort and version-tolerant. Encoding detection stays in `src/text-encoding.ts` but uses a richer scoring model instead of the current replacement-character-only heuristic.

**Tech Stack:** TypeScript, Obsidian plugin API, CodeMirror 6, Vitest, esbuild.

---

## File Structure

- Create `src/text-format.ts`: pure formatting helpers and support detection.
- Create `src/text-format.test.ts`: tests for formatter behavior and failure cases.
- Modify `src/text-encoding.ts`: richer auto-detection scoring.
- Modify `src/text-encoding.test.ts`: Chinese encoding regression coverage.
- Modify `src/obsidian-config.ts`: config enabling and best-effort refresh helpers.
- Modify `src/obsidian-config.test.ts`: refresh behavior tests.
- Modify `src/editor-view.ts`: add format button and invoke formatter with notices.
- Modify `src/extension-map.ts`: expose formatting eligibility by language where useful.
- Modify `styles.css`: toolbar button spacing if needed.
- Modify `README.md` and `README.en.md`: document new behavior.

## Task 1: 编码识别增强

**Files:**
- Modify: `src/text-encoding.ts`
- Modify: `src/text-encoding.test.ts`

- [ ] 写一个失败测试，覆盖中文 `GBK/GB18030` 内容在 `Auto` 模式下应优先识别为中文编码。
- [ ] 运行该测试，确认当前实现失败原因是评分策略过于简单。
- [ ] 在 `src/text-encoding.ts` 中实现多因子评分逻辑，最小化改动现有公开接口。
- [ ] 重新运行编码测试，确认新增用例与现有用例均通过。

## Task 2: 启用后刷新文件视图

**Files:**
- Modify: `src/obsidian-config.ts`
- Modify: `src/obsidian-config.test.ts`
- Modify: `src/main.ts`

- [ ] 写失败测试，覆盖“设置 `showUnsupportedFiles` 后尝试调用刷新入口”。
- [ ] 运行测试，确认当前实现只改配置不刷新。
- [ ] 实现最佳努力刷新逻辑，并让 `main.ts` 传入必要上下文。
- [ ] 重新运行相关测试，确认无刷新入口时也不会抛错。

## Task 3: 手动格式化按钮

**Files:**
- Create: `src/text-format.ts`
- Create: `src/text-format.test.ts`
- Modify: `src/editor-view.ts`
- Modify: `styles.css`

- [ ] 先为 `json/xml/yaml/sql` 写失败测试，覆盖成功格式化、格式不支持、解析失败三类场景。
- [ ] 运行测试，确认新能力尚不存在。
- [ ] 实现纯函数格式化器，再在编辑器工具栏增加“格式化”按钮并接入精细化提示。
- [ ] 重新运行格式化测试，确认输出可读且失败场景稳定。

## Task 4: 文档与验收

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`

- [ ] 更新中英文文档，说明中文编码自动识别增强、启用后刷新、手动格式化按钮。
- [ ] 运行 `npm run test`。
- [ ] 运行 `npm run typecheck`。
- [ ] 运行 `npm run build`。
- [ ] 将构建产物部署到 `D:\第二大脑\.obsidian\plugins\text-file-editor\` 并核对 `main.js`、`manifest.json`、`styles.css`。
