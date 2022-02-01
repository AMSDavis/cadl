import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@azure-tools/cadl-rpaas-controller",
  diagnostics: {
    "no-union": {
      severity: "error",
      messages: {
        default: "RPaaS types may not use unions",
      },
    },
    "creating-file": {
      severity: "error",
      messages: {
        default: paramMessage`Error creating single file: ${"filename"},  ${"error"}`,
      },
    },
    "writing-file": {
      severity: "error",
      messages: {
        default: paramMessage`Error writing single file: ${"filename"},  ${"error"}`,
      },
    },
    "cleaning-dir": {
      severity: "error",
      messages: {
        default: paramMessage`Error cleaning output directory:  ${"error"}`,
      },
    },
    "creating-dir": {
      severity: "error",
      messages: {
        default: paramMessage`Error creating output directory:  ${"error"}`,
      },
    },
    "copy-files": {
      severity: "error",
      messages: {
        default: paramMessage`Error copying model files: ${"error"}`,
      },
    },
    "generating-resource": {
      severity: "error",
      messages: {
        default: paramMessage`Error generating resource: ${"namespace"}.${"resourceName"}, ${"error"}`,
      },
    },
    "generating-model": {
      severity: "error",
      messages: {
        default: paramMessage`Error generating model: ${"namespace"}.${"modelName"}, ${"error"}`,
      },
    },
    "invalid-response": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid response for operation: ${"operationName"}`,
      },
    },
    "invalid-identifier": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid identifier '${"identifier"}' in ${"location"}`,
      },
    },
    "missing-type-parent": {
      severity: "error",
      messages: {
        default: paramMessage`No parent found for ${"type"} ${"name"} `,
      },
    },
    fstat: {
      severity: "error",
      messages: {
        default: paramMessage`fstat error: ${"error"}`,
      },
    },
  },
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
