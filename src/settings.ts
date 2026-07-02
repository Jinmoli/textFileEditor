import { App, PluginSettingTab, Setting } from "obsidian";
import type TextFileEditorPlugin from "./main";
export {
  DEFAULT_SETTINGS,
  mergeSettings,
  parseExtensionInput,
  validateSupportedExtensions,
  type TextFileEditorSettings
} from "./settings-core";
import { parseExtensionInput, validateSupportedExtensions } from "./settings-core";

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

    new Setting(containerEl)
      .setName("启动后打开文本文件列表")
      .setDesc("Obsidian 加载完成后，自动在左侧打开本插件的文本文件列表。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoOpenFileList).onChange(async (value) => {
          this.plugin.settings.autoOpenFileList = value;
          await this.plugin.saveSettings();
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
      .setName("默认只读")
      .setDesc("打开文件时默认不允许编辑，需要手动切换到编辑模式。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.defaultReadOnly).onChange(async (value) => {
          this.plugin.settings.defaultReadOnly = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
