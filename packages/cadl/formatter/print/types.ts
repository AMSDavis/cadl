import { Doc, FastPath, ParserOptions } from "prettier";
import { DecoratorExpressionNode, Node } from "../../compiler/types.js";

export interface CadlPrettierOptions extends ParserOptions {}

export type PrettierChildPrint = (path: FastPath<Node>, index?: number) => Doc;

export interface DecorableNode {
  decorators: DecoratorExpressionNode[];
}
