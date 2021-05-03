import assert from "assert";
import { readFile } from "fs/promises";
import { URL } from "url";
import { isIdentifierContinue, isIdentifierStart } from "../compiler/charcode.js";
import { throwOnError } from "../compiler/diagnostics.js";
import {
  createScanner,
  isKeyword,
  isPunctuation,
  isStatementKeyword,
  KeywordLimit,
  Keywords,
  Token,
  TokenDisplay,
} from "../compiler/scanner.js";

type TokenEntry = [
  Token,
  string?,
  {
    pos?: number;
    line?: number;
    character?: number;
    value?: string;
  }?
];

function tokens(text: string, onError = throwOnError): TokenEntry[] {
  const scanner = createScanner(text, onError);
  const result: TokenEntry[] = [];
  do {
    const token = scanner.scan();
    assert.strictEqual(token, scanner.token);
    result.push([
      scanner.token,
      scanner.getTokenText(),
      {
        pos: scanner.tokenPosition,
        value: scanner.getTokenValue(),
        ...scanner.file.getLineAndCharacterOfPosition(scanner.tokenPosition),
      },
    ]);
  } while (!scanner.eof());

  // verify that the input matches the output
  const out = result.map((each) => each[1]).join("");
  assert.strictEqual(out, text, "Input text should match parsed token values");

  return result;
}

function verify(tokens: TokenEntry[], expecting: TokenEntry[]) {
  for (const [index, [expectedToken, expectedText, expectedAdditional]] of expecting.entries()) {
    const [token, text, additional] = tokens[index];
    assert.strictEqual(Token[token], Token[expectedToken], `Token ${index} must match`);

    if (expectedText) {
      assert.strictEqual(text, expectedText, `Token ${index} test must match`);
    }

    if (expectedAdditional?.pos) {
      assert.strictEqual(
        additional!.pos,
        expectedAdditional.pos,
        `Token ${index} position must match`
      );
    }

    if (expectedAdditional?.line) {
      assert.strictEqual(
        additional!.line,
        expectedAdditional.line,
        `Token ${index} line must match`
      );
    }

    if (expectedAdditional?.character) {
      assert.strictEqual(
        additional!.character,
        expectedAdditional?.character,
        `Token ${index} character must match`
      );
    }

    if (expectedAdditional?.value) {
      assert.strictEqual(
        additional!.value,
        expectedAdditional.value,
        `Token ${index} value must match`
      );
    }
  }
}

