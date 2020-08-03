import { Kind, Scanner } from './scanner.js';

export function parse(code: string) {
  const s = new Scanner(code);
  nextToken();
  return parseADLScript();

  function parseADLScript(): ADLScriptNode {
    const script: ADLScriptNode = {
      kind: SyntaxKind.ADLScript,
      statements: [],
      pos: 0,
      end: 0
    }

    while (!s.eof) {
      script.statements.push(parseStatement());
    }

    script.end = s.offset;
    return script;
  }

  function parseStatement(): Statement {
    let decorators = [];
    while (true) {
      const tok = token();
      switch (tok) {
        case Kind.ImportKeyword:
          if (decorators.length > 0) {
            error('Cannot decorate an import statement');
          }
          return parseImportStatement();
        case Kind.At:
          decorators.push(parseDecoratorExpression());
          continue;
        case Kind.ModelKeyword:
          const model = parseModelStatement(decorators);
          decorators = [];
          return model;
        case Kind.InterfaceKeyword:
          const iface = parseInterfaceStatement(decorators);
          decorators = [];
          return iface;
      }

      throw new Error('Unable to parse statement');
    }

  }

  function parseInterfaceStatement(
    decorators: DecoratorExpressionNode[]
  ): InterfaceStatementNode {
    const pos = tokenPos();
    parseExpected(Kind.InterfaceKeyword);
    const id = parseIdentifier();
    parseExpected(Kind.OpenBrace);
    const properties: InterfacePropertyNode[] = [];

    if (parseOptional(Kind.CloseBrace)) {
      return finishNode({
        type: "InterfaceStatement",
        decorators,
        id,
        properties
      }, pos) as any; // todo: 😠
    }

    let memberDecorators: DecoratorExpressionNode[] = [];
    do {
      if (token() === Kind.At) {
        memberDecorators.push(parseDecoratorExpression());
      }
      properties.push(parseInterfaceProperty(memberDecorators));
      memberDecorators = [];
    } while (parseOptional(Kind.Comma))

    parseExpected(Kind.CloseBrace)

    return finishNode({
      kind: SyntaxKind.InterfaceStatement,
      decorators,
      id,
      properties
    }, pos);
  }

  function parseInterfaceProperty(decorators: DecoratorExpressionNode[]): InterfacePropertyNode {
    const pos = tokenPos();
    const id = parseIdentifier();
    const parameters = parseParameterList();
    parseExpected(Kind.Colon);
    const returnType = parseExpression();

    return finishNode({
      kind: SyntaxKind.InterfaceProperty,
      id,
      parameters,
      returnType,
      decorators
    }, pos);
  }

  function parseParameterList(): InterfaceParameterNode[] {
    parseExpected(Kind.OpenParen);

    if (parseOptional(Kind.CloseParen)) {
      return [];
    }
    const params: InterfaceParameterNode[] = [];
    do {
      const pos = tokenPos();
      const id = parseIdentifier();
      const optional = parseOptional(Kind.Question);
      parseExpected(Kind.Colon);
      const value = parseExpression();

      params.push(finishNode({
        kind: SyntaxKind.InterfaceParameter,
        id,
        value,
        optional
      }, pos));
    } while (parseOptional(Kind.Comma))
    parseExpected(Kind.CloseParen);
    return params;
  }

  function parseModelStatement(
    decorators: DecoratorExpressionNode[]
  ): ModelStatementNode {
    const pos = tokenPos();
    parseExpected(Kind.ModelKeyword);
    const id = parseIdentifier();
    parseExpected(Kind.OpenBrace);
    const node: Partial<ModelStatementNode> = {
      kind: SyntaxKind.ModelStatement,
      id,
      decorators
    };

    return finishModel(pos, node);
  }

  function finishModel<T extends ModelStatementNode | ModelExpressionNode>(
    pos: number,
    node: Partial<T>
  ): T {
    const properties: ModelPropertyNode[] = [];

    if (parseOptional(Kind.CloseBrace)) {
      return finishNode({
        ...node,
        properties
      }, pos) as any; // todo: 😠
    }

    let memberDecorators: DecoratorExpressionNode[] = [];
    do {
      if (token() === Kind.At) {
        memberDecorators.push(parseDecoratorExpression());
      }
      properties.push(parseModelProperty(memberDecorators));
      memberDecorators = [];
    } while (parseOptional(Kind.Comma))

    parseExpected(Kind.CloseBrace)

    return finishNode({
      ...node,
      properties,
    }, pos) as any;
  }

  function parseModelProperty(decorators: DecoratorExpressionNode[]): ModelPropertyNode {
    const pos = tokenPos();
    let id: IdentifierNode | StringLiteralNode;
    switch (token()) {
      case Kind.Identifier:
        id = parseIdentifier();
        break;
      case Kind.StringLiteral:
        id = parseStringLiteral();
        break;
      default:
        throw error('expected identifier or string literal');
    }

    const optional = parseOptional(Kind.Question);
    parseExpected(Kind.Colon);
    const value = parseExpression();

    return finishNode({
      kind: SyntaxKind.ModelProperty,
      id,
      decorators,
      value,
      optional
    }, pos);
  }

  function parseExpression(): Expression {
    return parseUnionExpression();
  }

  function parseUnionExpression(): Expression {
    let node = parseArrayExpression();

    if (token() !== Kind.Bar) {
      return node;
    }

    node = {
      kind: SyntaxKind.UnionExpression,
      options: [node]
    }

    while (parseOptional(Kind.Bar)) {
      const expr = parseArrayExpression();
      node.options.push(expr);
    }

    return node;
  }

  function parseArrayExpression(): Expression {
    const pos = tokenPos();
    const expr = parseMemberExpression();

    if (token() !== Kind.OpenBracket) {
      return expr;
    }
    parseExpected(Kind.OpenBracket);
    parseExpected(Kind.CloseBracket);

    const arr: ArrayExpressionNode = finishNode({
      kind: SyntaxKind.ArrayExpression,
      elementType: expr
    }, pos);

    return arr as any;
  }

  function parseImportStatement(): ImportStatementNode {
    const pos = tokenPos();

    parseExpected(Kind.ImportKeyword);
    const id = parseIdentifier();
    let as: NamedImportNode[] = [];

    if (token() === Kind.Identifier && tokenValue() === 'as') {
      parseExpected(Kind.Identifier);
      parseExpected(Kind.OpenBrace);

      if (token() !== Kind.CloseBrace) {
        as = parseNamedImports();
      }

      parseExpected(Kind.CloseBrace);
    }

    parseExpected(Kind.Semicolon);
    return finishNode({
      kind: SyntaxKind.ImportStatement,
      as, id
    }, pos);
  }

  function parseNamedImports(): NamedImportNode[] {
    const names: NamedImportNode[] = [];
    do {
      const pos = tokenPos();
      names.push(finishNode({
        kind: SyntaxKind.NamedImport,
        id: parseIdentifier()
      }, pos));
    } while (parseOptional(Kind.Comma))
    return names;
  }

  function parseDecoratorExpression(): DecoratorExpressionNode {
    const pos = tokenPos();
    parseExpected(Kind.At);
    const target = parseMemberExpression();

    if (target.kind !== SyntaxKind.Identifier
      && target.kind !== SyntaxKind.MemberExpression) {
      throw error(`a ${target.kind} is not a valid decorator`);
    }

    let args: Expression[] = [];
    if (parseOptional(Kind.OpenParen)) {
      if (!parseOptional(Kind.CloseParen)) {
        args = parseExpressionList();
        parseExpected(Kind.CloseParen);
      }
    }

    return finishNode({
      kind: SyntaxKind.DecoratorExpression,
      arguments: args,
      target
    }, pos);
  }

  function parseExpressionList(): Expression[] {
    const args: Expression[] = [];

    do {
      args.push(parseExpression());
    } while (parseOptional(Kind.Comma));

    return args;
  }

  function parseMemberExpression(): Expression {
    let base: Expression = parsePrimaryExpression();

    while (parseOptional(Kind.Dot)) {
      if (token() !== Kind.Identifier) {
        error('Member expressions only apply to identifiers');
      }
      const pos = tokenPos();
      base = finishNode({
        kind: SyntaxKind.MemberExpression,
        base,
        id: parseIdentifier()
      }, pos);
    }

    return base;
  }

  function parsePrimaryExpression(): Expression {
    switch (token()) {
      case Kind.Identifier: return parseIdentifier();
      case Kind.StringLiteral: return parseStringLiteral();
      case Kind.NumericLiteral: return parseNumericLiteral();
      case Kind.OpenBrace: return parseModelExpression([]);
      case Kind.OpenBracket: return parseTupleExpression();
    }

    throw error(`Unexpected token: ${Kind[token()]}`);
  }

  function parseTupleExpression(): TupleExpressionNode {
    const pos = tokenPos();
    parseExpected(Kind.OpenBracket);
    const values = parseExpressionList();
    parseExpected(Kind.CloseBracket);
    return finishNode({
      kind: SyntaxKind.TupleExpression,
      values
    }, pos);
  }

  function parseModelExpression(decorators: DecoratorExpressionNode[]): ModelExpressionNode {
    const pos = tokenPos();
    parseExpected(Kind.OpenBrace);
    const node: Partial<ModelExpressionNode> = {
      kind: SyntaxKind.ModelExpression,
      decorators
    };

    return finishModel(pos, node);
  }

  function parseStringLiteral(): StringLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Kind.StringLiteral);
    return finishNode({
      kind: SyntaxKind.StringLiteral,
      value
    }, pos);
  }

  function parseNumericLiteral(): NumericLiteralNode {
    const pos = tokenPos();
    const value = tokenValue();
    parseExpected(Kind.NumericLiteral);
    return finishNode({
      kind: SyntaxKind.NumericLiteral,
      value
    }, pos);
  }

  function parseIdentifier(): IdentifierNode {
    const id = token();
    const pos = tokenPos();

    if (id !== Kind.Identifier) {
      error(`expected an identifier, got ${Kind[id]}`);
    }
    const sv = s.value;

    nextToken();

    return finishNode({
      kind: SyntaxKind.Identifier,
      sv
    }, pos);
  }


  // utility functions
  function token() {
    return s.token;
  }

  function tokenValue() {
    return s.value;
  }

  function tokenPos() {
    return s.offset;
  }

  function nextToken() {
    s.scan();

    // skip whitespace tokens for now
    while (token() === Kind.Whitespace || token() === Kind.NewLine) {
      s.scan();
    }
  }

  function finishNode<T>(o: T, pos: number): T & { pos: number, end: number } {
    return {
      ...o,
      pos,
      end: tokenPos()
    }
  }

  function error(msg: string) {
    throw new Error(`[${s.position.line}, ${s.position.character}] ${msg}`);
  }

  function parseExpected(expectedToken: Kind) {
    if (token() === expectedToken) {
      nextToken();
      return true;
    } else {
      error(`expected ${Kind[expectedToken]}, got ${Kind[token()]}`);
      return false;
    }
  }

  function parseOptional(optionalToken: Kind) {
    if (token() === optionalToken) {
      nextToken();
      return true;
    }

    return false;
  }
}

