import {
  getDoc,
  getIntrinsicType,
  isIntrinsic,
  ModelType,
  Program,
  StringLiteralType,
  TupleType,
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";
import { getArmNamespace } from "./namespace.js";
import { generateStandardOperations } from "./operations.js";

const ExpectedProvisioningStates = ["Succeeded", "Failed", "Canceled"];

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
  if (getIntrinsicType(program, propType)?.name !== "string") {
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
export function getArmResources(program: Program): Type[] {
  return Array.from(program.stateMap(armResourceNamespacesKey).keys()).map((r) => <Type>r);
}

export function getArmResourceInfo(
  program: Program,
  resourceType: Type
): ArmResourceInfo | undefined {
  if (resourceType.kind !== "Model") {
    reportDiagnostic(program, { code: "decorator-wrong-type", target: resourceType });
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

export function $armResource(program: Program, resourceType: Type, resourceDetails: Type) {
  if (resourceDetails.kind !== "Model") {
    reportDiagnostic(program, {
      code: "decorator-param-wrong-type",
      messageId: "armResource",
      target: resourceType,
    });
    return;
  }

  if (resourceType.kind !== "Model") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      messageId: "armResource",
      target: resourceType,
    });
    return;
  }

  if (!resourceType.namespace) {
    reportDiagnostic(program, {
      code: "decorator-in-namespace",
      format: { decoratorName: "armResource" },
      target: resourceType,
    });
    return;
  }

  if (resourceType.name.includes("_")) {
    reportDiagnostic(program, { code: "no-underscore-in-operation-name", target: resourceType });
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
        reportDiagnostic(program, {
          code: "decorator-param-wrong-type",
          messageId: "armResourceStandardOperation",
          target: resourceType,
        });
        return "";
      }
      return v.value;
    });
  }

  if (resourceParamType && resourceParamType.kind !== "Model") {
    reportDiagnostic(program, {
      code: "decorator-param-wrong-type",
      messageId: "armResourceParameterType",
      target: resourceType,
    });
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
    reportDiagnostic(program, { code: "arm-resource-missing-arm-namespace", target: resourceType });
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

  if (resourceType.baseModel) {
    const coreType = resourceType.baseModel;
    if (coreType.kind === "Model") {
      // There are two possibilities here:
      // 1. Resource defined with `model is`, look for `properties` property
      // 2. Resource defined with `model extends`, look for properties type in template args
      if (coreType.templateArguments?.length === 1) {
        propertiesType = coreType.templateArguments?.[0] as ModelType;
      } else {
        const propertiesProperty = resourceType.properties?.get("properties");
        propertiesType = propertiesProperty?.type as ModelType;
      }

      if (!propertiesType || propertiesType.kind !== "Model") {
        reportDiagnostic(program, {
          code: "decorator-param-wrong-type",
          messageId: "armResourceResourceProperty",
          target: resourceType,
        });
      }

      // This will find either TrackedResource<T> or TrackedResourceBase
      if (coreType.name.startsWith("TrackedResource")) {
        const provisioningStateProperty = propertiesType.properties.get("provisioningState");
        if (!provisioningStateProperty || provisioningStateProperty.type.kind !== "Enum") {
          reportDiagnostic(program, {
            code: "tracked-resource-provisioning-state",
            messageId: "missing",
            target: resourceType,
          });
          return;
        }

        // Check the enum for the mandatory provisioning state values
        const enumValues = new Set(provisioningStateProperty.type.members.map((m) => m.name));
        const missingStates = ExpectedProvisioningStates.filter((v) => !enumValues.has(v));
        if (missingStates.length > 0) {
          reportDiagnostic(program, {
            code: "tracked-resource-provisioning-state",
            messageId: "wrongType",
            format: {
              name: provisioningStateProperty.type.name,
              missingStates: missingStates.join(","),
            },
            target: resourceType,
          });
          return;
        }

        resourceKind = "Tracked";
      } else if (coreType.name.startsWith("ProxyResource")) {
        resourceKind = "Proxy";
      } else if (coreType.name.startsWith("ExtensionResource")) {
        resourceKind = "Extension";
      }
    }
  }
  if (resourceKind === "Plain") {
    reportDiagnostic(program, { code: "resource-extends-base-models", target: resourceType });
  }

  const armResourceInfo: ArmResourceInfo = {
    armNamespace: armNamespace ?? "",
    parentNamespace,
    resourceKind,
    propertiesType,
    collectionName: collectionNameType?.value ?? "",
    parentResourceType,
    standardOperations,
    resourceTypeName: resourcePathType?.value ?? "",
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
      using Azure.ARM;
      using Cadl.Http;
      namespace ${armResourceInfo.parentNamespace} {
        @doc("The response of a ${armResourceInfo.resourceModelName} list operation.")
        model ${armResourceInfo.resourceListModelName} extends Page<${armResourceInfo.resourceModelName}> { };

        @route("${finalPath}")
        @tag("${armResourceInfo.collectionName}")
        namespace ${armResourceInfo.collectionName} {
        }
      }
  `);

  generateStandardOperations(program, resourceType, armResourceInfo.standardOperations);
}

function getDefaultResourcePath(resourceInfo: ArmResourceInfo): ArmResourcePath {
  if (resourceInfo.resourceKind === "Extension") {
    return {
      path: `/{resourceUri}/providers/${resourceInfo.armNamespace}`,
      parameters: [
        {
          name: "resourceUri",
          typeName: "ResourceUriParameter",
          description: "The uri of the target resource",
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
          description: "The subscription containing the resource.",
        },
        {
          name: "resourceGroupName",
          typeName: "ResourceGroupNameParameter",
          description: "The resource group containing the resource.",
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
      reportDiagnostic(program, {
        code: "parent-type",
        messageId: "missingResourcePath",
        target: resourceType,
      });
      return undefined;
    }

    if (!parentResourceInfo.resourceNameParam) {
      reportDiagnostic(program, {
        code: "parent-type",
        messageId: "missingResourceName",
        target: resourceType,
      });
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
