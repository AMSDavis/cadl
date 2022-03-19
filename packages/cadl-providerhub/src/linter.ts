import { isArmCommonType } from "@azure-tools/cadl-azure-resource-manager";
import {
  ArrayType,
  EventEmitter,
  getDoc,
  getProperty,
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
import { getExtensions } from "@cadl-lang/openapi";
import { reportDiagnostic } from "./lib.js";

export async function $onValidate(p: Program) {
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
  type exitListener<T extends string> = T extends `exit${infer U}` ? T : never;
  // this type ensure that we can get noticed when there is new kind of type being added to the Type alias.
  type FullSemanticNodeListener = Required<
    Omit<
      SemanticNodeListener,
      | exitListener<keyof SemanticNodeListener>
      | "root"
      | "string"
      | "boolean"
      | "number"
      | "intrinsic"
      | "enumMember"
      | "function"
      | "object"
      | "projection"
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

function getProperties(model: ModelType) {
  let properties: ModelTypeProperty[] = [];
  if (model.baseModel) {
    properties = getProperties(model.baseModel);
  }
  return Array.from(model.properties.values()).concat(properties);
}

function getPropertyByName(model: ModelType, name: string) {
  const props = getProperties(model);
  return props.find((prop) => prop.name === name);
}

function* getOverlappedProperty(inner: ModelType, topLevel: ModelType) {
  const innerProperties = getProperties(inner);
  const topLevelProperties = getProperties(topLevel);
  for (const innerProp of innerProperties) {
    if (
      topLevelProperties.some(
        (value) => innerProp.name === value.name && innerProp.type.kind === value.type.kind
      )
    ) {
      yield innerProp;
    }
  }
}

function hasBaseModel(model: ModelType, baseModelName: string): boolean {
  if (model.baseModel) {
    if (model.baseModel.name === baseModelName && model.baseModel.namespace?.name === "ARM") {
      return true;
    }
    return hasBaseModel(model.baseModel, baseModelName);
  }
  return false;
}

const armBaseResources = [
  "TrackedResource",
  "ProxyResource",
  "ExtensionResource",
  "TrackedResourceBase",
  "ProxyResourceBase",
];

function ifExtendsBaseModel(model: ModelType) {
  if (armBaseResources.some((base) => hasBaseModel(model, base))) {
    return true;
  }
  return false;
}

function IfExtendsArmResource(model: ModelType) {
  return hasBaseModel(model, "ArmResource");
}

/**
 *
 * @param model
 * @returns true is the model is an Arm resource.
 */
function isConcreteArmResourceModel(model: ModelType) {
  if (armBaseResources.includes(model.name)) {
    return false;
  }
  if (ifExtendsBaseModel(model)) {
    return true;
  }
  // if extends the ArmResource directly, consider it resource.
  return IfExtendsArmResource(model);
}

function isArmAllowedTopLevelProperty(prop: ModelTypeProperty) {
  const allowedTopLevelProperties = [
    "name",
    "type",
    "id",
    "location",
    "properties",
    "tags",
    "plan",
    "sku",
    "etag",
    "managedby",
    "identity",
    "systemdata",
    "extendedlocation",
  ];
  return allowedTopLevelProperties.includes(prop.name.toLowerCase());
}

function ifArrayItemContainsIdentifier(program: Program, array: ArrayType) {
  if (array.elementType.kind != "Model") {
    return true;
  }
  if (isArmCommonType(array.elementType)) {
    return true;
  }
  return (
    getExtensions(program, array).has("x-ms-identifier") ||
    isIntrinsic(program, array.elementType) ||
    getProperty(array.elementType, "id")
  );
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
            reportDiagnostic(p, { code: "property-requires-documentation", target: prop });
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

  const checkResources: SemanticNodeListener = {
    model: (context: ModelType) => {
      if (isConcreteArmResourceModel(context)) {
        const properties = getProperties(context);
        properties.forEach((prop) => {
          if (!isArmAllowedTopLevelProperty(prop)) {
            reportDiagnostic(p, { code: "resource-top-level-properties", target: prop });
          }
        });
        const propertiesBag = getPropertyByName(context, "properties");
        if (propertiesBag && propertiesBag.type.kind === "Model") {
          for (const overlappedProp of getOverlappedProperty(propertiesBag.type, context))
            reportDiagnostic(p, {
              code: "no-repeated-property-inside-the-properties",
              target: overlappedProp,
            });
        }
        if (!ifExtendsBaseModel(context)) {
          reportDiagnostic(p, { code: "resource-extends-base-models", target: context });
        }
      }
    },
  };

  const checkXmsIdentifier: SemanticNodeListener = {
    array: (context: ArrayType) => {
      if (!ifArrayItemContainsIdentifier(p, context)) {
        reportDiagnostic(p, {
          code: "no-identifier-property-in-array-item",
          target: context,
        });
      }
    },
  };

  const linter = new Linter();
  linter.register([
    checkInlineModel,
    checkDocumentation,
    checkDocumentationText,
    checkResources,
    checkXmsIdentifier,
  ]);
  return linter.run(p);
};
