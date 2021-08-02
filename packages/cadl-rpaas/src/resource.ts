import {
  getIntrinsicType,
  isIntrinsic,
  ModelType,
  Program,
  StringLiteralType,
  TupleType,
  Type,
} from "@azure-tools/cadl";
import { getArmNamespace } from "./namespace.js";
import { _generateStandardOperations } from "./operations.js";

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
    program.reportDiagnostic("Path parameter type must be a model.", paramType);
    return undefined;
  }

  if (paramType.properties.size !== 1) {
    program.reportDiagnostic("Path parameter type must have exactly one property.", paramType);
    return undefined;
  }

  const paramName: string = paramType.properties.keys().next().value;
  const propType = paramType.properties.get(paramName);
  if (getIntrinsicType(program, propType) !== "string") {
    program.reportDiagnostic("Path parameter type must be a string.", propType!);
    return undefined;
  }

  return {
    name: paramName!,
    typeName: paramType.name,
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
  parentNamespace: string;
  resourceModelName: string;
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
export function getArmResources(program: Program): Type[] {
  return Array.from(program.stateMap(armResourceNamespacesKey).keys()).map((r) => <Type>r);
}

export function getArmResourceInfo(
  program: Program,
  resourceType: Type
): ArmResourceInfo | undefined {
  if (resourceType.kind !== "Model") {
    program.reportDiagnostic("Decorator can only be applied to model types.", resourceType);
    return undefined;
  }

  const resourceInfo = program.stateMap(armResourceNamespacesKey).get(resourceType);

  if (!resourceInfo) {
    program.reportDiagnostic(
      `No @armResource registration found for type ${resourceType.name}`,
      resourceType
    );
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
    program.reportDiagnostic(
      `Resource configuration is missing required '${propertyName}' property`,
      model
    );
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
      program.reportDiagnostic(
        `Property value type ${prop.type.kind} is not the expected ${valueKind}`,
        prop.type
      );
    }
  }

  return undefined;
}

export function armResource(program: Program, resourceType: Type, resourceDetails: Type) {
  if (resourceDetails.kind !== "Model") {
    program.reportDiagnostic(
      "The parameter to @armResource must be a model expression.",
      resourceType
    );
    return;
  }

  if (resourceType.kind !== "Model") {
    program.reportDiagnostic(
      "The @armResource decorator can only be applied to model types.",
      resourceType
    );
    return;
  }

  if (!resourceType.namespace) {
    program.reportDiagnostic(
      "The @armResource can only be applied to a model type that is defined in a namespace",
      resourceType
    );
    return;
  }

  const resourcePathType = getRequiredPropertyValue<StringLiteralType>(
    program,
    resourceDetails,
    "path",
    "String"
  );

  const collectionNameType = getRequiredPropertyValue<StringLiteralType>(
    program,
    resourceDetails,
    "collectionName",
    "String"
  );

  let resourceParamType: Type | undefined = getRequiredPropertyValue<ModelType>(
    program,
    resourceDetails,
    "parameterType",
    "Model"
  );

  // Special case: passing 'null' for the parameter type clears it
  if (isIntrinsic(program, resourceParamType) && resourceParamType?.name === "null") {
    resourceParamType = undefined;
  }

  const parentResourceType = getPropertyValue<ModelType>(
    program,
    resourceDetails,
    "parentResourceType",
    "Model"
  );

  let standardOperations = ["read", "create", "update", "delete", "list"];
  const operationsValue = getPropertyValue<TupleType>(
    program,
    resourceDetails,
    "standardOperations",
    "Tuple"
  );

  if (operationsValue) {
    standardOperations = operationsValue.values.map((v) => {
      if (v.kind !== "String") {
        program.reportDiagnostic(`Standard operation value must be a string`, v);
        return "";
      }
      return v.value;
    });
  }

  if (resourceParamType && resourceParamType.kind !== "Model") {
    program.reportDiagnostic(
      "The @armResource decorator only accepts model types for the resource parameter type.",
      resourceType
    );
    return;
  }

  const pathParameterTypes = getPropertyValue<TupleType>(
    program,
    resourceDetails,
    "pathParameters",
    "Tuple"
  );

  // Locate the ARM namespace in the namespace hierarchy
  let armNamespace = getArmNamespace(program, resourceType.namespace);
  if (!armNamespace) {
    program.reportDiagnostic(
      "The @armNamespace decorator must be used to define the ARM namespace of the service.  This is best applied to the file-level namespace.",
      resourceType
    );
    return;
  }

  // Create the resource model type and evaluate it
  const resourceModelName = resourceType.name;
  const resourceListModelName = `${resourceModelName}ListResult`;
  const resourceNameParam = resourceParamType
    ? getPathParameterInfo(program, resourceParamType, resourceType)
    : undefined;
  const parentNamespace = program.checker!.getNamespaceString(resourceType.namespace);

  // Detect the resource and properties types
  let resourceKind: ResourceKind = "Plain";
  let propertiesType: ModelType | undefined = undefined;
  if (resourceType.baseModels.length === 1) {
    const coreType = resourceType.baseModels[0];
    if (coreType.kind === "Model") {
      if (coreType.name.startsWith("TrackedResource")) {
        resourceKind = "Tracked";
      } else if (coreType.name.startsWith("ProxyResource")) {
        resourceKind = "Proxy";
      } else if (coreType.name.startsWith("ExtensionResource")) {
        resourceKind = "Extension";
      }

      // Also extract the properties type while we're at it.
      const propertiesProperty = coreType.properties.get("properties");
      if (propertiesProperty) {
        if (propertiesProperty.type.kind === "Model") {
          propertiesType = propertiesProperty.type;
        } else {
          program.reportDiagnostic("Resource property type must be a model type.", resourceType);
        }
      }
    }
  }

  const armResourceInfo: ArmResourceInfo = {
    armNamespace: armNamespace ?? "",
    parentNamespace,
    resourceKind,
    propertiesType,
    collectionName: collectionNameType?.value ?? "",
    parentResourceType,
    standardOperations,
    resourceNameParam,
    resourceModelName,
    resourceListModelName,
    operationNamespaces: new Set<string>(),
  };

  armResourceInfo.resourcePath = getResourcePath(
    program,
    armResourceInfo,
    resourceType,
    resourcePathType?.value,
    pathParameterTypes ? pathParameterTypes.values : []
  );

  program.stateMap(armResourceNamespacesKey).set(resourceType, armResourceInfo);
  const finalPath = armResourceInfo.resourceNameParam
    ? `${armResourceInfo.resourcePath?.path}/{${armResourceInfo.resourceNameParam.name}}`
    : armResourceInfo.resourcePath?.path;

  // Prepare the namespace for the operation group
  program.evalCadlScript(`
      namespace ${armResourceInfo.parentNamespace} {
        @doc("The response of a ${armResourceInfo.resourceModelName} list operation.")
        model ${armResourceInfo.resourceListModelName} extends Page<${armResourceInfo.resourceModelName}> { };

        @resource("${finalPath}")
        @tag("${armResourceInfo.collectionName}")
        namespace ${armResourceInfo.collectionName} {
        }
      }
  `);

  _generateStandardOperations(program, resourceType, armResourceInfo.standardOperations);
}

