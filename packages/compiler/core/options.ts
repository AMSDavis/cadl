import { LogLevel } from "./types";

export interface CompilerOptions {
  miscOptions?: any;
  outputPath?: string;
  swaggerOutputFile?: string;
  nostdlib?: boolean;
  noEmit?: boolean;
  additionalImports?: string[];
  watchForChanges?: boolean;
  serviceCodePath?: string;
  diagnosticLevel?: LogLevel;
  /**
   * When true, indicates that a compilation is being performed for live
   * analysis in the language server.
   */
  designTimeBuild?: boolean;
}