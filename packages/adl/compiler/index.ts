export * from "../lib/decorators.js";
export * from "./diagnostics.js";
export * from "./parser.js";
export * from "./program.js";
export * from "./types.js";

import * as formatter from "../formatter/index.js";
export const ADLPrettierPlugin = formatter;
