import { Doc, FastPath, ParserOptions } from "prettier";
import { DecoratorExpressionNode, Node } from "../../compiler/types.js";

export interface ADLPrettierOptions extends ParserOptions {}

export type PrettierChildPrint = (path: FastPath<Node>, index?: number) => Doc;

export interface DecorableNode {
  decorators: DecoratorExpressionNode[];
}

type Union =
  | { foo: string }
  | { bar: string }
  | { bar: string }
  | { bar: string }
  | { bar: string };
type Inter = { foo: string } & { bar: string } & { bar: string } & { bar: string } & {
  bar: string;
};
