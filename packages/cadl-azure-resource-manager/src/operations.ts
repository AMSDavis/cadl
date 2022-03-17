import {
  DecoratorContext,
  ModelType,
  OperationType,
  Program,
  Type,
  validateDecoratorParamType,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { $action, getAllRoutes, OperationDetails } from "@cadl-lang/rest";

export type ArmLifecycleOperationKind = "read" | "createOrUpdate" | "update" | "delete";
export type ArmOperationKind = ArmLifecycleOperationKind | "list" | "action";

export interface ArmResourceOperation {
  name: string;
  kind: ArmOperationKind;
  path: string;
  operation: OperationType;
  operationGroup: string;
  operationDetails: OperationDetails;
}

export interface ArmLifecycleOperations {
  read?: ArmResourceOperation;
  createOrUpdate?: ArmResourceOperation;
  update?: ArmResourceOperation;
  delete?: ArmResourceOperation;
}

export interface ArmResourceOperations {
  lifecycle: ArmLifecycleOperations;
  lists: { [key: string]: ArmResourceOperation };
  actions: { [key: string]: ArmResourceOperation };
}

const armResourceOperationsKey = Symbol();
const armResourceOperationsMapKey = Symbol();

function getArmResourceOperations(
  program: Program,
  resourceType: ModelType
): ArmResourceOperations {
  let operations = program.stateMap(armResourceOperationsKey).get(resourceType);
  if (!operations) {
    operations = { lifecycle: {}, lists: {}, actions: {} };
    program.stateMap(armResourceOperationsKey).set(resourceType, operations);
  }

  return operations;
}

export function resolveResourceOperations(
  program: Program,
  resourceType: ModelType
): ArmResourceOperations {
  const operations = getArmResourceOperations(program, resourceType);
  const operationMap = program.stateMap(armResourceOperationsMapKey);

  // Get all resolved operations and update ARM operation details
  for (const operationDetails of getAllRoutes(program)) {
    const operation: ArmResourceOperation | undefined = operationMap.get(
      operationDetails.operation
    );

    if (operation) {
      // Populate the remaining details of the operation
      operation.path = operationDetails.path;
      operation.operationDetails = operationDetails;
    }
  }

  // Returned the updated operations object
  return operations;
}

function setResourceLifecycleOperation(
  program: Program,
  target: Type,
  resourceType: Type,
  kind: ArmLifecycleOperationKind,
  decoratorName: string
) {
  // If the properties type is a template parameter, this must be a templated type
  if (resourceType.kind === "TemplateParameter") {
    return;
  }

  if (
    !validateDecoratorTarget(program, target, decoratorName, "Operation") ||
    !validateDecoratorParamType(program, target, resourceType, "Model")
  ) {
    return;
  }

  // Only register methods from non-templated interface types
  if (target.interface === undefined || target.interface.node.templateParameters.length > 0) {
    return;
  }

  // We can't resolve the operation path yet so treat the operation as a partial
  // type so that we can fill in the missing details later
  const operations = getArmResourceOperations(program, resourceType);
  const operation: Partial<ArmResourceOperation> = {
    name: target.name,
    kind,
    operation: target,
    operationGroup: target.interface.name,
  };

  operations.lifecycle[kind] = operation as ArmResourceOperation;

  // Add it to the OperationType -> ArmResourceOperation map
  program.stateMap(armResourceOperationsMapKey).set(target, operations.lifecycle[kind]);
}

export function $armResourceRead({ program }: DecoratorContext, target: Type, resourceType: Type) {
  setResourceLifecycleOperation(program, target, resourceType, "read", "@armResourceRead");
}

export function $armResourceCreateOrUpdate(
  { program }: DecoratorContext,
  target: Type,
  resourceType: Type
) {
  setResourceLifecycleOperation(
    program,
    target,
    resourceType,
    "createOrUpdate",
    "@armResourceCreateOrUpdate"
  );
}

export function $armResourceUpdate(
  { program }: DecoratorContext,
  target: Type,
  resourceType: Type
) {
  setResourceLifecycleOperation(program, target, resourceType, "update", "@armResourceUpdate");
}

export function $armResourceDelete(
  { program }: DecoratorContext,
  target: Type,
  resourceType: Type
) {
  setResourceLifecycleOperation(program, target, resourceType, "delete", "@armResourceDelete");
}

export function $armResourceList(
  { program }: DecoratorContext,
  target: Type,
  resourceType: Type,
  listOperationName: string
) {
  // If the properties type is a template parameter, this must be a templated type
  if (resourceType.kind === "TemplateParameter") {
    return;
  }

  if (
    !validateDecoratorTarget(program, target, "@armResourceList", "Operation") ||
    !validateDecoratorParamType(program, target, resourceType, "Model")
  ) {
    return;
  }

  // Only register methods from non-templated interface types
  if (target.interface === undefined || target.interface.node.templateParameters.length > 0) {
    return;
  }

  // We can't resolve the operation path yet so treat the operation as a partial
  // type so that we can fill in the missing details later
  const operations = getArmResourceOperations(program, resourceType);
  const operation: Partial<ArmResourceOperation> = {
    name: listOperationName,
    kind: "list",
    operation: target,
    operationGroup: target.interface.name,
  };

  operations.lists[listOperationName] = operation as ArmResourceOperation;

  // Add it to the OperationType -> ArmResourceOperation map
  program.stateMap(armResourceOperationsMapKey).set(target, operation);
}

export function $armResourceAction(
  context: DecoratorContext,
  target: Type,
  resourceType: Type,
  listOperationName: string
) {
  const { program } = context;

  // If the properties type is a template parameter, this must be a templated type
  if (resourceType.kind === "TemplateParameter") {
    return;
  }

  if (
    !validateDecoratorTarget(program, target, "@armResourceAction", "Operation") ||
    !validateDecoratorParamType(program, target, resourceType, "Model")
  ) {
    return;
  }

  // Only register methods from non-templated interface types
  if (target.interface === undefined || target.interface.node.templateParameters.length > 0) {
    return;
  }

  // We can't resolve the operation path yet so treat the operation as a partial
  // type so that we can fill in the missing details later
  const operations = getArmResourceOperations(program, resourceType);
  const operation: Partial<ArmResourceOperation> = {
    name: target.name,
    kind: "action",
    operation: target,
    operationGroup: target.interface.name,
  };

  operations.actions[target.name] = operation as ArmResourceOperation;

  // Add it to the OperationType -> ArmResourceOperation map
  program.stateMap(armResourceOperationsMapKey).set(target, operation);

  // Also apply the @action decorator to the operation
  $action(context, target);
}