export enum SyntaxKind {
  ADLScript,
  ImportStatement,
  Identifier,
  NamedImport,
  DecoratorExpression,
  MemberExpression,
  InterfaceStatement,
  InterfaceProperty,
  InterfaceParameter,
  ModelStatement,
  ModelExpression,
  ModelProperty,
  UnionExpression,
  TupleExpression,
  ArrayExpression,
  StringLiteral,
  NumericLiteral
}

export interface Node {
  kind: SyntaxKind,
  pos: number,
  end: number
}

export interface ADLScriptNode extends Node {
  kind: SyntaxKind.ADLScript;
  statements: Array<Statement>;
}

export type Statement = ImportStatementNode | ModelStatementNode | InterfaceStatementNode;

export interface ImportStatementNode extends Node {
  kind: SyntaxKind.ImportStatement;
  id: IdentifierNode;
  as: Array<NamedImportNode>;
}

export interface IdentifierNode extends Node {
  kind: SyntaxKind.Identifier;
  sv: string;
}

interface NamedImportNode extends Node {
  kind: SyntaxKind.NamedImport;
  id: IdentifierNode;
}

interface DecoratorExpressionNode extends Node {
  kind: SyntaxKind.DecoratorExpression,
  target: IdentifierNode | MemberExpressionNode,
  arguments: Expression[]
}

