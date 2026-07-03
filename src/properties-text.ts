import { normalizeExtension } from "./extension-map";

export function shouldUsePropertiesEscapes(extension: string): boolean {
  return normalizeExtension(extension) === "properties";
}

export function decodePropertiesTextForDisplay(content: string): string {
  let result = "";

  for (let index = 0; index < content.length; index += 1) {
    const current = content[index];
    if (current !== "\\") {
      result += current;
      continue;
    }

    const next = content[index + 1];
    if (!next) {
      result += current;
      continue;
    }

    if (next === "u" && index + 5 < content.length) {
      const hex = content.slice(index + 2, index + 6);
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        result += String.fromCharCode(Number.parseInt(hex, 16));
        index += 5;
        continue;
      }
    }

    switch (next) {
      case "n":
        result += "\n";
        index += 1;
        break;
      case "r":
        result += "\r";
        index += 1;
        break;
      case "t":
        result += "\t";
        index += 1;
        break;
      case "f":
        result += "\f";
        index += 1;
        break;
      default:
        result += next;
        index += 1;
        break;
    }
  }

  return result;
}

export function encodePropertiesTextForStorage(content: string): string {
  let result = "";

  for (const character of content) {
    switch (character) {
      case "\\":
        result += "\\\\";
        break;
      case "\n":
        result += "\\n";
        break;
      case "\r":
        result += "\\r";
        break;
      case "\t":
        result += "\\t";
        break;
      case "\f":
        result += "\\f";
        break;
      default:
        result += character.charCodeAt(0) > 0x7f ? toUnicodeEscape(character) : character;
        break;
    }
  }

  return result;
}

function toUnicodeEscape(character: string): string {
  return `\\u${character.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
}
