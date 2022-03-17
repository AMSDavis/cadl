import {
  $tag,
  $visibility,
  DecoratorContext,
  getKeyName,
  getTags,
  ModelType,
  Program,
  Type,
  validateDecoratorParamType,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { $autoRoute, getSegment } from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";
import { getArmNamespace } from "./namespace.js";
import { ArmResourceOperations, resolveResourceOperations } from "./operations.js";

const ExpectedProvisioningStates = ["Succeeded", "Failed", "Canceled"];

export type ArmResourceKind = "Tracked" | "Proxy" | "Extension";

export interface ArmResourceDetailsBase {
  name: string;
  kind: ArmResourceKind;
  armNamespace: string;
  keyName: string;
  collectionName: string;
  cadlType: ModelType;
}

export interface ArmResourceDetails extends ArmResourceDetailsBase {
  operations: ArmResourceOperations;
}

const armResourcesKey = Symbol();
const armResourcesCachedKey = Symbol();

function resolveArmResourceDetails(
  program: Program,
  resource: ArmResourceDetailsBase
): ArmResourceDetails {
  // Combine fully-resolved operation details with the base details we already have
  return {
    ...resource,
    operations: resolveResourceOperations(program, resource.cadlType),
  };
}

/**
 *  This function returns fully-resolved details about all ARM resources
 *  registered in the Cadl document including operations and their details.
 *
 *  It should only be called after the full Cadl document has been compiled
 *  so that operation route details are certain to be present.
 */
export function getArmResources(program: Program): ArmResourceDetails[] {
  // Have we cached the resolved resource details already?
  const cachedResources = program.stateMap(armResourcesCachedKey);
  if (cachedResources.size > 0) {
    // Return the cached resource details
    return Array.from(program.stateMap(armResourcesCachedKey).values()) as ArmResourceDetails[];
  }

  // We haven't generated the full resource details yet
  const resources: ArmResourceDetails[] = [];
  for (const resource of program.stateMap(armResourcesKey).values()) {
    const fullResource = resolveArmResourceDetails(program, resource);
    cachedResources.set(resource.cadlType, fullResource);
    resources.push(fullResource);
  }

  return resources;
}

export function getArmResource(
  program: Program,
  resourceType: ModelType
): ArmResourceDetails | undefined {
  return program.stateMap(armResourcesKey).get(resourceType);
}

export function getArmResourceInfo(
  program: Program,
  resourceType: Type
): ArmResourceDetails | undefined {
  if (!validateDecoratorTarget(program, resourceType, "@arm", "Model")) {
    return undefined;
  }

  const resourceInfo = program.stateMap(armResourcesKey).get(resourceType);

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

function getArmResourceKind(resourceType: ModelType): ArmResourceKind | undefined {
  if (resourceType.baseModel) {
    const coreType = resourceType.baseModel;
    if (coreType.name.startsWith("TrackedResource")) {
      return "Tracked";
    } else if (coreType.name.startsWith("ProxyResource")) {
      return "Proxy";
    } else if (coreType.name.startsWith("ExtensionResource")) {
      return "Extension";
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

  const keyName = getKeyName(program, nameProperty);
  if (!keyName) {
    reportDiagnostic(program, {
      code: "arm-resource-missing-name-key-decorator",
      target: resourceType,
    });
    return;
  }

  const collectionName = getSegment(program, nameProperty);
  if (!collectionName) {
    reportDiagnostic(program, {
      code: "arm-resource-missing-name-segment-decorator",
      target: resourceType,
    });
    return;
  }

  const kind = getArmResourceKind(resourceType);

  if (!kind) {
    reportDiagnostic(program, {
      code: "arm-resource-missing-name-segment-decorator",
      target: resourceType,
    });

    return;
  }

  const armResourceDetails: ArmResourceDetails = {
    name: resourceType.name,
    kind,
    cadlType: resourceType,
    collectionName,
    keyName,
    armNamespace: armNamespace ?? "",
    operations: {
      lifecycle: {},
      lists: {},
      actions: {},
    },
  };

  program.stateMap(armResourcesKey).set(resourceType, armResourceDetails);
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
