import {
  createDiagnosticLegacy,
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
    severity: "warning",
    text:
      "Inline models cannot be represented in many languages. Using this pattern can result in bad auto naming. ",
  } as const,

  ModelDocumentation: {
    code: "model-requires-documentation",
    severity: "warning",
    text:
      "The model must have a documentation or description , please use decarator @doc to add it.",
  } as const,

  OperationDocumentation: {
    code: "operation-requires-documentation",
    severity: "warning",
    text:
      "The operation must have a documentation or description , please use decarator @doc to add it.",
  } as const,
};

function isInlineModel(target: ModelType) {
  return !target.name;
}

const checkInlineModel: SemanticNodeListener = {
  model: (context: ModelType) => {
    // the empty model'{}' can be ignored.
    if (isInlineModel(context) && context.properties.size > 0) {
      Checker.report(Messages.NoInlineModel, context);
    }
  },
};

/**
 *
 * @param target
 * @returns true if the model type is a model with template declaration.
 */
function isTemplateDeclarationType(target: ModelType) {
  return target.node?.kind === SyntaxKind.ModelStatement && target.node.templateParameters.length;
}

class Checker {
  private static diagnostics: Diagnostic[] = [];
  static report(
    message: Message,
    target: DiagnosticTarget | typeof NoTarget,
    args?: (string | number)[]
  ) {
    Checker.diagnostics.push(createDiagnosticLegacy(message, target, args));
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
      // the `getDoc` function can't get the `doc` for template declaration type but it can get  doc from an instantiation template type, not sure if it's expected ?? here we just skip it.
      if (
        !isIntrinsic(p, context) &&
        !isTemplateDeclarationType(context) &&
        !isInlineModel(context) &&
        !getDoc(p, context)
      ) {
        Checker.report(Messages.ModelDocumentation, context);
      }
    },
  };
  checker.register([checkInlineModel, checkDocumentation]);
  return checker.run(p);
};
