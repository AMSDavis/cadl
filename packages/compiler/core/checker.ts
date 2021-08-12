import { compilerAssert } from "./diagnostics.js";
import { hasParseError } from "./parser.js";
import { Program } from "./program.js";
import {
  AliasStatementNode,
  ArrayExpressionNode,
  BooleanLiteralNode,
  BooleanLiteralType,
  CadlScriptNode,
  DecoratorApplication,
  DecoratorExpressionNode,
  DecoratorSymbol,
  EnumMemberNode,
  EnumMemberType,
  EnumStatementNode,
  EnumType,
  ErrorType,
  IdentifierNode,
  IntersectionExpressionNode,
  LiteralNode,
  LiteralType,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  ModelType,
  ModelTypeProperty,
  NamespaceStatementNode,
  NamespaceType,
  Node,
  NumericLiteralNode,
  NumericLiteralType,
  OperationStatementNode,
  OperationType,
  ReferenceExpression,
  StringLiteralNode,
  StringLiteralType,
  SymbolLinks,
  SymbolTable,
  SyntaxKind,
  TemplateParameterDeclarationNode,
  TupleExpressionNode,
  TupleType,
  Type,
  TypeInstantiationMap,
  TypeReferenceNode,
  TypeSymbol,
  UnionExpressionNode,
  UnionType,
} from "./types.js";

export interface Checker {
  getTypeForNode(node: Node): Type;
  checkProgram(program: Program): void;
  checkModelProperty(prop: ModelPropertyNode): ModelTypeProperty;
  checkUnionExpression(node: UnionExpressionNode): UnionType;
  getGlobalNamespaceType(): NamespaceType;

  getLiteralType(node: StringLiteralNode): StringLiteralType;
  getLiteralType(node: NumericLiteralNode): NumericLiteralType;
  getLiteralType(node: BooleanLiteralNode): BooleanLiteralType;
  getLiteralType(node: LiteralNode): LiteralType;

  getTypeName(type: Type): string;
  getNamespaceString(type: NamespaceType | undefined): string;
}

/**
 * A map keyed by a set of objects.
 *
 * This is likely non-optimal.
 */
class MultiKeyMap<K extends object[], V> {
  #currentId = 0;
  #idMap = new WeakMap<object, number>();
  #items = new Map<string, V>();

  get(items: K): V | undefined {
    return this.#items.get(this.compositeKeyFor(items));
  }

  set(items: K, value: V): void {
    const key = this.compositeKeyFor(items);
    this.#items.set(key, value);
  }

  private compositeKeyFor(items: K) {
    return items.map((i) => this.keyFor(i)).join(",");
  }

  private keyFor(item: object) {
    if (this.#idMap.has(item)) {
      return this.#idMap.get(item);
    }

    const id = this.#currentId++;
    this.#idMap.set(item, id);
    return id;
  }
}

/**
 * Maps type arguments to type instantiation.
 */
const TypeInstantiationMap = class
  extends MultiKeyMap<Type[], Type>
  implements TypeInstantiationMap {};

interface PendingModelInfo {
  id: IdentifierNode;
  type: ModelType;
}

