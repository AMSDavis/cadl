import { useRef } from "@azure-tools/cadl-autorest";
import { Program, Type } from "@cadl-lang/compiler";

export function getArmTypesPath(program: Program): string | undefined {
  return (
    program.getOption("arm-types-path") ||
    "../../../../../common-types/resource-management/v2/types.json"
  );
}

export function armCommonDefinition(program: Program, entity: Type, definitionName?: string): void {
  if (entity.kind !== "Model") {
    program.reportDiagnostic(
      "The @armCommonDefinition decorator can only be applied to models.",
      entity
    );
    return;
  }

  // Use the name of the model type if not specified
  if (!definitionName) {
    definitionName = entity.name;
  }

  useRef(program, entity, `${getArmTypesPath(program)}#/definitions/${definitionName}`);
}

export function armCommonParameter(program: Program, entity: Type, parameterName?: string): void {
  if (entity.kind !== "ModelProperty") {
    program.reportDiagnostic(
      "The @armCommonParameter decorator can only be applied to model properties and operation parameters.",
      entity
    );
    return;
  }

  // Use the name of the model type if not specified
  if (!parameterName) {
    parameterName = entity.name;
  }

  useRef(program, entity, `${getArmTypesPath(program)}#/parameters/${parameterName}`);
}
