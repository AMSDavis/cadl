import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

const libDef = {
  name: "@azure-tools/cadl-autorest",
  diagnostics: {
    "decorator-wrong-type": {
      severity: "error",
      messages: {
        default: paramMessage`Cannot apply ${"decoratorName"} decorator to ${"entityKind"}`,
        modelsOperations: paramMessage`${"decoratorName"} decorator can only be applied to models and operation parameters.`,
      },
    },
    "security-service-namespace": {
      severity: "error",
      messages: {
        default: "Cannot add security details to a namespace other than the service namespace.",
      },
    },
    "resource-namespace": {
      severity: "error",
      messages: {
        default: "Resource goes on namespace",
      },
    },
    "missing-path-param": {
      severity: "error",
      messages: {
        default: paramMessage`Path contains parameter ${"param"} but wasn't found in given parameters`,
      },
    },
    "duplicate-body": {
      severity: "error",
      messages: {
        default: "Duplicate @body declarations on response type",
      },
    },
    "duplicate-body-types": {
      severity: "error",
      messages: {
        default: "Request has multiple body types",
      },
    },
    "duplicate-status-code": {
      severity: "error",
      messages: {
        default: "Duplicate @statusCode declarations on response type",
      },
    },
    "content-type-string": {
      severity: "error",
      messages: {
        default: "contentType parameter must be a string or union of strings",
        unionOfString: "The contentType property union must contain only string values",
      },
    },
    "invalid-schema": {
      severity: "error",
      messages: {
        default: paramMessage`Couldn't get schema for type ${"type"}`,
      },
    },
    "union-null": {
      severity: "error",
      messages: {
        default: "Cannot have a union containing only null types.",
      },
    },
    "union-unsupported": {
      severity: "error",
      messages: {
        default:
          "Unions cannot be emitted to OpenAPI v2 unless all options are literals of the same type.",
        null: "Unions containing multiple model types cannot be emitted to OpenAPI v2 unless the union is between one model type and 'null'.",
      },
    },
    discriminator: {
      severity: "error",
      messages: {
        duplicate: paramMessage`Discriminator value "${"val"}" defined in two different variants: ${"model1"} and ${"model2"}`,
        missing: "The discriminator property is not defined in a variant of a discriminated union.",
        required: "the discriminator property must be a required property.",
        type: "the discriminator property must be type 'string'.",
      },
    },
    "discriminator-value": {
      severity: "warning",
      messages: {
        literal:
          "Each variant of a discriminated union should define the discriminator property with a string literal value.",
      },
    },
    "invalid-default": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid type '${"type"}' for a default value`,
      },
    },
  },
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
