import { createCadlLibrary } from "@cadl-lang/compiler";

export const libDef = {
  name: "@azure-tools/cadl-azure-core",
  diagnostics: {},
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
