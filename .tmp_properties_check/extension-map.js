"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SUPPORTED_EXTENSIONS = void 0;
exports.normalizeExtension = normalizeExtension;
exports.normalizeExtensionList = normalizeExtensionList;
exports.isSupportedExtension = isSupportedExtension;
exports.getExtensionLanguageKey = getExtensionLanguageKey;
exports.DEFAULT_SUPPORTED_EXTENSIONS = [
    "txt",
    "sql",
    "json",
    "log",
    "config",
    "yml",
    "yaml",
    "properties",
    "xml",
    "html",
    "htm",
    "java",
    "conf",
    "ini",
    "env",
    "sh",
    "bash",
    "zsh",
    "bat",
    "cmd",
    "ps1",
    "toml",
    "dockerfile",
    "gradle",
    "js",
    "mjs",
    "cjs",
    "ts",
    "css"
];
const LANGUAGE_BY_EXTENSION = {
    bash: "shell",
    bat: "batch",
    cjs: "javascript",
    cmd: "batch",
    css: "css",
    dockerfile: "dockerfile",
    env: "properties",
    gradle: "groovy",
    htm: "html",
    html: "html",
    ini: "properties",
    java: "java",
    js: "javascript",
    json: "json",
    mjs: "javascript",
    properties: "properties",
    ps1: "powershell",
    sh: "shell",
    sql: "sql",
    toml: "toml",
    ts: "javascript",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    zsh: "shell"
};
function normalizeExtension(extension) {
    return extension.trim().replace(/^\.+/, "").toLowerCase();
}
function normalizeExtensionList(extensions) {
    const seen = new Set();
    const normalized = [];
    for (const extension of extensions) {
        const value = normalizeExtension(extension);
        if (!value || seen.has(value)) {
            continue;
        }
        seen.add(value);
        normalized.push(value);
    }
    return normalized;
}
function isSupportedExtension(extension, supportedExtensions) {
    const normalized = normalizeExtension(extension);
    return normalizeExtensionList(supportedExtensions).includes(normalized);
}
function getExtensionLanguageKey(extension) {
    const normalized = normalizeExtension(extension);
    return LANGUAGE_BY_EXTENSION[normalized] ?? "text";
}