type Expression =
  | MemberExpressionNode
  | ModelExpressionNode
  | TupleExpressionNode
  | UnionExpressionNode
  | IdentifierNode
  | StringLiteralNode
  | NumericLiteralNode;

interface MemberExpressionNode extends Node {
  kind: SyntaxKind.MemberExpression,
  id: IdentifierNode,
  base: Expression | IdentifierNode
}

export interface InterfaceStatementNode extends Node {
  kind: SyntaxKind.InterfaceStatement,
  id: IdentifierNode,
  properties: InterfacePropertyNode[],
  decorators: DecoratorExpressionNode[]
}

export interface InterfacePropertyNode extends Node {
  kind: SyntaxKind.InterfaceProperty,
  id: IdentifierNode,
  parameters: InterfaceParameterNode[],
  returnType: Expression,
  decorators: DecoratorExpressionNode[]
}

export interface InterfaceParameterNode extends Node {
  kind: SyntaxKind.InterfaceParameter,
  id: IdentifierNode,
  value: Expression,
  optional: boolean
}

export interface ModelStatementNode extends Node {
  kind: SyntaxKind.ModelStatement,
  id: IdentifierNode,
  properties: ModelPropertyNode[],
  decorators: DecoratorExpressionNode[],
}

export interface ModelExpressionNode extends Node {
  kind: SyntaxKind.ModelExpression,
  properties: ModelPropertyNode[],
  decorators: DecoratorExpressionNode[],
}

export interface ArrayExpressionNode extends Node {
  kind: SyntaxKind.ArrayExpression,
  elementType: Expression
}
export interface TupleExpressionNode extends Node {
  kind: SyntaxKind.TupleExpression,
  values: Expression[]
}

export interface ModelPropertyNode extends Node {
  kind: SyntaxKind.ModelProperty,
  id: IdentifierNode | StringLiteralNode,
  value: Expression,
  decorators: DecoratorExpressionNode[],
  optional: boolean
}

export interface StringLiteralNode extends Node {
  kind: SyntaxKind.StringLiteral,
  value: string
}

export interface NumericLiteralNode extends Node {
  kind: SyntaxKind.NumericLiteral,
  value: string
}

export interface UnionExpressionNode extends Node {
  kind: SyntaxKind.UnionExpression,
  options: Expression[]
}