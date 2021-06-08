import {
  getIntrinsicType,
  isIntrinsic,
  ModelType,
  NamespaceType,
  Program,
  StringLiteralType,
  throwDiagnostic,
  TupleType,
  Type,
} from "@azure-tools/adl";
import { extension } from "@azure-tools/adl-openapi";
import { HttpOperationType } from "@azure-tools/adl-rest";
import { getArmNamespace } from "./namespace.js";
import { _generateStandardOperations } from "./operations.js";

export interface ParameterInfo {
  name: string;
  typeName: string;
  resourceType?: Type;
  description?: string;
}

function getPathParameterInfo(paramType: Type, resourceType?: Type): ParameterInfo {
  if (paramType.kind !== "Model") {
    throwDiagnostic("Path parameter type must be a model.", paramType);
  }

  if (paramType.properties.size !== 1) {
    throwDiagnostic("Path parameter type must have exactly one property.", paramType);
  }

  const paramName: string = paramType.properties.keys().next().value;
  const propType = paramType.properties.get(paramName);
  if (getIntrinsicType(propType) !== "string") {
    throwDiagnostic("Path parameter type must be a string.", propType!);
  }

  return {
    name: paramName!,
    typeName: paramType.name,
    resourceType,
  };
}

function getPathParameters(pathParameters: Type[]): ParameterInfo[] {
  return pathParameters.map((p) => getPathParameterInfo(p));
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
  resourceNameParam?: ParameterInfo;
  parentResourceType?: Type;
  resourcePath?: ArmResourcePath;
  operationNamespaces: Set<string>;
}

export function getArmResources() : Type[] {
   return [... armResourceNamespaces.keys()]; 
}

const armResourceNamespaces = new Map<Type, ArmResourceInfo>();

export function getArmResourceInfo(resourceType: Type): ArmResourceInfo {
  if (resourceType.kind !== "Model") {
    throwDiagnostic("Decorator can only be applied to model types.", resourceType);
  }

  const resourceInfo = armResourceNamespaces.get(resourceType);

  if (!resourceInfo) {
    throwDiagnostic(
      `No @armResource registration found for type ${resourceType.name}`,
      resourceType
    );
  }

  return resourceInfo;
}

function getRequiredPropertyValue<TValue extends Type>(
  model: ModelType,
  propertyName: string,
  valueKind: string
): TValue {
  const value = getPropertyValue<TValue>(model, propertyName, valueKind);

  if (!value) {
    throwDiagnostic(`Resource configuration is missing required '${propertyName}' property`, model);
  }

  return value;
}

function getPropertyValue<TValue extends Type>(
  model: ModelType,
  propertyName: string,
  valueKind: string
): TValue | undefined {
  const prop = model.properties.get(propertyName);

  if (prop) {
    if (prop.type.kind === valueKind) {
      return prop.type as TValue;
    } else {
      throwDiagnostic(
        `Property value type ${prop.type.kind} is not the expected ${valueKind}`,
        prop.type
      );
    }
  }

  return undefined;
}

