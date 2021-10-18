import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@azure-tools/cadl-rpaas",
  diagnostics: {
    "decorator-wrong-type": {
      severity: "error",
      messages: {
        default: "Decorator can only be applied to model types.",
        armCommonDefinition: "The @armCommonDefinition decorator can only be applied to models.",
        armCommonParameter:
          "The @armCommonParameter decorator can only be applied to model properties and operation parameters.",
        armNamespace: "The @armNamespace decorator can only be applied to namespaces.",
        armResourceOperations:
          "The @armResourceOperations decorator can only be applied to namespaces.",
        armOperation: "The @armOperation decorator can only be applied to operations.",
        armListBy: "The @armListBy decorator can only be applied to models.",
        armResource: "The @armResource decorator can only be applied to models.",
      },
    },
    "decorator-param-wrong-type": {
      severity: "error",
      messages: {
        armResource: "The parameter to @armResource must be a model expression.",
        armResourceParameterType:
          "The @armResource decorator only accepts model types for the resource parameter type.",
        armResourceStandardOperation: "Standard operation value must be a string",
        armResourceResourceProperty: "Resource property type must be a model type.",
      },
    },
    "arm-resource-operations-with-resource-path": {
      severity: "error",
      messages: {
        default:
          "The @armResourceOperations decorator can only be used for resource types that have an @armResourcePath configured.",
      },
    },
    "arm-resource-missing-arm-namespace": {
      severity: "error",
      messages: {
        default:
          "The @armNamespace decorator must be used to define the ARM namespace of the service.  This is best applied to the file-level namespace.",
      },
    },
    "arm-resource-missing": {
      severity: "error",
      messages: {
        default: paramMessage`No @armResource registration found for type ${"type"}`,
      },
    },
    "decorator-in-namespace": {
      severity: "error",
      messages: {
        default: paramMessage`The @${"decoratorName"} decorator can only be applied to an operation that is defined inside of a namespace.`,
      },
    },
    "arm-operation-in-namespace-with-resource-operations": {
      severity: "error",
      messages: {
        default:
          "The @armOperation decorator can only be applied to an operation that is defined inside of a namespace marked with @armResourceOperations.",
      },
    },
    "decorator-with-resource-path": {
      severity: "error",
      messages: {
        default: paramMessage`The @${"decoratorName"} decorator can only be applied to a resource type with a resource path.`,
      },
    },
    "unknown-std-operation": {
      severity: "error",
      messages: {
        default: paramMessage`The standard operation type '${"operation"}' is unknown.`,
      },
    },
    "list-operation-with-resource-path": {
      severity: "error",
      messages: {
        default: "List operations can only be created for a resource type with a resource path.",
      },
    },
    "parameter-in-resource": {
      severity: "error",
      messages: {
        default: "Parameter type not a part of the resource",
      },
    },
    "tracked-resource-provisioning-state": {
      severity: "error",
      messages: {
        missing:
          "A TrackedResource must have a 'provisioningState' property of type 'enum' to track the provisioningState of the last operation. The enum must include values 'Failed', 'Succeeded', and 'Canceled'.",
        wrongType: paramMessage`The enum type '${"name"}' must also contain the following provisioning states: ${"missingStates"}.`,
      },
    },
    "path-parameter-type": {
      severity: "error",
      messages: {
        default: "Path parameter type must be a model.",
        singleProp: "Path parameter type must have exactly one property.",
        string: "Path parameter type must be a string.",
      },
    },
    "missing-required-prop": {
      severity: "error",
      messages: {
        default: paramMessage`Resource configuration is missing required '${"propertyName"}' property`,
      },
    },
    "invalid-type-prop": {
      severity: "error",
      messages: {
        default: paramMessage`Property value type ${"type"} is not the expected ${"valueType"}`,
      },
    },
    "parent-type": {
      severity: "error",
      messages: {
        missingResourcePath: "Parent type has no resource path parameter specified",
        missingResourceName: "Parent type has no resource name parameter specified",
      },
    },
    "documentation-different-with-node-name": {
      severity: "warning",
      messages: {
        default: "The documentation should not be the same as the node name.",
      },
    },
  },
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
