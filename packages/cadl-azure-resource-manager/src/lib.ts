import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@azure-tools/cadl-azure-resoource-manager",
  diagnostics: {
    "decorator-param-wrong-type": {
      severity: "error",
      messages: {
        armNamespace: "The parameter to @armResource must be a namespace.",
        armResource: "The parameter to @armResource must be a model expression.",
        armResourceParameterType:
          "The @armResource decorator only accepts model types for the resource parameter type.",
        armResourceStandardOperation: "Standard operation value must be a string",
        armResourceResourceProperty: "Resource property type must be a model type.",
        armUpdateProviderNamespace:
          "The parameter to @armUpdateProviderNamespace must be an operation with a 'provider' parameter.",
        assignProviderNameValueTargetType:
          "The type of the parameter to which @assignProviderNameValue is applied must be 'string'.",
        assignProviderNameValueResourceType:
          "The second parameter @assignProviderNameValue must be a model type that represents a resource.",
      },
    },
    "arm-resource-operations-with-resource-path": {
      severity: "error",
      messages: {
        default:
          "The @armResourceOperations decorator can only be used for resource types that have an @armResourcePath configured.",
      },
    },
    "arm-resource-missing-name-property": {
      severity: "error",
      messages: {
        default: "Resource types must include a string property called 'name'.",
      },
    },
    "arm-resource-missing-name-key-decorator": {
      severity: "error",
      messages: {
        default:
          "Resource type 'name' property must have a @key decorator which defines its key name.",
      },
    },
    "arm-resource-missing-name-segment-decorator": {
      severity: "error",
      messages: {
        default:
          "Resource type 'name' property must have a @segment decorator which defines its path fragment.",
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
    "no-underscore-in-operation-name": {
      severity: "warning",
      messages: {
        default:
          "The operation name should not contain underscore, or it will produce invalid operationId in the generated swagger.",
      },
    },
    "no-repeated-resource-in-operation": {
      severity: "warning",
      messages: {
        default: paramMessage`The operation name should not repeat the resource name '${"resourceModelName"}'.`,
      },
    },
    "no-inline-model": {
      severity: "warning",
      messages: {
        default:
          "Inline models cannot be represented in many languages. Using this pattern can result in bad auto naming. ",
      },
    },
    "model-requires-documentation": {
      severity: "warning",
      messages: {
        default:
          "The model must have a documentation or description, please use decorator @doc to add it.",
      },
    },
    "property-requires-documentation": {
      severity: "warning",
      messages: {
        default:
          "The property must have a documentation or description, please use decorator @doc to add it.",
      },
    },
    "operation-requires-documentation": {
      severity: "warning",
      messages: {
        default:
          "The operation must have a documentation or description, please use decorator @doc to add it.",
      },
    },
    "documentation-different-with-node-name": {
      severity: "warning",
      messages: {
        default: "The documentation should not be the same as the node name.",
      },
    },
    "no-repeated-property-inside-the-properties": {
      severity: "warning",
      messages: {
        default: "Top level properties should not be repeated inside the properties bag.",
      },
    },
    "resource-top-level-properties": {
      severity: "warning",
      messages: {
        default:
          "Top level properties should be one of name, type, id, location, properties, tags, plan, sku, etag, managedBy, identity, systemData, extendedlocation.",
      },
    },
    "resource-extends-base-models": {
      severity: "warning",
      messages: {
        default:
          "The resource model should either extends the TrackedResource,ProxyResource,ExtensionResource or extends one of the base models: TrackedResourceBase,ProxyResourceBase.",
      },
    },
  },
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
