import { describe, expect, it } from "vitest";
import { collectStreamTokens } from "./script-highlighting";

describe("script highlighting helpers", () => {
  it("highlights shell control flow, variables, and command substitution", () => {
    const tokens = collectStreamTokens("shell", "if [[ -n ${NAME} ]]; then echo $(whoami); fi");

    expect(tokens).toContainEqual({ text: "if", style: "keyword" });
    expect(tokens).toContainEqual({ text: "[[", style: "keyword" });
    expect(tokens).toContainEqual({ text: "${NAME}", style: "variableName" });
    expect(tokens).toContainEqual({ text: "$(whoami)", style: "string-2" });
    expect(tokens).toContainEqual({ text: "then", style: "keyword" });
    expect(tokens).toContainEqual({ text: "fi", style: "keyword" });
  });

  it("highlights shell function declarations and special variables", () => {
    const tokens = collectStreamTokens("shell", "deploy() { echo $1 && echo $?; }");

    expect(tokens).toContainEqual({ text: "deploy", style: "def" });
    expect(tokens).toContainEqual({ text: "$1", style: "variableName" });
    expect(tokens).toContainEqual({ text: "$?", style: "variableName" });
    expect(tokens).toContainEqual({ text: "&&", style: "operator" });
  });

  it("highlights shell function keyword declarations", () => {
    const tokens = collectStreamTokens("shell", "function deploy { echo $@; }");

    expect(tokens).toContainEqual({ text: "function", style: "keyword" });
    expect(tokens).toContainEqual({ text: "deploy", style: "def" });
    expect(tokens).toContainEqual({ text: "$@", style: "variableName" });
  });

  it("highlights shell loop and case operators used in scripts", () => {
    const tokens = collectStreamTokens("shell", "for item in $@; do case $item in a) echo ok | cat >> out ;; esac; done");

    expect(tokens).toContainEqual({ text: "for", style: "keyword" });
    expect(tokens).toContainEqual({ text: "$@", style: "variableName" });
    expect(tokens).toContainEqual({ text: "do", style: "keyword" });
    expect(tokens).toContainEqual({ text: "case", style: "keyword" });
    expect(tokens).toContainEqual({ text: "|", style: "operator" });
    expect(tokens).toContainEqual({ text: ">>", style: "operator" });
    expect(tokens).toContainEqual({ text: "esac", style: "keyword" });
    expect(tokens).toContainEqual({ text: "done", style: "keyword" });
  });

  it("highlights shell test brackets as operators", () => {
    const tokens = collectStreamTokens("shell", "if [ -n $PRG ]; then");

    expect(tokens).toContainEqual({ text: "[", style: "operator" });
    expect(tokens).toContainEqual({ text: "]", style: "operator" });
  });

  it("highlights batch labels, goto targets, and variables", () => {
    const tokens = collectStreamTokens("batch", "goto :deploy");

    expect(tokens).toContainEqual({ text: "goto", style: "keyword" });
    expect(tokens).toContainEqual({ text: ":deploy", style: "def" });
  });

  it("highlights batch delayed variables and loop variables", () => {
    const tokens = collectStreamTokens("batch", "for %%i in (*) do echo !NAME! %~dp0");

    expect(tokens).toContainEqual({ text: "for", style: "keyword" });
    expect(tokens).toContainEqual({ text: "%%i", style: "variableName" });
    expect(tokens).toContainEqual({ text: "!NAME!", style: "variableName" });
    expect(tokens).toContainEqual({ text: "%~dp0", style: "variableName" });
  });

  it("highlights batch arithmetic switches and argument variables", () => {
    const tokens = collectStreamTokens("batch", "set /a COUNT=%1 + 1");

    expect(tokens).toContainEqual({ text: "set", style: "keyword" });
    expect(tokens).toContainEqual({ text: "/a", style: "keyword" });
    expect(tokens).toContainEqual({ text: "%1", style: "variableName" });
  });

  it("highlights batch condition keywords and delayed expansion setup", () => {
    const tokens = collectStreamTokens("batch", "if exist %~dp0\\run.cmd if defined NAME setlocal enabledelayedexpansion");

    expect(tokens).toContainEqual({ text: "if", style: "keyword" });
    expect(tokens).toContainEqual({ text: "exist", style: "keyword" });
    expect(tokens).toContainEqual({ text: "%~dp0", style: "variableName" });
    expect(tokens).toContainEqual({ text: "defined", style: "keyword" });
    expect(tokens).toContainEqual({ text: "setlocal", style: "keyword" });
  });

  it("highlights wrapped batch variables completely", () => {
    const tokens = collectStreamTokens("batch", "if exist %A% goto done");

    expect(tokens).toContainEqual({ text: "%A%", style: "variableName" });
  });
});
