import { $asyncOperationOptions } from "@azure-tools/cadl-autorest";
import {
  $tag,
  $visibility,
  DecoratorContext,
  getDoc,
  getIntrinsicModelName,
  getKeyName,
  getPropertyType,
  getTags,
  ModelType,
  OperationType,
  Program,
  Type,
  validateDecoratorParamType,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { $autoRoute, getSegment } from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";
import { getArmNamespace } from "./namespace.js";

const ExpectedProvisioningStates = ["Succeeded", "Failed", "Canceled"];

interface ResourceOperations {
  resourceInfo: ArmResourceInfo;
  operations: OperationType[];
}

export interface ParameterInfo {
  name: string;
  typeName: string;
  resourceType?: Type;
  description?: string;
}

function getPathParameterInfo(
  program: Program,
  paramType: Type,
  resourceType?: Type
): ParameterInfo | undefined {
  if (paramType.kind !== "Model") {
    reportDiagnostic(program, { code: "path-parameter-type", target: paramType });
    return undefined;
  }

  if (paramType.properties.size !== 1) {
    reportDiagnostic(program, {
      code: "path-parameter-type",
      messageId: "singleProp",
      target: paramType,
    });
    return undefined;
  }

  const paramName: string = paramType.properties.keys().next().value;
  const propType = paramType.properties.get(paramName);
  if (
    propType === undefined ||
    getIntrinsicModelName(program, getPropertyType(propType)) !== "string"
  ) {
    reportDiagnostic(program, {
      code: "path-parameter-type",
      messageId: "string",
      target: propType!,
    });

    return undefined;
  }

  return {
    name: paramName!,
    typeName: paramType.name,
    description: propType ? getDoc(program, propType) : "",
    resourceType,
  };
}

function getPathParameters(program: Program, pathParameters: Type[]): ParameterInfo[] {
  const parameters = [];
  for (const p of pathParameters) {
    const info = getPathParameterInfo(program, p);
    if (info) {
      parameters.push(info);
    }
  }
  return parameters;
}

type ResourceKind = "Tracked" | "Proxy" | "Extension" | "Plain";

export interface ArmResourcePath {
  path: string;
  parameters: ParameterInfo[];
}

export interface ArmResourceInfo {
  armNamespace: string;
  resourceType: ModelType;
  resourceTypeName: string;
  resourceModelName: string;
  resourceKeyName: string;
}

export interface ArmResourceInfoOld {
  armNamespace: string;
  parentNamespace: string;
  resourceModelName: string;
  resourceTypeName: string;
  resourceListModelName: string;
  resourceKind: ResourceKind;
  collectionName: string;
  standardOperations: string[];
  propertiesType?: ModelType;
  resourceNameParam?: ParameterInfo;
  parentResourceType?: Type;
  resourcePath?: ArmResourcePath;
  operationNamespaces: Set<string>;
}

const armResourceNamespacesKey = Symbol();
export function getArmResources(program: Program): ModelType[] {
  return Array.from(program.stateMap(armResourceNamespacesKey).keys()) as ModelType[];
}

export function getArmResourceInfo(
  program: Program,
  resourceType: Type
): ArmResourceInfo | undefined {
  if (!validateDecoratorTarget(program, resourceType, "@arm", "Model")) {
    return undefined;
  }

  const resourceInfo = program.stateMap(armResourceNamespacesKey).get(resourceType);

  if (!resourceInfo) {
    reportDiagnostic(program, {
      code: "arm-resource-missing",
      format: { type: resourceType.name },
      target: resourceType,
    });
  }

  return resourceInfo;
}

function getRequiredPropertyValue<TValue extends Type>(
  program: Program,
  model: ModelType,
  propertyName: string,
  valueKind: string
): TValue | undefined {
  const value = getPropertyValue<TValue>(program, model, propertyName, valueKind);

  if (!value) {
    reportDiagnostic(program, {
      code: "missing-required-prop",
      format: { propertyName },
      target: model,
    });
  }

  return value;
}

function getPropertyValue<TValue extends Type>(
  program: Program,
  model: ModelType,
  propertyName: string,
  valueKind: string
): TValue | undefined {
  const prop = model.properties.get(propertyName);

  if (prop) {
    if (prop.type.kind === valueKind) {
      return prop.type as TValue;
    } else {
      reportDiagnostic(program, {
        code: "invalid-type-prop",
        format: { type: prop.type.kind, valueType: valueKind },
        target: prop.type,
      });
    }
  }

  return undefined;
}

/**
 * This decorator is used to identify ARM resource types and extract their
 * metadata.  It is *not* meant to be used directly by a spec author, it instead
 * gets implicitly applied when the spec author defines a model type in this form:
 *
 *   model Server is TrackedResource<ServerProperties>;
 *
 * The TrackedResource<T> type (and other associated base types) use the @armResource
 * decorator, so it also gets applied to the type which absorbs the TrackedResource<T>
 * definition by using the `is` keyword.
 */
export function $armResourceInternal(
  context: DecoratorContext,
  resourceType: Type,
  propertiesType: Type
) {
  const { program } = context;

  // If the properties type is a template parameter, this must be a templated type
  if (propertiesType.kind === "TemplateParameter") {
    return;
  }

  if (
    !validateDecoratorTarget(program, resourceType, "@armResource", "Model") ||
    !validateDecoratorParamType(program, resourceType, propertiesType, "Model")
  ) {
    return;
  }

  const fullyQualifiedName = program.checker!.getTypeName(resourceType);
  if (fullyQualifiedName.startsWith("Azure.ResourceManager")) {
    // The @armResource decorator will be evaluated on instantiations of
    // base templated resource types like TrackedResource<SomeResource>,
    // so ignore in that case.
    return;
  }

  // The global namespace has an empty string as name
  if (!resourceType.namespace || resourceType.namespace.name === "") {
    reportDiagnostic(program, {
      code: "decorator-in-namespace",
      format: { decoratorName: "armResource" },
      target: resourceType,
    });
    return;
  }

  const resourceModelName = resourceType.name;

  // Locate the ARM namespace in the namespace hierarchy
  const armNamespace = getArmNamespace(program, resourceType.namespace);
  if (!armNamespace) {
    reportDiagnostic(program, { code: "arm-resource-missing-arm-namespace", target: resourceType });
    return;
  }

  // Ensure the resource type has defined a name property that has a segment
  const nameProperty = resourceType.properties.get("name");
  if (!nameProperty) {
    reportDiagnostic(program, { code: "arm-resource-missing-name-property", target: resourceType });
    return;
  }

  // Set the name property to be read only
  $visibility(context, nameProperty, "read");

  const resourceKeyName = getKeyName(program, nameProperty);
  if (!resourceKeyName) {
    reportDiagnostic(program, {
      code: "arm-resource-missing-name-key-decorator",
      target: resourceType,
    });
    return;
  }

  const resourceTypeName = getSegment(program, nameProperty);
  if (!resourceTypeName) {
    reportDiagnostic(program, {
      code: "arm-resource-missing-name-segment-decorator",
      target: resourceType,
    });
    return;
  }

  const armResourceInfo: ArmResourceInfo = {
    resourceType,
    resourceModelName,
    resourceTypeName,
    resourceKeyName,
    armNamespace: armNamespace ?? "",
  };

  program.stateMap(armResourceNamespacesKey).set(resourceType, armResourceInfo);
}

/**
 * This decorator is used to identify interfaces containing resource operations.
 * When applied, it marks the interface with the `@autoRoute` decorator so that
 * all of its contained operations will have their routes generated
 * automatically.
 *
 * It also adds a `@tag` decorator bearing the name of the interface so that all
 * of the operations will be grouped based on the interface name in generated
 * clients.
 */
export function $armResourceOperations(context: DecoratorContext, interfaceType: Type): void {
  const { program } = context;

  if (!validateDecoratorTarget(program, interfaceType, "@armResourceOperations", "Interface")) {
    return undefined;
  }

  // All resource interfaces should use @autoRoute
  $autoRoute(context, interfaceType);

  // If no tag is given for the interface, tag it with the interface name
  if (getTags(program, interfaceType).length === 0) {
    $tag(context, interfaceType, interfaceType.name);
  }
}

/**
 * This decorator wraps `asyncOperationOptions` because it only exists
 * in the cadl-autorest emitter library (for now).  This decorator helps
 * avoid issues where @asyncOperationOptions doesn't exist when the
 * @cadl-lang/openapi3 emitter is used.
 */
export function $armAsyncOperation(context: DecoratorContext, target: Type) {
  $asyncOperationOptions(context, target, "azure-async-operation");
}
