export const namespace = "Azure.ARM";

export * from "./commonTypes.js";
export * from "./namespace.js";
export * from "./operations.js";
export * from "./resource.js";

import { Program } from "@cadl-lang/compiler";
import { runChecker } from "./checker.js";

export async function $onBuild(p: Program) {
  if (p.compilerOptions.onBuildCheck) {
    runChecker(p);
  }
}
