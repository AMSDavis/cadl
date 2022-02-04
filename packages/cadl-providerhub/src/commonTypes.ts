import { $useRef } from "@azure-tools/cadl-autorest";
import { Program, Type } from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";

export function getArmTypesPath(program: Program): string | undefined {
  return (
    program.getOption("arm-types-path") ||
    "../../../../../common-types/resource-management/v2/types.json"
  );
}

export function $armCommonDefinition(
  program: Program,
  entity: Type,
  definitionName?: string
): void {
  if (entity.kind !== "Model") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      messageId: "armCommonDefinition",
      target: entity,
    });
    return;
  }

  // Use the name of the model type if not specified
  if (!definitionName) {
    definitionName = entity.name;
  }

  $useRef(program, entity, `${getArmTypesPath(program)}#/definitions/${definitionName}`);
}

export function $armCommonParameter(program: Program, entity: Type, parameterName?: string): void {
  if (entity.kind !== "ModelProperty") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      messageId: "armCommonParameter",
      target: entity,
    });
    return;
  }

  // Use the name of the model type if not specified
  if (!parameterName) {
    parameterName = entity.name;
  }

  $useRef(program, entity, `${getArmTypesPath(program)}#/parameters/${parameterName}`);
}
