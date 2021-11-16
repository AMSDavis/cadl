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
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";

export async function $onBuild(p: Program) {
  runLinter(p);
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

/**
 *
 *@param target
 *@returns true if the operation is defined on a templated interface which hasn't had args filled in
 */
function isTemplatedInterfaceOperation(target: OperationType) {
  return (
    target.node?.kind === SyntaxKind.OperationStatement &&
    target.interface &&
    target.interface.node.templateParameters.length &&
    !target.interface.templateArguments?.length
  );
}

function createListenerOnGeneralType(fn: (target: Type) => void) {
  // this type ensure that we can get noticed when there is new kind of type being added to the Type alias.
  type FullSemanticNodeListener = Required<
    Omit<
      SemanticNodeListener,
      "root" | "string" | "boolean" | "number" | "intrinsic" | "enumMember"
    >
  >;
  const listener: FullSemanticNodeListener = {
    namespace: fn,
    interface: fn,
    operation: fn,
    model: fn,
    modelProperty: fn,
    templateParameter: fn,
    enum: fn,
    union: fn,
    unionVariant: fn,
    array: fn,
    tuple: fn,
  };
  return listener;
}

class Linter {
  private eventEmitter = new EventEmitter<SemanticNodeListener>();

  run(p: Program) {
    navigateProgram(p, this.eventEmitter);
  }

  register(listeners: SemanticNodeListener[] | SemanticNodeListener) {
    const listenerList = Array.isArray(listeners) ? listeners : [listeners];
    for (const listeners of listenerList) {
      for (const [name, listener] of Object.entries(listeners)) {
        this.eventEmitter.on(name as any, listener as any);
      }
    }
  }
}

const runLinter = (p: Program) => {
  const checkDocumentation: SemanticNodeListener = {
    operation: (context: OperationType) => {
      // Don't pay attention to operations on templated interfaces that
      // haven't been filled in with parameters yet
      if (!isTemplatedInterfaceOperation(context)) {
        if (!getDoc(p, context)) {
          reportDiagnostic(p, { code: "operation-requires-documentation", target: context });
        }
      }
    },
    model: (context: ModelType) => {
      // it's by design that the `getDoc` function can't get the `doc` for template declaration type.
      if (
        !isIntrinsic(p, context) &&
        !isTemplateDeclarationType(context) &&
        !isInlineModel(context)
      ) {
        if (!getDoc(p, context)) {
          reportDiagnostic(p, { code: "model-requires-documentation", target: context });
        }
        for (const prop of context.properties.values()) {
          if (!getDoc(p, prop)) {
            reportDiagnostic(p, { code: "property-requires-documentation", target: context });
          }
        }
      }
    },
  };

  const isDocumentationSameAsNodeName = (target: Type) => {
    const docText = getDoc(p, target);
    const nodeName = (target as any).name;
    if (
      typeof docText === "string" &&
      typeof nodeName === "string" &&
      docText.trim().toLowerCase() === nodeName.toLowerCase()
    ) {
      reportDiagnostic(p, { code: "documentation-different-with-node-name", target });
    }
  };

  const checkDocumentationText: SemanticNodeListener = createListenerOnGeneralType(
    isDocumentationSameAsNodeName
  );

  const checkInlineModel: SemanticNodeListener = {
    model: (context: ModelType) => {
      // the empty model'{}' can be ignored.
      if (isInlineModel(context) && context.properties.size > 0) {
        reportDiagnostic(p, { code: "no-inline-model", target: context });
      }
    },
  };
  const linter = new Linter();
  linter.register([checkInlineModel, checkDocumentation, checkDocumentationText]);
  return linter.run(p);
};