export function armResource(program: Program, resourceType: Type, resourceDetails: Type) {
  if (resourceDetails.kind !== "Model") {
    throwDiagnostic("The parameter to @armResource must be a model expression.", resourceType);
  }

  if (resourceType.kind !== "Model") {
    throwDiagnostic("The @armResource decorator can only be applied to model types.", resourceType);
  }

  if (!resourceType.namespace) {
    throwDiagnostic(
      "The @armResource can only be applied to a model type that is defined in a namespace",
      resourceType
    );
  }

  const resourcePathType = getRequiredPropertyValue<StringLiteralType>(
    resourceDetails,
    "path",
    "String"
  );

  const collectionNameType = getRequiredPropertyValue<StringLiteralType>(
    resourceDetails,
    "collectionName",
    "String"
  );

  let resourceParamType: Type | undefined = getRequiredPropertyValue<ModelType>(
    resourceDetails,
    "parameterType",
    "Model"
  );

  // Special case: passing 'null' for the parameter type clears it
  if (isIntrinsic(resourceParamType) && resourceParamType.name === "null") {
    resourceParamType = undefined;
  }

  const parentResourceType = getPropertyValue<ModelType>(
    resourceDetails,
    "parentResourceType",
    "Model"
  );

  let standardOperations = ["read", "create", "update", "delete", "list"];
  const operationsValue = getPropertyValue<TupleType>(
    resourceDetails,
    "standardOperations",
    "Tuple"
  );
  if (operationsValue) {
    standardOperations = operationsValue.values.map((v) => {
      if (v.kind !== "String") {
        throwDiagnostic(`Standard operation value must be a string`, v);
      }
      return v.value;
    });
  }

  if (resourceParamType && resourceParamType.kind !== "Model") {
    throwDiagnostic(
      "The @armResource decorator only accepts model types for the resource parameter type.",
      resourceType
    );
  }

  const pathParameterTypes = getPropertyValue<TupleType>(
    resourceDetails,
    "pathParameters",
    "Tuple"
  );

  // Locate the ARM namespace in the namespace hierarchy
  let armNamespace = getArmNamespace(resourceType.namespace);
  if (!armNamespace) {
    throwDiagnostic(
      "The @armNamespace decorator must be used to define the ARM namespace of the service.  This is best applied to the file-level namespace.",
      resourceType
    );
  }

  // Create the resource model type and evaluate it
  const resourceModelName = resourceType.name;
  const resourceListModelName = `${resourceModelName}ListResult`;
  const resourceNameParam = resourceParamType
    ? getPathParameterInfo(resourceParamType, resourceType)
    : undefined;
  const parentNamespace = program.checker!.getNamespaceString(resourceType.namespace);

  // Mark the type as an Azure resource
  extension(program, resourceType, "x-ms-azure-resource", true);

  // Detect the resource type
  let resourceKind: ResourceKind = "Plain";
  if (resourceType.assignmentType) {
    const coreType = resourceType.assignmentType;
    if (coreType.kind === "Model") {
      if (coreType.name.startsWith("TrackedResource")) {
        resourceKind = "Tracked";
      } else if (coreType.name.startsWith("ProxyResource")) {
        resourceKind = "Proxy";
      } else if (coreType.name.startsWith("ExtensionResource")) {
        resourceKind = "Extension";
      }
    }
  }

  const armResourceInfo: ArmResourceInfo = {
    armNamespace,
    parentNamespace,
    resourceKind,
    collectionName: collectionNameType.value,
    parentResourceType,
    standardOperations,
    resourceNameParam,
    resourceModelName,
    resourceListModelName,
    operationNamespaces: new Set<string>(),
  };

  armResourceInfo.resourcePath = getResourcePath(
    armResourceInfo,
    resourceType,
    resourcePathType.value,
    pathParameterTypes ? pathParameterTypes.values : []
  );

  const finalPath = armResourceInfo.resourceNameParam
    ? `${armResourceInfo.resourcePath.path}/{${armResourceInfo.resourceNameParam.name}}`
    : armResourceInfo.resourcePath.path;

  // Prepare the namespace for the operation group
  program.evalAdlScript(`
      namespace ${armResourceInfo.parentNamespace} {
        @doc("The response of a ${armResourceInfo.resourceModelName} list operation.")
        model ${armResourceInfo.resourceListModelName} = Page<${armResourceInfo.resourceModelName}>;

        @resource("${finalPath}")
        @tag("${armResourceInfo.collectionName}")
        namespace ${armResourceInfo.collectionName} {
        }
      }
  `);

  armResourceNamespaces.set(resourceType, armResourceInfo);

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
  armResourceInfo: ArmResourceInfo,
  resourceType: Type,
  resourcePath: string,
  pathParameterTypes: Type[]
): ArmResourcePath {
  let armResourcePath: ArmResourcePath | undefined;
  if (armResourceInfo.parentResourceType) {
    const parentResourceInfo = getArmResourceInfo(armResourceInfo.parentResourceType);
    if (!parentResourceInfo.resourcePath) {
      throwDiagnostic("Parent type has no resource path information specified", resourceType);
    }

    if (!parentResourceInfo.resourceNameParam) {
      throwDiagnostic("Parent type has no resource name parameter specified", resourceType);
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
    parameters: getPathParameters(pathParameterTypes),
  });

  return armResourcePath;
}
