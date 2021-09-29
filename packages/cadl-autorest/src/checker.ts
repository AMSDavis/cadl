import {
  createDiagnostic,
  Diagnostic,
  DiagnosticTarget,
  EventEmitter,
  getDoc,
  isIntrinsic,
  Message,
  ModelType,
  navigateProgram,
  NoTarget,
  OperationType,
  Program,
  SemanticNodeListener,
  SyntaxKind,
} from "@cadl-lang/compiler";
export const Messages = {
  NoInlineModel: {
    code: "no-inline-model",
    severity: "error",
    text:
      "Inline models cannot be represented in many languages. Using this pattern can result in bad auto naming. ",
  } as const,

  ModelDocumentation: {
    code: "model-requires-documentation",
    severity: "error",
    text:
      "The model must have a documentation or description , please use decarator @doc to add it.",
  } as const,

  OperationDocumentation: {
    code: "operation-requires-documentation",
    severity: "error",
    text:
      "The operation must have a documentation or description , please use decarator @doc to add it.",
  } as const,
};

const checkInlineModel: SemanticNodeListener = {
  model: (context: ModelType) => {
    if (!context.name) {
      Checker.report(Messages.NoInlineModel, context);
    }
  },
};

/**
 *
 * @param target
 * @returns true if the model type is a model with template declaration.
 */
function isTemplateDeclaration(target: ModelType) {
  return target.node?.kind === SyntaxKind.ModelStatement && target.node.templateParameters.length;
}

class Checker {
  private static diagnostics: Diagnostic[] = [];
  static report(
    message: Message,
    target: DiagnosticTarget | typeof NoTarget,
    args?: (string | number)[]
  ) {
    Checker.diagnostics.push(createDiagnostic(message, target, args));
  }
  private eventEmitter = new EventEmitter<SemanticNodeListener>();

  run(p: Program) {
    navigateProgram(p, this.eventEmitter);
    p.reportDiagnostics(Checker.diagnostics);
    return Checker.diagnostics;
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

export const runChecker = (p: Program) => {
  const checker = new Checker();
  const checkDocumentation: SemanticNodeListener = {
    operation: (context: OperationType) => {
      if (!getDoc(p, context)) {
        Checker.report(Messages.OperationDocumentation, context);
      }
    },
    model: (context: ModelType) => {
      // the `getDoc` function can't get the `doc` for template declaration , not sure if it's expected ?? here we just skip it.
      if (!isIntrinsic(p, context) && !isTemplateDeclaration(context) && !getDoc(p, context)) {
        Checker.report(Messages.ModelDocumentation, context);
      }
    },
  };
  checker.register([checkInlineModel, checkDocumentation]);
  return checker.run(p);
};
