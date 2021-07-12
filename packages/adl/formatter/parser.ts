import { Parser, ParserOptions } from "prettier";
import { parse as adlParse } from "../compiler/parser.js";
import { ADLScriptNode, Diagnostic } from "../compiler/types.js";

export function parse(
  text: string,
  parsers: { [parserName: string]: Parser },
  opts: ParserOptions & { parentParser?: string }
): ADLScriptNode {
  const result = adlParse(text, { comments: true });
  const errors = result.parseDiagnostics.filter((x) => x.severity === "error");
  if (errors.length > 0 && !result.printable) {
    throw new PrettierParserError(errors[0]);
  }
  return result;
}

export class PrettierParserError extends Error {
  public loc: { start: number; end: number };
  public constructor(public readonly error: Diagnostic) {
    super(error.message);
    this.loc = {
      start: error.pos ?? 0,
      end: error.end ?? 0,
    };
  }
}
