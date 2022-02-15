import { $useRef } from "@azure-tools/cadl-autorest";
import { DecoratorContext, Program, Type, validateDecoratorTarget } from "@cadl-lang/compiler";

export function getArmTypesPath(program: Program): string | undefined {
  return (
    program.getOption("arm-types-path") ||
    "../../../../../common-types/resource-management/v2/types.json"
  );
}

export function $armCommonDefinition(
  context: DecoratorContext,
  entity: Type,
  definitionName?: string
): void {
  if (!validateDecoratorTarget(context.program, entity, "@armCommonDefinition", "Model")) {
    return;
  }

  // Use the name of the model type if not specified
  if (!definitionName) {
    definitionName = entity.name;
  }

  $useRef(context, entity, `${getArmTypesPath(context.program)}#/definitions/${definitionName}`);
}

export function $armCommonParameter(
  context: DecoratorContext,
  entity: Type,
  parameterName?: string
): void {
  if (!validateDecoratorTarget(context.program, entity, "@armCommonParameter", "ModelProperty")) {
    return;
  }

  // Use the name of the model type if not specified
  if (!parameterName) {
    parameterName = entity.name;
  }

  $useRef(context, entity, `${getArmTypesPath(context.program)}#/parameters/${parameterName}`);
}
