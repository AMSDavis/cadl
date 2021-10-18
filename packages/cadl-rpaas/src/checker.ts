import {
  EventEmitter,
  getDoc,
  isIntrinsic,
  ModelType,
  ModelTypeProperty,
  navigateProgram,
  OperationType,
  Program,
  SemanticNodeListener,
  SyntaxKind,
  Type,
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

class Checker {
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

const runChecker = (p: Program) => {
  const checkDocumentation: SemanticNodeListener = {
    operation: (context: OperationType) => {
      if (!getDoc(p, context)) {
        reportDiagnostic(p, { code: "operation-requires-documentation", target: context });
      }
    },
    model: (context: ModelType) => {
      // the `getDoc` function can't get the `doc` for template declaration type but it can get doc from an instantiation template type, not sure if it's expected ?? here we just skip it.
      if (
        !isIntrinsic(p, context) &&
        !isTemplateDeclarationType(context) &&
        !isInlineModel(context) &&
        !getDoc(p, context)
      ) {
        reportDiagnostic(p, { code: "model-requires-documentation", target: context });
      }
    },
    modelProperty: (context: ModelTypeProperty) => {
      if (!getDoc(p, context)) {
        reportDiagnostic(p, { code: "property-requires-documentation", target: context });
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
  const checker = new Checker();
  checker.register([checkInlineModel, checkDocumentation, checkDocumentationText]);
  return checker.run(p);
};