describe("scanner", () => {
  /** verifies that we can scan tokens and get back some output. */
  it("smoketest", () => {
    const all = tokens('\tthis is "a" test');
    verify(all, [
      [Token.Whitespace],
      [Token.Identifier, "this", { value: "this" }],
      [Token.Whitespace],
      [Token.Identifier, "is", { value: "is" }],
      [Token.Whitespace],
      [Token.StringLiteral, '"a"', { value: "a" }],
      [Token.Whitespace],
      [Token.Identifier, "test", { value: "test" }],
    ]);
  });

  it("scans objects", () => {
    const all = tokens("model Foo{x:y}");

    verify(all, [
      [Token.ModelKeyword],
      [Token.Whitespace],
      [Token.Identifier, "Foo"],
      [Token.OpenBrace],
      [Token.Identifier, "x"],
      [Token.Colon],
      [Token.Identifier, "y"],
      [Token.CloseBrace],
    ]);
  });

  it("scans intersections", () => {
    const all = tokens("A&B");
    verify(all, [[Token.Identifier, "A"], [Token.Ampersand], [Token.Identifier, "B"]]);
  });

  it("scans decorator expressions", () => {
    const all = tokens('@foo(1,"hello",foo)');

    verify(all, [
      [Token.At],
      [Token.Identifier, "foo"],
      [Token.OpenParen],
      [Token.NumericLiteral, "1"],
      [Token.Comma],
      [Token.StringLiteral, '"hello"'],
      [Token.Comma],
      [Token.Identifier],
      [Token.CloseParen],
    ]);
  });

  it("scans extends keyword", () => {
    const all = tokens("model foo extends bar{}");
    verify(all, [
      [Token.ModelKeyword],
      [Token.Whitespace],
      [Token.Identifier, "foo"],
      [Token.Whitespace],
      [Token.ExtendsKeyword],
      [Token.Whitespace],
      [Token.Identifier, "bar"],
      [Token.OpenBrace],
      [Token.CloseBrace],
    ]);
  });
  it("does not scan greater-than-equals as one operator", () => {
    const all = tokens("x>=y");
    verify(all, [[Token.Identifier], [Token.GreaterThan], [Token.Equals], [Token.Identifier]]);
  });

  it("scans numeric literals", () => {
    const all = tokens("42 0xBEEF 0b1010 1.5e4 314.0e-2 1e+1000");
    verify(all, [
      [Token.NumericLiteral, "42"],
      [Token.Whitespace],
      [Token.NumericLiteral, "0xBEEF"],
      [Token.Whitespace],
      [Token.NumericLiteral, "0b1010"],
      [Token.Whitespace],
      [Token.NumericLiteral, "1.5e4"],
      [Token.Whitespace],
      [Token.NumericLiteral, "314.0e-2"],
      [Token.Whitespace],
      [Token.NumericLiteral, "1e+1000"],
    ]);
  });

  function scanString(text: string, expectedValue: string) {
    const scanner = createScanner(text);
    assert.strictEqual(scanner.scan(), Token.StringLiteral);
    assert.strictEqual(scanner.token, Token.StringLiteral);
    assert.strictEqual(scanner.getTokenText(), text);
    assert.strictEqual(scanner.getTokenValue(), expectedValue);
  }

  it("scans empty strings", () => {
    scanString('""', "");
  });

  it("scans strings single-line strings with escape sequences", () => {
    scanString('"Hello world \\r\\n \\t \\" \\\\ !"', 'Hello world \r\n \t " \\ !');
  });

  it("scans multi-line strings", () => {
    scanString('"More\r\nthan\r\none\r\nline"', "More\nthan\none\nline");
  });

  it("scans triple-quoted strings", () => {
    scanString(
      `"""   
      This is a triple-quoted string

  
      
      And this is another line
      """`,
      // NOTE: sloppy blank line formatting and trailing whitespace after open
      //       quotes above is deliberately tolerated.
      "This is a triple-quoted string\n\n\n\nAnd this is another line"
    );
  });

  it("provides token position", () => {
    const all = tokens("a x\raa x\r\naaa x\naaaa x\u{2028}aaaaa x\u{2029}aaaaaa x");
    verify(all, [
      [Token.Identifier, "a", { pos: 0, line: 0, character: 0 }],
      [Token.Whitespace, " ", { pos: 1, line: 0, character: 1 }],
      [Token.Identifier, "x", { pos: 2, line: 0, character: 2 }],
      [Token.NewLine, "\r", { pos: 3, line: 0, character: 3 }],

      [Token.Identifier, "aa", { pos: 4, line: 1, character: 0 }],
      [Token.Whitespace, " ", { pos: 6, line: 1, character: 2 }],
      [Token.Identifier, "x", { pos: 7, line: 1, character: 3 }],
      [Token.NewLine, "\r\n", { pos: 8, line: 1, character: 4 }],

      [Token.Identifier, "aaa", { pos: 10, line: 2, character: 0 }],
      [Token.Whitespace, " ", { pos: 13, line: 2, character: 3 }],
      [Token.Identifier, "x", { pos: 14, line: 2, character: 4 }],
      [Token.NewLine, "\n", { pos: 15, line: 2, character: 5 }],

      [Token.Identifier, "aaaa", { pos: 16, line: 3, character: 0 }],
      [Token.Whitespace, " ", { pos: 20, line: 3, character: 4 }],
      [Token.Identifier, "x", { pos: 21, line: 3, character: 5 }],
      [Token.NewLine, "\u{2028}", { pos: 22, line: 3, character: 6 }],

      [Token.Identifier, "aaaaa", { pos: 23, line: 4, character: 0 }],
      [Token.Whitespace, " ", { pos: 28, line: 4, character: 5 }],
      [Token.Identifier, "x", { pos: 29, line: 4, character: 6 }],
      [Token.NewLine, "\u{2029}", { pos: 30, line: 4, character: 7 }],

      [Token.Identifier, "aaaaaa", { pos: 31, line: 5, character: 0 }],
      [Token.Whitespace, " ", { pos: 37, line: 5, character: 6 }],
      [Token.Identifier, "x", { pos: 38, line: 5, character: 7 }],
    ]);
  });

  // It's easy to forget to update TokenDisplay or Min/Max ranges...
  it("provides friendly token display and classification", () => {
    const tokenCount = Object.values(Token).filter((v) => typeof v === "number").length;
    const tokenDisplayCount = TokenDisplay.length;
    assert.strictEqual(
      tokenCount,
      tokenDisplayCount,
      `Token enum has ${tokenCount} elements but TokenDisplay array has ${tokenDisplayCount}.`
    );

    // check that keywords have appropriate display and limits
    const nonStatementKeywords = [Token.ExtendsKeyword, Token.TrueKeyword, Token.FalseKeyword];
    let minKeywordLengthFound = Number.MAX_SAFE_INTEGER;
    let maxKeywordLengthFound = Number.MIN_SAFE_INTEGER;
    let minKeywordStartCharFound = Number.MAX_SAFE_INTEGER;
    let maxKeywordStartCharFound = Number.MIN_SAFE_INTEGER;

    for (const [name, token] of Keywords.entries()) {
      minKeywordLengthFound = Math.min(minKeywordLengthFound, name.length);
      maxKeywordLengthFound = Math.max(maxKeywordLengthFound, name.length);
      minKeywordStartCharFound = Math.min(minKeywordStartCharFound, name.charCodeAt(0));
      maxKeywordStartCharFound = Math.max(maxKeywordStartCharFound, name.charCodeAt(0));

      assert.strictEqual(TokenDisplay[token], `'${name}'`);
      assert(isKeyword(token), `${name} should be classified as a keyword`);
      if (!nonStatementKeywords.includes(token)) {
        assert(isStatementKeyword(token), `${name} should be classified as statement keyword`);
      }
    }

    assert.strictEqual(
      minKeywordLengthFound,
      KeywordLimit.MinLength,
      `min keyword length is incorrect, set KeywordLimit.MinLength to ${minKeywordLengthFound}`
    );
    assert.strictEqual(
      maxKeywordLengthFound,
      KeywordLimit.MaxLength,
      `max keyword length is incorrect, set KeywordLimit.MaxLength to ${maxKeywordLengthFound}`
    );
    assert.strictEqual(
      minKeywordStartCharFound,
      KeywordLimit.MinStartChar,
      `min keyword start char is incorrect, set KeywordLimit.MinStartChar to ${minKeywordStartCharFound}`
    );
    assert.strictEqual(
      maxKeywordStartCharFound,
      KeywordLimit.MaxStartChar,
      `max keyword start char is incorrect, set KeywordLimit.MaxStartChar to ${maxKeywordStartCharFound}`
    );

    // check single character punctuation
    for (let i = 33; i <= 126; i++) {
      const str = String.fromCharCode(i);
      const token = createScanner(str, () => ({})).scan();
      if (
        token !== Token.StringLiteral &&
        token !== Token.Identifier &&
        token !== Token.Invalid &&
        token !== Token.NumericLiteral
      ) {
        assert.strictEqual(TokenDisplay[token], `'${str}'`);
        assert(isPunctuation(token), `'${str}' should be classified as punctuation`);
      }
    }

    // check the rest
    assert.strictEqual(TokenDisplay[Token.Elipsis], "'...'");
    assert.strictEqual(TokenDisplay[Token.None], "<none>");
    assert.strictEqual(TokenDisplay[Token.Invalid], "<invalid>");
    assert.strictEqual(TokenDisplay[Token.EndOfFile], "<end of file>");
    assert.strictEqual(TokenDisplay[Token.SingleLineComment], "<single-line comment>");
    assert.strictEqual(TokenDisplay[Token.MultiLineComment], "<multi-line comment>");
    assert.strictEqual(TokenDisplay[Token.NewLine], "<newline>");
    assert.strictEqual(TokenDisplay[Token.Whitespace], "<whitespace>");
    assert.strictEqual(TokenDisplay[Token.ConflictMarker], "<conflict marker>");
    assert.strictEqual(TokenDisplay[Token.Identifier], "<identifier>");
  });

  // Search for Other_ID_Start in https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt
  const otherIDStart = [0x1885, 0x1886, 0x2118, 0x212e, 0x309b, 0x309c];

  // Search for Other_ID_Continue in https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt
  const otherIdContinue = [
    0x00b7,
    0x0387,
    0x1369,
    0x136a,
    0x136b,
    0x136c,
    0x136d,
    0x136e,
    0x136f,
    0x1370,
    0x1371,
    0x19da,
  ];

  it("allows additional identifier start characters", () => {
    assert(isIdentifierStart("$".codePointAt(0)!), "'$' should be allowed to start identifier.");
    assert(isIdentifierStart("_".codePointAt(0)!), "'_' should be allowed to start identifier.");

    for (const codePoint of otherIDStart) {
      assert(
        isIdentifierStart(codePoint),
        `U+${codePoint.toString(16)} should be allowed to start identifier.`
      );
    }
  });

  it("allows additional identifier continuation characters", () => {
    //prettier-ignore
    assert(isIdentifierContinue("$".codePointAt(0)!), "'$' should be allowed to continue identifier.");
    //prettier-ignore
    assert(isIdentifierContinue("_".codePointAt(0)!), "'_' should be allowed to continue identifier.");

    for (const codePoint of [...otherIDStart, ...otherIdContinue]) {
      assert(
        isIdentifierContinue(codePoint),
        `U+${codePoint.toString(16)} should be allowed to continue identifier.`
      );
    }

    assert(isIdentifierContinue(0x200c), "U+200C (ZWNJ) should be allowed to continue identifier.");
    assert(isIdentifierContinue(0x200d), "U+200D (ZWJ) should be allowed to continue identifier.");
  });

  it("scans this file", async () => {
    const text = await readFile(new URL(import.meta.url), "utf-8");
    tokens(text, function () {
      /* ignore errors */
    });
  });
});
