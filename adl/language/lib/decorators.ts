import { Program } from "../compiler/program";
import { Type } from "../compiler/types";

const desc = new Map<Type, string>();

export function description(program: Program, target: Type, text: string) {
  desc.set(target, text);
}

export function getDescription(target: Type) {
  return desc.get(target);
}

export function inspectType(program: Program, target: Type, text: string) {
  if (text) console.log(text);
  console.dir(target, { depth: 3 });
}

export function inspectTypeName(program: Program, target: Type, text: string) {
  if (text) console.log(text);
  console.log(program.checker!.getTypeName(target));
}

const intrinsics = new Set<Type>();
export function intrinsic(program: Program, target: Type) {
  intrinsics.add(target);
}

export function isIntrinsic(target: Type) {
  return intrinsics.has(target);
}
