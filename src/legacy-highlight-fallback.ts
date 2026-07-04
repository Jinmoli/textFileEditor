import { properties } from "@codemirror/legacy-modes/mode/properties";
import { StringStream } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { tokenizeBatch, tokenizeShell } from "./script-highlighting";

export type LegacyHighlightLanguage = "batch" | "properties" | "shell";

export interface LegacyHighlightSpan {
  from: number;
  to: number;
  text: string;
  classes: string;
}

interface PropertiesHighlightState {
  afterSection: boolean;
  inMultiline: boolean;
  nextMultiline: boolean;
  position: "comment" | "def" | "quote";
}

const MARK_CACHE = new Map<string, Decoration>();

export function createLegacyHighlightFallback(language: LegacyHighlightLanguage) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildLegacyHighlightDecorations(language, view);
      }

      update(update: ViewUpdate): void {
        if (shouldRebuildLegacyHighlight(update)) {
          this.decorations = buildLegacyHighlightDecorations(language, update.view);
        }
      }
    },
    {
      decorations: (value) => value.decorations
    }
  );
}

export function shouldRebuildLegacyHighlight(update: Pick<ViewUpdate, "docChanged">): boolean {
  return update.docChanged;
}

export function collectLegacyHighlightSpans(language: LegacyHighlightLanguage, content: string): LegacyHighlightSpan[] {
  const lines = content.split("\n");
  const spans: LegacyHighlightSpan[] = [];
  let offset = 0;
  let propertiesState = language === "properties" ? createPropertiesHighlightState() : null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const lineSpans =
      language === "properties"
        ? collectPropertiesLineSpans(line, propertiesState!)
        : collectStreamLineSpans(language, line);

    for (const span of lineSpans) {
      spans.push({
        ...span,
        from: span.from + offset,
        to: span.to + offset
      });
    }

    offset += line.length + 1;
  }

  return spans;
}

function buildLegacyHighlightDecorations(language: LegacyHighlightLanguage, view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const spans = collectLegacyHighlightSpans(language, view.state.doc.toString());

  for (const span of spans) {
    if (span.from >= span.to) {
      continue;
    }
    builder.add(span.from, span.to, getMark(span.classes));
  }

  return builder.finish();
}

function getMark(classes: string): Decoration {
  let mark = MARK_CACHE.get(classes);
  if (!mark) {
    mark = Decoration.mark({ class: classes });
    MARK_CACHE.set(classes, mark);
  }
  return mark;
}

function collectStreamLineSpans(language: Exclude<LegacyHighlightLanguage, "properties">, line: string): LegacyHighlightSpan[] {
  const stream = new StringStream(line, 4, 2);
  const tokenize = language === "shell" ? tokenizeShell : tokenizeBatch;
  const spans: LegacyHighlightSpan[] = [];

  while (!stream.eol()) {
    stream.start = stream.pos;
    const style = tokenize(stream);
    pushSpan(spans, line, stream.start, stream.pos, mapStyleToClasses(style, language));
  }

  return spans;
}

function collectPropertiesLineSpans(
  line: string,
  state: PropertiesHighlightState
): LegacyHighlightSpan[] {
  const stream = new StringStream(line, 4, 2);
  const spans: LegacyHighlightSpan[] = [];

  while (!stream.eol()) {
    stream.start = stream.pos;
    const style = properties.token(stream, state);
    pushSpan(spans, line, stream.start, stream.pos, mapStyleToClasses(style, "properties"));
  }

  return spans;
}

function createPropertiesHighlightState(): PropertiesHighlightState {
  return {
    position: "def",
    nextMultiline: false,
    inMultiline: false,
    afterSection: false
  };
}

function pushSpan(
  spans: LegacyHighlightSpan[],
  line: string,
  from: number,
  to: number,
  classes: string | null
): void {
  if (!classes || from === to) {
    return;
  }

  const text = line.slice(from, to);
  const previous = spans.at(-1);
  if (previous && previous.classes === classes && previous.to === from) {
    previous.to = to;
    previous.text += text;
    return;
  }

  spans.push({ from, to, text, classes });
}

function mapStyleToClasses(style: string | null, language: LegacyHighlightLanguage): string | null {
  switch (style) {
    case "comment":
      return "tok-comment";
    case "meta":
      return "tok-meta";
    case "keyword":
      return "tok-keyword";
    case "variableName":
      return "tok-variableName";
    case "operator":
      return "tok-operator";
    case "number":
      return "tok-number";
    case "string":
      return "tok-string";
    case "string-2":
      return "tok-string2";
    case "def":
      return language === "properties" ? "tok-propertyName tok-definition" : "tok-variableName tok-definition";
    case "header":
      return "tok-propertyName tok-definition";
    default:
      return null;
  }
}
