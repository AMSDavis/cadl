import {
  DecoratorContext,
  ModelType,
  NamespaceType,
  Program,
  Type,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { $route } from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";
import { ArmResourceInfo, getArmResourceInfo, ParameterInfo } from "./resource.js";

type StandardOperationGenerator = (
  program: Program,
  target: ModelType,
  documentation?: string
) => void;

const standardOperationFunctions: { [key: string]: StandardOperationGenerator } = {
  read: armStandardRead,
  create: armStandardCreate,
  update: armStandardUpdate,
  delete: armStandardDelete,
  list: armStandardList,
};

const resourceOperationNamespaces = new Map<NamespaceType, Type>();

export function $armResourceOperations(
  context: DecoratorContext,
  target: Type,
  resourceType: Type
): void {
  const { program } = context;
  if (!validateDecoratorTarget(program, target, "@armResourceOperations", "Namespace")) {
    return;
  }

  // Verify that this is a registered resource
  const armResourceInfo = getArmResourceInfo(program, resourceType);
  if (!armResourceInfo) {
    return;
  }

  if (!armResourceInfo.resourcePath) {
    reportDiagnostic(program, { code: "arm-resource-operations-with-resource-path", target });
    return;
  }

  armResourceInfo.operationNamespaces.add(target.name);

  const finalPath = armResourceInfo.resourceNameParam
    ? `${armResourceInfo.resourcePath?.path}/{${armResourceInfo.resourceNameParam.name}}`
    : armResourceInfo.resourcePath?.path;

  // Set the resource path
  $route(context, target, finalPath);

  // Remember this namespace
  resourceOperationNamespaces.set(target, resourceType);
}

export function armResourceParams(program: Program, operation: Type): void {
  if (!validateDecoratorTarget(program, operation, "@armOperation", "Operation")) {
    return;
  }

  if (!operation.namespace) {
    reportDiagnostic(program, {
      code: "decorator-in-namespace",
      format: { decoratorName: "armOperation" },
      target: operation,
    });
    return;
  }

  const resourceType = resourceOperationNamespaces.get(operation.namespace);
  if (!resourceType) {
    reportDiagnostic(program, {
      code: "arm-operation-in-namespace-with-resource-operations",
      target: operation,
    });
    return;
  }

  // TODO: Automatically add base parameters
}

const apiVersionParameter: ParameterInfo = {
  name: "apiVersion",
  typeName: "ApiVersionParameter",
  description: "The service API Version",
};

function getOperationPathArguments(pathParameters: ParameterInfo[]): string {
  return [apiVersionParameter, ...pathParameters].map((param) => `...${param.typeName}`).join(", ");
}

function prepareOperationInfo(
  program: Program,
  decoratorName: string,
  resourceType: ModelType,
  operationGroup?: string
) {
  const armResourceInfo = getArmResourceInfo(program, resourceType);
  if (!armResourceInfo) {
    return;
  }
  if (!armResourceInfo.resourcePath) {
    reportDiagnostic(program, {
      code: "decorator-with-resource-path",
      format: {
        decoratorName,
      },
      target: resourceType,
    });
    return;
  }

  const nameParamList = armResourceInfo.resourceNameParam
    ? [armResourceInfo.resourceNameParam]
    : [];

  const operationParams = [...armResourceInfo.resourcePath.parameters, ...nameParamList];

  operationGroup = operationGroup ?? armResourceInfo.collectionName;

  return {
    armResourceInfo,
    operationParams,
    namespace: `${armResourceInfo.parentNamespace}.${operationGroup}`,
  };
}

function evalInNamespace(program: Program, namespace: string, cadlScript: string): void {
  program.evalCadlScript(`
    using Azure.ARM;
    using Azure.ResourceManager;
    using Cadl.Http;
    namespace ${namespace} {
      ${cadlScript}
    }
  `);
}

export function armStandardRead(program: Program, target: ModelType, documentation?: string): void {
  const info = prepareOperationInfo(program, "armStandardRead", target);
  if (!info) {
    return;
  }

  const { armResourceInfo, operationParams, namespace } = info;
  armResourceInfo.operationNamespaces?.add(namespace);
  if (!documentation) {
    documentation = `Get a ${armResourceInfo.resourceModelName}`;
  }

  evalInNamespace(
    program,
    namespace,
    `@doc("${documentation}")
     @get op Get(${getOperationPathArguments(operationParams)}): ArmResponse<${
      armResourceInfo.resourceModelName
    }> | ErrorResponse;`
  );
}

export function armStandardCreate(
  program: Program,
  target: ModelType,
  documentation?: string
): void {
  const info = prepareOperationInfo(program, "armStandardCreate", target);
  if (!info) {
    return;
  }

  const { armResourceInfo, operationParams, namespace } = info;
  armResourceInfo.operationNamespaces?.add(namespace);
  if (!documentation) {
    documentation = `Create a ${armResourceInfo.resourceModelName}`;
  }

  const lroFinalState = "azure-async-operation";
  evalInNamespace(
    program,
    namespace,
    `@doc("${documentation}")
       @extension("x-ms-long-running-operation", true)
       @asyncOperationOptions("${lroFinalState}")
       @put op CreateOrUpdate(${getOperationPathArguments(operationParams)}, 
       @doc("Resource create parameters.")
       @body resource: ${armResourceInfo.resourceModelName}): ArmResponse<${
      armResourceInfo.resourceModelName
    }> | ArmCreatedResponse<${armResourceInfo.resourceModelName}> | ErrorResponse;`
  );
}

export function armStandardUpdate(
  program: Program,
  target: ModelType,
  documentation?: string
): void {
  const info = prepareOperationInfo(program, "armStandardUpdate", target);
  if (!info) {
    return;
  }

  const { armResourceInfo, operationParams, namespace } = info;
  armResourceInfo.operationNamespaces?.add(namespace);
  if (!documentation) {
    documentation = `Update a ${armResourceInfo.resourceModelName}`;
  }

  // Generate a special "Update" model type using the resource's properties type
  let updateModelName = `${armResourceInfo.resourceModelName}`;
  if (armResourceInfo.propertiesType) {
    updateModelName = `${armResourceInfo.resourceModelName}Update`;
    const updatePropertiesModel = `${updateModelName}Properties`;

    // Only TrackedResources have a tags property
    const tagsString = armResourceInfo.resourceKind === "Tracked" ? "...ArmTagsProperty;" : "";

    const updateModelString = `
    @doc("The updatable properties of ${armResourceInfo.propertiesType.name}")
    model ${updatePropertiesModel} {
      ...OmitDefaults<OptionalProperties<UpdateableProperties<${
        armResourceInfo.propertiesType.name
      }>>>
    }

    @doc("The updatable properties of the ${armResourceInfo.resourceModelName}.")
    model ${updateModelName} {
      ${tagsString}
      properties?: ${updatePropertiesModel};
      ${target.properties.has("sku") ? "...ResourceSku;" : ""}
      ${target.properties.has("plan") ? "...ResourcePlan;" : ""}
      ${target.properties.has("managedBy") ? "...ManagedBy;" : ""}
    }
    `;

    evalInNamespace(program, armResourceInfo.parentNamespace, updateModelString);
  }

  evalInNamespace(
    program,
    namespace,
    `@doc("${documentation}")
     @patch op Update(${getOperationPathArguments(
       operationParams
     )}, @doc("The resource properties to be updated.") @body resource: ${updateModelName}): ArmResponse<${
      armResourceInfo.resourceModelName
    }> | ErrorResponse;`
  );
}

export function armStandardDelete(
  program: Program,
  target: ModelType,
  documentation?: string
): void {
  const info = prepareOperationInfo(program, "armStandardDelete", target);
  if (!info) {
    return;
  }

  const { armResourceInfo, operationParams, namespace } = info;
  armResourceInfo.operationNamespaces?.add(namespace);
  if (!documentation) {
    documentation = `Delete a ${armResourceInfo.resourceModelName}`;
  }

  const lroFinalState = "azure-async-operation";
  evalInNamespace(
    program,
    namespace,
    `@doc("${documentation}")
       @extension("x-ms-long-running-operation", true)
       @asyncOperationOptions("${lroFinalState}")
       @delete op Delete(${getOperationPathArguments(
         operationParams
       )}): ArmDeletedResponse | ArmDeletedNoContentResponse | ArmDeleteAcceptedResponse | ErrorResponse;`
  );
}

export function armStandardList(program: Program, target: ModelType, documentation?: string): void {
  const info = prepareOperationInfo(program, "armStandardList", target);

  if (!info) {
    return;
  }

  const { armResourceInfo, operationParams, namespace } = info;
  if (armResourceInfo.resourceKind === "Tracked") {
    armListByInternal(
      program,
      target,
      armResourceInfo,
      "SubscriptionIdParameter",
      "ListBySubscription",
      `List ${armResourceInfo.resourceModelName} resources by subscription ID`
    );

    armListByInternal(
      program,
      target,
      armResourceInfo,
      "ResourceGroupNameParameter",
      "ListByResourceGroup",
      `List ${armResourceInfo.resourceModelName} resources by resource group`
    );
  }
}

export function generateStandardOperations(
  program: Program,
  resourceType: ModelType,
  standardOperations: string[]
) {
  for (const op of standardOperations) {
    const generator = standardOperationFunctions[op];
    if (generator) {
      generator(program, resourceType);
    } else {
      reportDiagnostic(program, {
        code: "unknown-std-operation",
        target: resourceType,
        format: { operation: op },
      });
    }
  }
}

function armListByInternal(
  program: Program,
  target: Type,
  armResourceInfo: ArmResourceInfo,
  paramTypeName: string,
  operationName: string,
  documentation?: string
) {
  const resourcePath = armResourceInfo.resourcePath;
  if (!resourcePath) {
    reportDiagnostic(program, {
      code: "list-operation-with-resource-path",
      target,
    });
    return;
  }

  // There are two cases here:
  // 1. Parameter comes before the resource type in the path
  // 2. Parameter is the parameter type for this resource
  //
  // In the second case, we interpret this as "list all resources of this type
  // for the provider"

  let pathParams = resourcePath.parameters;
  const paramInfo =
    armResourceInfo.resourceNameParam &&
    armResourceInfo.resourceNameParam.typeName === paramTypeName
      ? armResourceInfo.resourceNameParam
      : pathParams.find((p) => p.typeName === paramTypeName);

  if (!paramInfo) {
    reportDiagnostic(program, {
      code: "parameter-in-resource",
      target,
    });
    return;
  }

  let basePath = "";
  const pathParts = resourcePath.path.split("/");

  if (paramInfo !== armResourceInfo.resourceNameParam) {
    if (!documentation) {
      documentation = `List all ${armResourceInfo.resourceModelName} by ${paramInfo.name}`;
    }

    // Remove the later parameters
    const paramIndex = pathParams.findIndex((p) => p.typeName === paramTypeName) + 1;
    pathParams = pathParams.slice(0, paramIndex);

    // Generate the base path
    const pathParam = `{${paramInfo.name}}`;
    basePath = resourcePath.path.substring(
      0,
      resourcePath.path.indexOf(pathParam) + pathParam.length
    );
  } else {
    pathParams = [];
    documentation = `List all ${armResourceInfo.resourceModelName} resources for the ${armResourceInfo.armNamespace} provider`;
  }

  // Insert the provider name again?
  if (basePath.indexOf(armResourceInfo.armNamespace) < 0) {
    basePath = `${basePath}/providers/${armResourceInfo.armNamespace}`;
  }

  const finalPath = basePath + "/" + pathParts[pathParts.length - 1];
  armResourceInfo.operationNamespaces?.add(armResourceInfo.collectionName + "." + operationName);
  program.evalCadlScript(`
    using Azure.ARM;
    using Azure.ResourceManager;
    using Cadl.Http;
    namespace ${armResourceInfo.parentNamespace} {
      @tag("${armResourceInfo.collectionName}")
      @route("${finalPath}")
      namespace ${armResourceInfo.collectionName}${operationName} {
        @doc("${documentation}")
        @operationId("${armResourceInfo.collectionName}_${operationName}")
        @pageable @get op ${operationName}(${getOperationPathArguments(pathParams)}): ArmResponse<${
    armResourceInfo.resourceListModelName
  }> | ErrorResponse;
      }
    }`);
}

function checkOperationName(
  program: Program,
  target: Type,
  operationName: string,
  armResourceInfo: ArmResourceInfo
) {
  if (operationName.includes(armResourceInfo.resourceModelName)) {
    reportDiagnostic(program, {
      code: "no-repeated-resource-in-operation",
      format: { resourceModelName: armResourceInfo.resourceModelName },
      target,
    });
  }

  if (operationName.includes("_")) {
    reportDiagnostic(program, {
      code: "no-underscore-in-operation-name",
      target,
    });
  }
}

export function $armListBy(
  { program }: DecoratorContext,
  target: Type,
  paramType: Type,
  operationName: string,
  documentation?: string
): void {
  const armResourceInfo = getArmResourceInfo(program, target);
  if (!armResourceInfo) {
    return;
  }
  if (!armResourceInfo.resourcePath) {
    reportDiagnostic(program, {
      code: "decorator-with-resource-path",
      format: { decoratorName: "armListBy" },
      target,
    });
    return;
  }

  if (!validateDecoratorTarget(program, paramType, "@armListBy", "Model")) {
    return;
  }

  checkOperationName(program, target, operationName, armResourceInfo);

  armListByInternal(program, target, armResourceInfo, paramType.name, operationName, documentation);
}
