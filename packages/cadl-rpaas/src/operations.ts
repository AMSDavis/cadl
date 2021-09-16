import { NamespaceType, Program, Type } from "@cadl-lang/compiler";
import { $resource } from "@cadl-lang/rest";
import { ArmResourceInfo, getArmResourceInfo, ParameterInfo } from "./resource.js";

type StandardOperationGenerator = (program: Program, target: Type, documentation?: string) => void;

const standardOperationFunctions: { [key: string]: StandardOperationGenerator } = {
  read: armStandardRead,
  create: armStandardCreate,
  update: armStandardUpdate,
  delete: armStandardDelete,
  list: armStandardList,
};

const resourceOperationNamespaces = new Map<NamespaceType, Type>();

export function $armResourceOperations(program: Program, target: Type, resourceType: Type): void {
  if (target.kind !== "Namespace") {
    program.reportDiagnostic(
      `The @armResourceOperations decorator can only be applied to namespaces.`,
      target
    );
    return;
  }

  // Verify that this is a registered resource
  const armResourceInfo = getArmResourceInfo(program, resourceType);
  if (!armResourceInfo) {
    return;
  }

  if (!armResourceInfo.resourcePath) {
    program.reportDiagnostic(
      `The @armResourceOperations decorator can only be used for resource types that have an @armResourcePath configured.`,
      target
    );
    return;
  }

  armResourceInfo.operationNamespaces.add(target.name);

  // Set the resource path
  $resource(program, target, armResourceInfo.resourcePath.path);

  // Remember this namespace
  resourceOperationNamespaces.set(target, resourceType);
}

export function armResourceParams(program: Program, operation: Type): void {
  if (operation.kind !== "Operation") {
    program.reportDiagnostic(
      `The @armOperation decorator can only be applied to operations.`,
      operation
    );
    return;
  }

  if (!operation.namespace) {
    program.reportDiagnostic(
      `The @armOperation decorator can only be applied to an operation that is defined inside of a namespace.`,
      operation
    );
    return;
  }

  const resourceType = resourceOperationNamespaces.get(operation.namespace);
  if (!resourceType) {
    program.reportDiagnostic(
      `The @armOperation decorator can only be applied to an operation that is defined inside of a namespace marked with @armResourceOperations.`,
      operation
    );
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
  resourceType: Type,
  operationGroup?: string
) {
  const armResourceInfo = getArmResourceInfo(program, resourceType);
  if (!armResourceInfo) {
    return;
  }
  if (!armResourceInfo.resourcePath) {
    program.reportDiagnostic(
      `The @${decoratorName} decorator can only be applied to a resource type with a resource path.`,
      resourceType
    );
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
    namespace ${namespace} {
      ${cadlScript}
    }
  `);
}

export function armStandardRead(program: Program, target: Type, documentation?: string): void {
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

export function armStandardCreate(program: Program, target: Type, documentation?: string): void {
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

export function armStandardUpdate(program: Program, target: Type, documentation?: string): void {
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
    const updatePropertiesDescription = `@doc("The updateable properties of ${armResourceInfo.propertiesType.name}")`;
    const propertiesModelString = `${updatePropertiesDescription}
        model ${updatePropertiesModel} {
          ...OptionalProperties<UpdateableProperties<${armResourceInfo.propertiesType.name}>>
        }`;

    // Only TrackedResources have a tags property
    const tagsString = armResourceInfo.resourceKind === "Tracked" ? "...ArmTagsProperty;" : "";

    evalInNamespace(
      program,
      armResourceInfo.parentNamespace,
      `${propertiesModelString}
       @doc("The updatable properties of the ${armResourceInfo.resourceModelName}.")
       model ${updateModelName} {
         ${tagsString}
         ...${updatePropertiesModel};
       }`
    );
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

export function armStandardDelete(program: Program, target: Type, documentation?: string): void {
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

export function armStandardList(program: Program, target: Type, documentation?: string): void {
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
  resourceType: Type,
  standardOperations: string[]
) {
  for (const op of standardOperations) {
    const generator = standardOperationFunctions[op];
    if (generator) {
      generator(program, resourceType);
    } else {
      program.reportDiagnostic(`The standard operation type '${op}' is unknown.`, resourceType);
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
    program.reportDiagnostic(
      "List operations can only be created for a resource type with a resource path.",
      target
    );
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
    program.reportDiagnostic("Parameter type not a part of the resource", target);
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
    namespace ${armResourceInfo.parentNamespace} {
      @tag("${armResourceInfo.collectionName}")
      @resource("${finalPath}")
      namespace ${armResourceInfo.collectionName}${operationName} {
        @doc("${documentation}")
        @operationId("${armResourceInfo.collectionName}_${operationName}")
        @list @get op ${operationName}(${getOperationPathArguments(pathParams)}): ArmResponse<${
    armResourceInfo.resourceListModelName
  }> | ErrorResponse;
      }
    }`);
}

export function $armListBy(
  program: Program,
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
    program.reportDiagnostic(
      "The @armListBy decorator can only be applied to a resource type with a resource path.",
      target
    );
    return;
  }

  if (paramType.kind !== "Model") {
    program.reportDiagnostic("Parameter type is not a model", target);
    return;
  }

  armListByInternal(program, target, armResourceInfo, paramType.name, operationName, documentation);
}