export function createChecker(program: Program): Checker {
  let templateInstantiation: Type[] = [];
  let instantiatingTemplate: Node | undefined;
  let currentSymbolId = 0;
  const symbolLinks = new Map<number, SymbolLinks>();
  const root = createType({
    kind: "Namespace",
    name: "",
    node: program.globalNamespace,
    models: new Map(),
    operations: new Map(),
    namespaces: new Map(),
    decorators: [],
  });

  const errorType: ErrorType = { kind: "Intrinsic", name: "ErrorType" };

  // This variable holds on to the model type that is currently
  // being instantiated in checkModelStatement so that it is
  // possible to have recursive type references in properties.
  let pendingModelType: PendingModelInfo | undefined = undefined;

  for (const file of program.sourceFiles.values()) {
    for (const using of file.usings) {
      const parentNs = using.parent! as NamespaceStatementNode | CadlScriptNode;
      const sym = resolveTypeReference(using.name);
      if (!sym) {
        continue;
      }
      if (sym.kind === "decorator") {
        program.reportDiagnostic("Can't use a decorator", using);
        continue;
      }

      if (sym.node.kind !== SyntaxKind.NamespaceStatement) {
        program.reportDiagnostic("Using must refer to a namespace", using);
        continue;
      }

      for (const [name, binding] of sym.node.exports!) {
        parentNs.locals!.set(name, binding);
      }
    }
  }

  return {
    getTypeForNode,
    checkProgram,
    checkModelProperty,
    checkUnionExpression,
    getLiteralType,
    getTypeName,
    getNamespaceString,
    getGlobalNamespaceType,
  };

  function getTypeForNode(node: Node): Type {
    switch (node.kind) {
      case SyntaxKind.ModelExpression:
        return checkModel(node);
      case SyntaxKind.ModelStatement:
        return checkModel(node);
      case SyntaxKind.ModelProperty:
        return checkModelProperty(node);
      case SyntaxKind.AliasStatement:
        return checkAlias(node);
      case SyntaxKind.EnumStatement:
        return checkEnum(node);
      case SyntaxKind.NamespaceStatement:
        return checkNamespace(node);
      case SyntaxKind.OperationStatement:
        return checkOperation(node);
      case SyntaxKind.NumericLiteral:
        return checkNumericLiteral(node);
      case SyntaxKind.BooleanLiteral:
        return checkBooleanLiteral(node);
      case SyntaxKind.TupleExpression:
        return checkTupleExpression(node);
      case SyntaxKind.StringLiteral:
        return checkStringLiteral(node);
      case SyntaxKind.ArrayExpression:
        return checkArrayExpression(node);
      case SyntaxKind.UnionExpression:
        return checkUnionExpression(node);
      case SyntaxKind.IntersectionExpression:
        return checkIntersectionExpression(node);
      case SyntaxKind.TypeReference:
        return checkTypeReference(node);
      case SyntaxKind.TemplateParameterDeclaration:
        return checkTemplateParameterDeclaration(node);
    }

    return errorType;
  }

  function getTypeName(type: Type): string {
    switch (type.kind) {
      case "Model":
        return getModelName(type);
      case "Enum":
        return getEnumName(type);
      case "Union":
        return type.options.map(getTypeName).join(" | ");
      case "Array":
        return getTypeName(type.elementType) + "[]";
      case "String":
      case "Number":
      case "Boolean":
        return type.value.toString();
    }

    return "(unnamed type)";
  }

  function getNamespaceString(type: NamespaceType | undefined): string {
    if (!type) return "";
    const parent = type.namespace;
    return parent && parent.name !== "" ? `${getNamespaceString(parent)}.${type.name}` : type.name;
  }

  function getEnumName(e: EnumType): string {
    const nsName = getNamespaceString(e.namespace);
    return nsName ? `${nsName}.${e.name}` : e.name;
  }

  function getModelName(model: ModelType) {
    const nsName = getNamespaceString(model.namespace);
    const modelName = (nsName ? nsName + "." : "") + (model.name || "(anonymous model)");
    if (model.templateArguments && model.templateArguments.length > 0) {
      // template instantiation
      const args = model.templateArguments.map(getTypeName);
      return `${modelName}<${args.join(", ")}>`;
    } else if ((model.node as ModelStatementNode).templateParameters?.length > 0) {
      // template
      const params = (model.node as ModelStatementNode).templateParameters.map((t) => t.id.sv);
      return `${model.name}<${params.join(", ")}>`;
    } else {
      // regular old model.
      return modelName;
    }
  }

  function checkTemplateParameterDeclaration(node: TemplateParameterDeclarationNode): Type {
    const parentNode = node.parent! as ModelStatementNode;

    if (instantiatingTemplate === parentNode) {
      const index = parentNode.templateParameters.findIndex((v) => v === node);
      return templateInstantiation[index];
    }

    return createType({
      kind: "TemplateParameter",
      node: node,
    });
  }

  function checkTypeReference(node: TypeReferenceNode): Type {
    const sym = resolveTypeReference(node);
    if (!sym) {
      return errorType;
    }

    if (sym.kind === "decorator") {
      program.reportDiagnostic("Can't put a decorator in a type", node);
      return errorType;
    }

    const symbolLinks = getSymbolLinks(sym);
    let args = node.arguments.map(getTypeForNode);

    if (
      sym.node.kind === SyntaxKind.ModelStatement ||
      sym.node.kind === SyntaxKind.AliasStatement
    ) {
      // model statement, possibly templated
      if (sym.node.templateParameters.length === 0) {
        if (args.length > 0) {
          program.reportDiagnostic(
            "Can't pass template arguments to model that is not templated",
            node
          );
        }

        if (symbolLinks.declaredType) {
          return symbolLinks.declaredType;
        } else if (pendingModelType && pendingModelType.id.sv === sym.node.id.sv) {
          return pendingModelType.type;
        }

        return sym.node.kind === SyntaxKind.ModelStatement
          ? checkModelStatement(sym.node)
          : checkAlias(sym.node);
      } else {
        // declaration is templated, lets instantiate.

        if (!symbolLinks.declaredType) {
          // we haven't checked the declared type yet, so do so.
          sym.node.kind === SyntaxKind.ModelStatement
            ? checkModelStatement(sym.node)
            : checkAlias(sym.node);
        }

        const templateParameters = sym.node.templateParameters;
        if (args.length < templateParameters.length) {
          program.reportDiagnostic("Too few template arguments provided.", node);
          args = [...args, ...new Array(templateParameters.length - args.length).fill(errorType)];
        } else if (args.length > templateParameters.length) {
          program.reportDiagnostic("Too many template arguments provided.", node);
          args = args.slice(0, templateParameters.length);
        }
        return instantiateTemplate(sym.node, args);
      }
    }
    // some other kind of reference

    if (args.length > 0) {
      program.reportDiagnostic("Can't pass template arguments to non-templated type", node);
    }

    if (sym.node.kind === SyntaxKind.TemplateParameterDeclaration) {
      const type = checkTemplateParameterDeclaration(sym.node);
      // TODO: could cache this probably.
      return type;
    }
    // types for non-templated types
    if (symbolLinks.type) {
      return symbolLinks.type;
    }

    const type = getTypeForNode(sym.node);
    symbolLinks.type = type;

    return type;
  }

  /**
   * Builds a model type from a template and its template arguments.
   * Adds the template node to a set we can check when we bind template
   * parameters to access type type arguments.
   *
   * This will fall over if the same template is ever being instantiated
   * twice at the same time, or if template parameters from more than one template
   * are ever in scope at once.
   */
  function instantiateTemplate(
    templateNode: ModelStatementNode | AliasStatementNode,
    args: Type[]
  ): Type {
    const symbolLinks = getSymbolLinks(templateNode.symbol!);
    const cached = symbolLinks.instantiations!.get(args) as ModelType;
    if (cached) {
      return cached;
    }

    const oldTis = templateInstantiation;
    const oldTemplate = instantiatingTemplate;
    templateInstantiation = args;
    instantiatingTemplate = templateNode;

    const type = getTypeForNode(templateNode);

    symbolLinks.instantiations!.set(args, type);
    if (type.kind === "Model") {
      type.templateNode = templateNode;
    }
    templateInstantiation = oldTis;
    instantiatingTemplate = oldTemplate;
    return type;
  }

  function checkUnionExpression(node: UnionExpressionNode): UnionType {
    const options = node.options.flatMap((o) => {
      const type = getTypeForNode(o);
      if (type.kind === "Union") {
        return type.options;
      }
      return type;
    });

    return createType({
      kind: "Union",
      node,
      options,
    });
  }

  function allModelTypes(types: Type[]): types is ModelType[] {
    return types.every((t) => t.kind === "Model");
  }

  /**
   * Intersection produces a model type from the properties of its operands.
   * So this doesn't work if we don't have a known set of properties (e.g.
   * with unions). The resulting model is anonymous.
   */
  function checkIntersectionExpression(node: IntersectionExpressionNode) {
    const optionTypes = node.options.map(getTypeForNode);
    if (!allModelTypes(optionTypes)) {
      program.reportDiagnostic("Cannot intersect non-model types (including union types).", node);
      return errorType;
    }

    const properties = new Map<string, ModelTypeProperty>();
    for (const option of optionTypes) {
      const allProps = walkPropertiesInherited(option);
      for (const prop of allProps) {
        if (properties.has(prop.name)) {
          program.reportDiagnostic(
            `Intersection contains duplicate property definitions for ${prop.name}`,
            node
          );
          continue;
        }

        const newPropType = createType({
          ...prop,
          sourceProperty: prop,
        });

        properties.set(prop.name, newPropType);
      }
    }

    const intersection = createType({
      kind: "Model",
      node,
      name: "",
      baseModels: [],
      properties: properties,
      decorators: [], // could probably include both sets of decorators here...
    });

    return intersection;
  }

  function checkArrayExpression(node: ArrayExpressionNode) {
    return createType({
      kind: "Array",
      node,
      elementType: getTypeForNode(node.elementType),
    });
  }

  function checkNamespace(node: NamespaceStatementNode) {
    const links = getSymbolLinks(node.symbol!);
    let type = links.type as NamespaceType;
    if (!type) {
      type = initializeTypeForNamespace(node);
    }

    if (Array.isArray(node.statements)) {
      node.statements.forEach(getTypeForNode);
    } else if (node.statements) {
      const subNs = checkNamespace(node.statements);
      type.namespaces.set(subNs.name, subNs);
    }
    return type;
  }

  function initializeTypeForNamespace(node: NamespaceStatementNode) {
    compilerAssert(node.symbol, "Namespace is unbound.", node);

    const symbolLinks = getSymbolLinks(node.symbol);
    if (!symbolLinks.type) {
      // haven't seen this namespace before
      const namespace = getParentNamespaceType(node);
      const name = node.name.sv;
      const decorators = checkDecorators(node);

      const type: NamespaceType = createType({
        kind: "Namespace",
        name,
        namespace,
        node,
        models: new Map(),
        operations: new Map(),
        namespaces: new Map(),
        decorators,
      });
      namespace?.namespaces.set(name, type);
      symbolLinks.type = type;
    } else {
      compilerAssert(
        symbolLinks.type.kind === "Namespace",
        "Got non-namespace type when resolving namespace"
      );
      // seen it before, need to execute the decorators on this node
      // against the type we've already made.
      symbolLinks.type.kind;
      const newDecorators = checkDecorators(node);
      symbolLinks.type.decorators.push(...newDecorators);

      for (const dec of newDecorators) {
        symbolLinks.type.decorators.push(dec);
        applyDecoratorToType(dec, symbolLinks.type);
      }
    }

    return symbolLinks.type as NamespaceType;
  }

  function getParentNamespaceType(
    node: ModelStatementNode | NamespaceStatementNode | OperationStatementNode | EnumStatementNode
  ): NamespaceType | undefined {
    if (node === root.node) return undefined;
    if (!node.namespaceSymbol) return root;

    const symbolLinks = getSymbolLinks(node.namespaceSymbol);
    compilerAssert(symbolLinks.type, "Parent namespace isn't typed yet.", node);
    return symbolLinks.type as NamespaceType;
  }

  function checkOperation(node: OperationStatementNode): OperationType {
    const namespace = getParentNamespaceType(node);
    const name = node.id.sv;
    const decorators = checkDecorators(node);
    const type = createType({
      kind: "Operation",
      name,
      namespace,
      node,
      parameters: getTypeForNode(node.parameters) as ModelType,
      returnType: getTypeForNode(node.returnType),
      decorators,
    });
    namespace?.operations.set(name, type);
    return type;
  }

  function getGlobalNamespaceType() {
    return root;
  }

  function checkTupleExpression(node: TupleExpressionNode): TupleType {
    return createType({
      kind: "Tuple",
      node: node,
      values: node.values.map((v) => getTypeForNode(v)),
    });
  }

  function getSymbolLinks(s: TypeSymbol): SymbolLinks {
    const id = getSymbolId(s);

    if (symbolLinks.has(id)) {
      return symbolLinks.get(id)!;
    }

    const links = {};
    symbolLinks.set(id, links);

    return links;
  }

  function getSymbolId(s: TypeSymbol) {
    if (s.id === undefined) {
      s.id = currentSymbolId++;
    }

    return s.id;
  }

  function resolveIdentifierInTable(
    node: IdentifierNode,
    table: SymbolTable,
    resolveDecorator = false
  ) {
    if (resolveDecorator) {
      return table.get("@" + node.sv);
    } else {
      return table.get(node.sv);
    }
  }

  function resolveIdentifier(node: IdentifierNode, resolveDecorator = false) {
    if (hasParseError(node)) {
      // Don't report synthetic identifiers used for parser error recovery.
      // The parse error is the root cause and will already have been logged.
      return undefined;
    }

    let scope: Node | undefined = node.parent;
    let binding;

    while (scope && scope.kind !== SyntaxKind.CadlScript) {
      if ("exports" in scope) {
        binding = resolveIdentifierInTable(node, scope.exports!, resolveDecorator);
        if (binding) return binding;
      }

      if ("locals" in scope) {
        binding = resolveIdentifierInTable(node, scope.locals!, resolveDecorator);
        if (binding) return binding;
      }

      scope = scope.parent;
    }

    if (!binding && scope && scope.kind === SyntaxKind.CadlScript) {
      // check any blockless namespace decls and global scope
      for (const ns of scope.inScopeNamespaces) {
        binding = resolveIdentifierInTable(node, ns.exports!, resolveDecorator);
        if (binding) return binding;
      }

      // check "global scope" usings
      binding = resolveIdentifierInTable(node, scope.locals, resolveDecorator);
      if (binding) return binding;
    }

    program.reportDiagnostic("Unknown identifier " + node.sv, node);
    return undefined;
  }

  function resolveTypeReference(
    node: ReferenceExpression,
    resolveDecorator = false
  ): DecoratorSymbol | TypeSymbol | undefined {
    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReference(node.target, resolveDecorator);
    }

    if (node.kind === SyntaxKind.MemberExpression) {
      const base = resolveTypeReference(node.base);
      if (!base) {
        return undefined;
      }
      if (base.kind === "type" && base.node.kind === SyntaxKind.NamespaceStatement) {
        const symbol = resolveIdentifierInTable(node.id, base.node.exports!, resolveDecorator);
        if (!symbol) {
          program.reportDiagnostic(`Namespace doesn't have member ${node.id.sv}`, node);
          return undefined;
        }
        return symbol;
      } else if (base.kind === "decorator") {
        program.reportDiagnostic(`Cannot resolve '${node.id.sv}' in decorator`, node);
        return undefined;
      } else {
        program.reportDiagnostic(
          `Cannot resolve '${node.id.sv}' in non-namespace node ${SyntaxKind[base.node.kind]}`,
          node
        );
        return undefined;
      }
    }

    if (node.kind === SyntaxKind.Identifier) {
      return resolveIdentifier(node, resolveDecorator);
    }

    compilerAssert(false, "Unknown type reference kind", node);
  }

  function checkStringLiteral(str: StringLiteralNode): StringLiteralType {
    return getLiteralType(str);
  }

  function checkNumericLiteral(num: NumericLiteralNode): NumericLiteralType {
    return getLiteralType(num);
  }

  function checkBooleanLiteral(bool: BooleanLiteralNode): BooleanLiteralType {
    return getLiteralType(bool);
  }

  function checkProgram(program: Program) {
    program.reportDuplicateSymbols(program.globalNamespace.exports!);
    for (const file of program.sourceFiles.values()) {
      program.reportDuplicateSymbols(file.locals!);
      for (const ns of file.namespaces) {
        program.reportDuplicateSymbols(ns.locals!);
        program.reportDuplicateSymbols(ns.exports!);

        initializeTypeForNamespace(ns);
      }
    }
    for (const file of program.sourceFiles.values()) {
      checkSourceFile(file);
    }
  }

  function checkSourceFile(file: CadlScriptNode) {
    for (const statement of file.statements) {
      getTypeForNode(statement);
    }
  }

  function checkModel(node: ModelExpressionNode | ModelStatementNode) {
    if (node.kind === SyntaxKind.ModelStatement) {
      return checkModelStatement(node);
    } else {
      return checkModelExpression(node);
    }
  }

  function checkModelStatement(node: ModelStatementNode) {
    const links = getSymbolLinks(node.symbol!);
    const instantiatingThisTemplate = instantiatingTemplate === node;

    if (links.declaredType && !instantiatingThisTemplate) {
      // we're not instantiating this model and we've already checked it
      return links.declaredType;
    }

    const isBase = checkModelIs(node.is);

    const decorators: DecoratorApplication[] = [];
    if (isBase) {
      // copy decorators
      decorators.push(...isBase.decorators);
    }
    decorators.push(...checkDecorators(node));

    const properties = new Map<string, ModelTypeProperty>();
    if (isBase) {
      for (const prop of isBase.properties.values()) {
        properties.set(
          prop.name,
          createType({
            ...prop,
          })
        );
      }
    }

    let baseModels;
    if (isBase) {
      baseModels = isBase.baseModels;
    } else {
      baseModels = checkClassHeritage(node.extends);
    }

    const type: ModelType = {
      kind: "Model",
      name: node.id.sv,
      node: node,
      properties,
      baseModels: baseModels,
      namespace: getParentNamespaceType(node),
      decorators,
    };

    // Hold on to the model type that's being defined so that it
    // can be referenced
    pendingModelType = {
      id: node.id,
      type,
    };

    const inheritedPropNames = new Set(
      Array.from(walkPropertiesInherited(type)).map((v) => v.name)
    );

    // Evaluate the properties after
    checkModelProperties(node, properties, inheritedPropNames);

    if (
      (instantiatingThisTemplate &&
        templateInstantiation.every((t) => t.kind !== "TemplateParameter")) ||
      node.templateParameters.length === 0
    ) {
      createType(type);
    }

    if (!instantiatingThisTemplate) {
      links.declaredType = type;
      links.instantiations = new TypeInstantiationMap();
      type.namespace?.models.set(type.name, type);
    }

    // The model is fully created now
    pendingModelType = undefined;

    return type;
  }

  function checkModelExpression(node: ModelExpressionNode) {
    const properties = new Map();
    checkModelProperties(node, properties);
    const type: ModelType = createType({
      kind: "Model",
      name: "",
      node: node,
      properties,
      baseModels: [],
      decorators: [],
    });

    return type;
  }

  function checkModelProperties(
    node: ModelExpressionNode | ModelStatementNode,
    properties: Map<string, ModelTypeProperty>,
    inheritedPropertyNames?: Set<string>
  ) {
    for (const prop of node.properties!) {
      if ("id" in prop) {
        const newProp = getTypeForNode(prop) as ModelTypeProperty;
        defineProperty(properties, newProp, inheritedPropertyNames);
      } else {
        // spread property
        const newProperties = checkSpreadProperty(prop.target);

        for (const newProp of newProperties) {
          defineProperty(properties, newProp, inheritedPropertyNames);
        }
      }
    }
  }

  function defineProperty(
    properties: Map<string, ModelTypeProperty>,
    newProp: ModelTypeProperty,
    inheritedPropertyNames?: Set<string>
  ) {
    if (properties.has(newProp.name)) {
      program.reportDiagnostic(`Model already has a property named ${newProp.name}`, newProp);
      return;
    }

    if (inheritedPropertyNames?.has(newProp.name)) {
      program.reportDiagnostic(
        `Model has an inherited property named ${newProp.name} which cannot be overridden`,
        newProp
      );
      return;
    }

    properties.set(newProp.name, newProp);
  }

  function checkClassHeritage(heritage: ReferenceExpression[]): ModelType[] {
    let baseModels = [];
    for (let heritageRef of heritage) {
      const heritageType = getTypeForNode(heritageRef);
      if (isErrorType(heritageType)) {
        compilerAssert(program.hasError(), "Should already have reported an error.", heritageRef);
        continue;
      }
      if (heritageType.kind !== "Model") {
        program.reportDiagnostic("Models must extend other models.", heritageRef);
        continue;
      }
      baseModels.push(heritageType);
    }
    return baseModels;
  }

  function checkModelIs(isExpr: ReferenceExpression | undefined): ModelType | undefined {
    if (!isExpr) return undefined;
    const isType = getTypeForNode(isExpr);

    if (isType.kind !== "Model") {
      program.reportDiagnostic("Model `is` must specify another model.", isExpr);
      return;
    }

    return isType;
  }

  function checkSpreadProperty(targetNode: ReferenceExpression): ModelTypeProperty[] {
    const props: ModelTypeProperty[] = [];
    const targetType = getTypeForNode(targetNode);

    if (targetType.kind != "TemplateParameter") {
      if (targetType.kind !== "Model") {
        program.reportDiagnostic("Cannot spread properties of non-model type.", targetNode);
        return props;
      }

      // copy each property
      for (const prop of walkPropertiesInherited(targetType)) {
        const newProp = createType({
          ...prop,
          sourceProperty: prop,
        });
        props.push(newProp);
      }
    }

    return props;
  }

  function* walkPropertiesInherited(model: ModelType) {
    const parents = [model];
    const props: ModelTypeProperty[] = [];

    while (parents.length > 0) {
      const parent = parents.pop()!;
      yield* parent.properties.values();
      parents.push(...parent.baseModels);
    }

    return props;
  }

  function checkModelProperty(prop: ModelPropertyNode): ModelTypeProperty {
    const decorators = checkDecorators(prop);
    if (prop.id.kind === SyntaxKind.Identifier) {
      return createType({
        kind: "ModelProperty",
        name: prop.id.sv,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
        decorators,
      });
    } else {
      const name = prop.id.value;
      return createType({
        kind: "ModelProperty",
        name,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
        decorators,
      });
    }
  }

  function checkDecorators(node: { decorators: DecoratorExpressionNode[] }) {
    const decorators: DecoratorApplication[] = [];
    for (const decNode of node.decorators) {
      const sym = resolveTypeReference(decNode.target, true);
      if (!sym) {
        program.reportDiagnostic("Unknown decorator", decNode);
        continue;
      }
      if (sym.kind !== "decorator") {
        program.reportDiagnostic(`${sym.name} is not a decorator`, decNode);
        continue;
      }

      const args = decNode.arguments.map(getTypeForNode).map((type) => {
        if (type.kind === "Number" || type.kind === "String" || type.kind === "Boolean") {
          return type.value;
        }

        return type;
      });

      decorators.push({
        decorator: sym.value,
        args,
      });
    }

    return decorators;
  }

  function checkAlias(node: AliasStatementNode): Type {
    const links = getSymbolLinks(node.symbol!);
    const instantiatingThisTemplate = instantiatingTemplate === node;

    if (links.declaredType && !instantiatingThisTemplate) {
      return links.declaredType;
    }

    const type = getTypeForNode(node.value);
    if (!instantiatingThisTemplate) {
      links.declaredType = type;
      links.instantiations = new TypeInstantiationMap();
    }

    return type;
  }

  function checkEnum(node: EnumStatementNode): Type {
    const links = getSymbolLinks(node.symbol!);

    if (!links.type) {
      const decorators = checkDecorators(node);
      const enumType: EnumType = {
        kind: "Enum",
        name: node.id.sv,
        node,
        members: [],
        namespace: getParentNamespaceType(node),
        decorators,
      };

      const memberNames = new Set<string>();

      for (const member of node.members) {
        const memberType = checkEnumMember(enumType, member, memberNames);
        if (memberType) {
          memberNames.add(memberType.name);
          enumType.members.push(memberType);
        }
      }

      createType(enumType);

      links.type = enumType;
    }

    return links.type;
  }

  function checkEnumMember(
    parentEnum: EnumType,
    node: EnumMemberNode,
    existingMemberNames: Set<string>
  ): EnumMemberType | undefined {
    const name = node.id.kind === SyntaxKind.Identifier ? node.id.sv : node.id.value;
    const value = node.value ? node.value.value : undefined;
    const decorators = checkDecorators(node);
    if (existingMemberNames.has(name)) {
      program.reportDiagnostic(`Enum already has a member named ${name}`, node);
      return;
    }
    return createType({
      kind: "EnumMember",
      enum: parentEnum,
      name,
      node,
      value,
      decorators,
    });
  }

  // the types here aren't ideal and could probably be refactored.
  function createType<T extends Type>(typeDef: T): T {
    (typeDef as any).templateArguments = templateInstantiation;

    if ("decorators" in typeDef) {
      for (const decApp of typeDef.decorators) {
        applyDecoratorToType(decApp, typeDef);
      }
    }

    return typeDef;
  }

  function applyDecoratorToType(decApp: DecoratorApplication, target: Type) {
    compilerAssert(
      "decorators" in target,
      "Cannot apply decorator to non-decoratable type",
      target
    );

    // peel `fn` off to avoid setting `this`.
    const fn = decApp.decorator;
    fn(program, target, ...decApp.args);
  }

  function getLiteralType(node: StringLiteralNode): StringLiteralType;
  function getLiteralType(node: NumericLiteralNode): NumericLiteralType;
  function getLiteralType(node: BooleanLiteralNode): BooleanLiteralType;
  function getLiteralType(node: LiteralNode): LiteralType;
  function getLiteralType(node: LiteralNode): LiteralType {
    let type = program.literalTypes.get(node.value);
    if (type) {
      return type;
    }

    switch (node.kind) {
      case SyntaxKind.StringLiteral:
        type = { kind: "String", node, value: node.value };
        break;
      case SyntaxKind.NumericLiteral:
        type = { kind: "Number", node, value: node.value };
        break;
      case SyntaxKind.BooleanLiteral:
        type = { kind: "Boolean", node, value: node.value };
        break;
    }

    program.literalTypes.set(node.value, type);
    return type;
  }
}

function isErrorType(type: Type): type is ErrorType {
  return type.kind === "Intrinsic" && type.name === "ErrorType";
}
