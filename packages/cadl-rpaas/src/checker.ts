import {
  EventEmitter,
  getDoc,
  isIntrinsic,
  ModelType,
  navigateProgram,
  OperationType,
  Program,
  SemanticNodeListener,
  SyntaxKind,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";

export async function $onBuild(p: Program) {
  if (p.compilerOptions.onBuildCheck) {
    runChecker(p);
  }
}

function isInlineModel(target: ModelType) {
  return !target.name;
}

/**
 *
 *@param target
 *@returns true if the model type is a model with template declaration.
 */
function isTemplateDeclarationType(target: ModelType) {
  return target.node?.kind === SyntaxKind.ModelStatement && target.node.templateParameters.length;
}

class Checker {
  private eventEmitter = new EventEmitter<SemanticNodeListener>();

  run(p: Program) {
    navigateProgram(p, this.eventEmitter);
  }

  register(listeners: SemanticNodeListener[] | SemanticNodeListener) {
    const listennerList = Array.isArray(listeners) ? listeners : [listeners];
    for (const listeners of listennerList) {
      for (const [name, listener] of Object.entries(listeners)) {
        this.eventEmitter.on(name as any, listener as any);
      }
    }
  }
}

const runChecker = (p: Program) => {
  const checkDocumentation: SemanticNodeListener = {
    operation: (context: OperationType) => {
      if (!getDoc(p, context)) {
        reportDiagnostic(p, { code: "operation-requires-documentation", target: context });
      }
    },
    model: (context: ModelType) => {
      // the `getDoc` function can't get the `doc` for template declaration type but it can get  doc from an instantiation template type, not sure if it's expected ?? here we just skip it.
      if (
        !isIntrinsic(p, context) &&
        !isTemplateDeclarationType(context) &&
        !isInlineModel(context) &&
        !getDoc(p, context)
      ) {
        reportDiagnostic(p, { code: "model-requires-documentation", target: context });
      }
    },
  };
  const checkInlineModel: SemanticNodeListener = {
    model: (context: ModelType) => {
      // the empty model'{}' can be ignored.
      if (isInlineModel(context) && context.properties.size > 0) {
        reportDiagnostic(p, { code: "no-inline-model", target: context });
      }
    },
  };
  const checker = new Checker();
  checker.register([checkInlineModel, checkDocumentation]);
  return checker.run(p);
};
