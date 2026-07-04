import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type TextFileEditorPlugin from "./main";
export {
  DEFAULT_SETTINGS,
  mergeSettings,
  parseExtensionInput,
  validateSupportedExtensions,
  type TextFileEditorSettings
} from "./settings-core";
import { DEFAULT_SETTINGS, parseExtensionInput, validateSupportedExtensions } from "./settings-core";

export class TextFileEditorSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: TextFileEditorPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Text File Editor" });

    new Setting(containerEl)
      .setName("支持的文件扩展名")
      .setDesc("使用逗号、空格或换行分隔，例如：txt, sql, json, log。")
      .addTextArea((text) => {
        text
          .setPlaceholder("txt, sql, json")
          .setValue(this.plugin.settings.supportedExtensions.join(", "))
          .onChange(async (value) => {
            const extensions = parseExtensionInput(value);
            const result = validateSupportedExtensions(extensions);
            if (!result.ok) {
              text.inputEl.setCustomValidity(result.message);
              text.inputEl.reportValidity();
              return;
            }
            text.inputEl.setCustomValidity("");
            this.plugin.settings.supportedExtensions = extensions;
            await this.plugin.saveSettings();
            this.plugin.refreshRegisteredExtensions();
          });
        text.inputEl.rows = 4;
      });

    containerEl.createDiv({
      cls: "text-file-editor-setting-preview",
      text: `当前支持：${this.plugin.settings.supportedExtensions.join(", ")}`
    });

    new Setting(containerEl)
      .setName("恢复默认扩展名")
      .setDesc("恢复插件默认支持的文本文件扩展名，并重新注册文件打开方式。")
      .addButton((button) =>
        button.setButtonText("恢复默认").onClick(async () => {
          this.plugin.settings.supportedExtensions = [...DEFAULT_SETTINGS.supportedExtensions];
          await this.plugin.saveSettings();
          this.plugin.refreshRegisteredExtensions();
          new Notice("已恢复默认扩展名，建议按 Ctrl+R 重新加载 Obsidian。");
          this.display();
        })
      );

    new Setting(containerEl)
      .setName("默认自动换行")
      .setDesc("打开文件时默认启用自动换行。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.defaultWordWrap).onChange(async (value) => {
          this.plugin.settings.defaultWordWrap = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("显示行号")
      .setDesc("在文本编辑器左侧显示行号，并高亮当前光标所在行。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showLineNumbers).onChange(async (value) => {
          this.plugin.settings.showLineNumbers = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenTextFileViews();
        })
      );

    new Setting(containerEl)
      .setName("默认只读")
      .setDesc("打开文件时默认不允许编辑，需要手动切换到编辑模式。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.defaultReadOnly).onChange(async (value) => {
          this.plugin.settings.defaultReadOnly = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("默认读取编码")
      .setDesc("Auto 会根据 BOM 和解码质量自动判断；老项目 SQL 或日志乱码时可手动选择 GBK/GB18030。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("auto", "Auto")
          .addOption("ascii", "ASCII")
          .addOption("utf-8", "UTF-8")
          .addOption("gbk", "GBK")
          .addOption("gb18030", "GB18030")
          .addOption("big5", "Big5")
          .addOption("shift_jis", "Shift_JIS")
          .addOption("utf-16le", "UTF-16 LE")
          .addOption("utf-16be", "UTF-16 BE")
          .setValue(this.plugin.settings.encoding)
          .onChange(async (value) => {
            this.plugin.settings.encoding = value as typeof this.plugin.settings.encoding;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("大文件提醒阈值（MB）")
      .setDesc("文件超过该大小时，打开前会提醒并默认以只读方式加载；设置为 0 可关闭提醒。")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.largeFileWarningSizeMb)).onChange(async (value) => {
          const threshold = Number(value);
          if (!Number.isFinite(threshold) || threshold < 0) {
            text.inputEl.setCustomValidity("请输入大于等于 0 的数字。");
            text.inputEl.reportValidity();
            return;
          }
          text.inputEl.setCustomValidity("");
          this.plugin.settings.largeFileWarningSizeMb = threshold;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("草稿自动保存间隔（秒）")
      .setDesc("未保存修改会定期保存到插件数据目录，设置为 0 可关闭草稿自动保存。")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.autoSaveDraftIntervalSeconds)).onChange(async (value) => {
          const interval = Number(value);
          if (!Number.isFinite(interval) || interval < 0) {
            text.inputEl.setCustomValidity("请输入大于等于 0 的数字。");
            text.inputEl.reportValidity();
            return;
          }
          text.inputEl.setCustomValidity("");
          this.plugin.settings.autoSaveDraftIntervalSeconds = interval;
          await this.plugin.saveSettings();
        })
      );
  }
}