function getDefaultResourcePath(resourceInfo: ArmResourceInfo): ArmResourcePath {
  if (resourceInfo.resourceKind === "Extension") {
    return {
      path: `/{resourceUri}/providers/${resourceInfo.armNamespace}`,
      parameters: [
        {
          name: "resourceUri",
          typeName: "ResourceUriParameter",
        },
      ],
    };
  } else {
    return {
      path: `/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/${resourceInfo.armNamespace}`,
      parameters: [
        {
          name: "subscriptionId",
          typeName: "SubscriptionIdParameter",
        },
        {
          name: "resourceGroupName",
          typeName: "ResourceGroupNameParameter",
        },
      ],
    };
  }
}

function appendResourcePath(basePath: ArmResourcePath, newPath: ArmResourcePath): void {
  basePath.path = basePath.path.length > 0 ? `${basePath.path}/${newPath.path}` : newPath.path;
  basePath.parameters = [...basePath.parameters, ...newPath.parameters];
}

function getResourcePath(
  program: Program,
  armResourceInfo: ArmResourceInfo,
  resourceType: Type,
  resourcePath: string | undefined,
  pathParameterTypes: Type[]
): ArmResourcePath | undefined {
  if (!resourcePath) {
    return undefined;
  }

  let armResourcePath: ArmResourcePath | undefined;
  if (armResourceInfo.parentResourceType) {
    const parentResourceInfo = getArmResourceInfo(program, armResourceInfo.parentResourceType);
    if (!parentResourceInfo) {
      return undefined;
    }
    if (!parentResourceInfo.resourcePath) {
      program.reportDiagnostic(
        "Parent type has no resource path information specified",
        resourceType
      );
      return undefined;
    }

    if (!parentResourceInfo.resourceNameParam) {
      program.reportDiagnostic(
        "Parent type has no resource name parameter specified",
        resourceType
      );
      return undefined;
    }

    armResourcePath = {
      path: `${parentResourceInfo.resourcePath.path}/{${parentResourceInfo.resourceNameParam.name}}`,
      parameters: [
        ...parentResourceInfo.resourcePath.parameters,
        parentResourceInfo.resourceNameParam,
      ],
    };
  } else if (resourcePath[0] !== "/") {
    armResourcePath = getDefaultResourcePath(armResourceInfo);
  } else {
    armResourcePath = {
      path: "",
      parameters: [],
    };
  }

  appendResourcePath(armResourcePath, {
    path: resourcePath,
    parameters: getPathParameters(program, pathParameterTypes),
  });

  return armResourcePath;
}
