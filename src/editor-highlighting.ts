import { HighlightStyle, type TagStyle } from "@codemirror/language";
import { type Tag, tags } from "@lezer/highlight";

export const HIGHLIGHT_TAGS = {
  definedProperty: tags.definition(tags.propertyName),
  definedVariable: tags.definition(tags.variableName),
  standardVariable: tags.standard(tags.variableName)
} as const;

export const PROPERTIES_TOKEN_TABLE = {
  def: HIGHLIGHT_TAGS.definedProperty
} as const;

export const EDITOR_HIGHLIGHT_STYLE_SPECS: readonly TagStyle[] = [
  { tag: tags.keyword, color: "var(--color-purple)", fontWeight: "700" },
  { tag: [tags.tagName, tags.typeName], color: "var(--color-blue)", fontWeight: "600" },
  { tag: [tags.propertyName, HIGHLIGHT_TAGS.definedProperty], color: "var(--color-blue)", fontWeight: "600" },
  { tag: tags.attributeName, color: "var(--color-orange)", fontWeight: "600" },
  {
    tag: [tags.variableName, tags.special(tags.variableName), HIGHLIGHT_TAGS.standardVariable],
    color: "#d336ff"
  },
  { tag: [HIGHLIGHT_TAGS.definedVariable, tags.labelName, tags.namespace], color: "var(--color-purple)", fontWeight: "700" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--color-green)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--color-orange)" },
  { tag: [tags.comment, tags.meta], color: "var(--color-green)", fontStyle: "italic" },
  { tag: [tags.operator, tags.punctuation, tags.separator], color: "var(--text-accent)" },
  { tag: [tags.className, tags.macroName], color: "var(--color-cyan)", fontWeight: "600" }
];

export const editorHighlightStyle = HighlightStyle.define([...EDITOR_HIGHLIGHT_STYLE_SPECS]);

export function findHighlightStyleSpec(tag: Tag): TagStyle | undefined {
  return EDITOR_HIGHLIGHT_STYLE_SPECS.find((spec) => includesTag(spec.tag, tag));
}

function includesTag(specTag: Tag | readonly Tag[], expectedTag: Tag): boolean {
  if (Array.isArray(specTag)) {
    return specTag.includes(expectedTag);
  }
  return specTag === expectedTag;
}
