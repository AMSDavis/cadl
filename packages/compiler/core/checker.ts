import { createSymbolTable } from "./binder.js";
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
  InterfaceStatementNode,
  InterfaceType,
  IntersectionExpressionNode,
  JsSourceFile,
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
  Sym,
  SymbolLinks,
  SymbolTable,
  SyntaxKind,
  TemplateDeclarationNode,
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
  mergeJsSourceFile(file: JsSourceFile): void;
  mergeCadlSourceFile(file: CadlScriptNode): void;
  setUsingsForFile(file: CadlScriptNode): void;
  checkProgram(): void;
  checkSourceFile(file: CadlScriptNode): void;
  checkModelProperty(prop: ModelPropertyNode): ModelTypeProperty;
  checkUnionExpression(node: UnionExpressionNode): UnionType;
  getGlobalNamespaceType(): NamespaceType;
  getGlobalNamespaceNode(): NamespaceStatementNode;
  getMergedSymbol(sym: Sym | undefined): Sym | undefined;
  getMergedNamespace(node: NamespaceStatementNode): NamespaceStatementNode;
  getLiteralType(node: StringLiteralNode): StringLiteralType;
  getLiteralType(node: NumericLiteralNode): NumericLiteralType;
  getLiteralType(node: BooleanLiteralNode): BooleanLiteralType;
  getLiteralType(node: LiteralNode): LiteralType;
  getTypeName(type: Type): string;
  getNamespaceString(type: NamespaceType | undefined): string;
  cloneType<T extends Type>(type: T): T;
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
  const mergedSymbols = new Map<Sym, Sym>();
  const globalNamespaceNode = createGlobalNamespaceNode();
  const globalNamespaceType = createGlobalNamespaceType();
  let cadlNamespaceNode: NamespaceStatementNode | undefined;
  const errorType: ErrorType = { kind: "Intrinsic", name: "ErrorType" };

  // This variable holds on to the model type that is currently
  // being instantiated in checkModelStatement so that it is
  // possible to have recursive type references in properties.
  let pendingModelType: PendingModelInfo | undefined = undefined;
  for (const file of program.jsSourceFiles.values()) {
    mergeJsSourceFile(file);
  }
  for (const file of program.sourceFiles.values()) {
    mergeCadlSourceFile(file);
  }

  for (const file of program.sourceFiles.values()) {
    setUsingsForFile(file);
  }

  const cadlNamespaceBinding = globalNamespaceNode.exports?.get("Cadl");
  if (cadlNamespaceBinding) {
    // the cadl namespace binding will be absent if we've passed
    // the no-std-lib option.
    compilerAssert(cadlNamespaceBinding.kind === "type", "expected Cadl to be a type binding");
    compilerAssert(
      cadlNamespaceBinding.node.kind === SyntaxKind.NamespaceStatement,
      "expected Cadl to be a namespace"
    );
    cadlNamespaceNode = cadlNamespaceBinding.node;
    for (const file of program.sourceFiles.values()) {
      for (const [name, binding] of cadlNamespaceNode.exports!) {
        file.locals!.set(name, binding);
      }
    }
  }

  return {
    getTypeForNode,
    checkProgram,
    checkSourceFile,
    checkModelProperty,
    checkUnionExpression,
    getLiteralType,
    getTypeName,
    getNamespaceString,
    getGlobalNamespaceType,
    getGlobalNamespaceNode,
    mergeJsSourceFile,
    mergeCadlSourceFile,
    setUsingsForFile,
    getMergedSymbol,
    getMergedNamespace,
    cloneType,
  };

  function mergeJsSourceFile(file: JsSourceFile) {
    mergeSymbolTable(file.exports!, globalNamespaceNode.exports!);
  }

  function mergeCadlSourceFile(file: CadlScriptNode) {
    mergeSymbolTable(file.exports!, globalNamespaceNode.exports!);
  }

  function setUsingsForFile(file: CadlScriptNode) {
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

    if (cadlNamespaceNode) {
      for (const [name, binding] of cadlNamespaceNode.exports!) {
        file.locals!.set(name, binding);
      }
    }
  }

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
      case SyntaxKind.InterfaceStatement:
        return checkInterface(node);
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
      sym.node.kind === SyntaxKind.AliasStatement ||
      sym.node.kind === SyntaxKind.InterfaceStatement
    ) {
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
          : sym.node.kind === SyntaxKind.AliasStatement
          ? checkAlias(sym.node)
          : checkInterface(sym.node);
      } else {
        // declaration is templated, lets instantiate.

        if (!symbolLinks.declaredType) {
          // we haven't checked the declared type yet, so do so.
          sym.node.kind === SyntaxKind.ModelStatement
            ? checkModelStatement(sym.node)
            : sym.node.kind === SyntaxKind.AliasStatement
            ? checkAlias(sym.node)
            : checkInterface(sym.node);
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
    templateNode: ModelStatementNode | AliasStatementNode | InterfaceStatementNode,
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
    const links = getSymbolLinks(getMergedSymbol(node.symbol!) as TypeSymbol);
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

    const symbolLinks = getSymbolLinks(getMergedSymbol(node.symbol) as TypeSymbol);
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
        interfaces: new Map(),
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
    node:
      | ModelStatementNode
      | NamespaceStatementNode
      | OperationStatementNode
      | EnumStatementNode
      | InterfaceStatementNode
  ): NamespaceType | undefined {
    if (node === globalNamespaceType.node) return undefined;
    if (!node.namespaceSymbol) return globalNamespaceType;

    const mergedSymbol = getMergedSymbol(node.namespaceSymbol) as TypeSymbol;
    const symbolLinks = getSymbolLinks(mergedSymbol);
    if (!symbolLinks.type) {
      // in general namespaces should be typed before anything calls this function.
      // However, one case where this is not true is when a decorator on a namespace
      // refers to a model in another namespace. In this case, we need to evaluate
      // the namespace here.
      symbolLinks.type = initializeTypeForNamespace(mergedSymbol.node as NamespaceStatementNode);
    }

    return symbolLinks.type as NamespaceType;
  }

  function checkOperation(node: OperationStatementNode): OperationType {
    const namespace = getParentNamespaceType(node);
    const name = node.id.sv;
    const decorators = checkDecorators(node);
    const type: OperationType = {
      kind: "Operation",
      name,
      namespace,
      node,
      parameters: getTypeForNode(node.parameters) as ModelType,
      returnType: getTypeForNode(node.returnType),
      decorators,
    };

    if (
      node.parent!.kind !== SyntaxKind.InterfaceStatement ||
      shouldCreateTypeForTemplate(node.parent!)
    ) {
    }

    if (node.parent!.kind === SyntaxKind.InterfaceStatement) {
      if (shouldCreateTypeForTemplate(node.parent!)) {
        createType(type);
      }
    } else {
      createType(type);
      namespace?.operations.set(name, type);
    }

    return type;
  }

  function getGlobalNamespaceType() {
    return globalNamespaceType;
  }

  function getGlobalNamespaceNode() {
    return globalNamespaceNode;
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
    let sym;
    if (resolveDecorator) {
      sym = table.get("@" + node.sv);
    } else {
      sym = table.get(node.sv);
    }

    return getMergedSymbol(sym);
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
        const mergedSymbol = getMergedSymbol(scope.symbol) as TypeSymbol;
        binding = resolveIdentifierInTable(
          node,
          (mergedSymbol.node as any).exports!,
          resolveDecorator
        );
        if (binding) return binding;
      }

      if ("locals" in scope) {
        binding = resolveIdentifierInTable(node, scope.locals!, resolveDecorator);
        if (binding) return binding;
      }

      scope = scope.parent;
    }

    if (!binding && scope && scope.kind === SyntaxKind.CadlScript) {
      // check any blockless namespace decls
      for (const ns of scope.inScopeNamespaces) {
        const mergedSymbol = getMergedSymbol(ns.symbol) as TypeSymbol;
        binding = resolveIdentifierInTable(
          node,
          (mergedSymbol.node as any).exports!,
          resolveDecorator
        );
        if (binding) return binding;
      }

      // check "global scope" declarations
      binding = resolveIdentifierInTable(node, globalNamespaceNode.exports!, resolveDecorator);
      if (binding) return binding;

      // check "global scope" usings
      binding = resolveIdentifierInTable(node, scope.locals!, resolveDecorator);
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

  function checkProgram() {
    program.reportDuplicateSymbols(globalNamespaceNode.exports!);
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
      baseModels = isBase.baseModel;
    } else if (node.extends) {
      baseModels = checkClassHeritage(node.extends);
    }

    const type: ModelType = {
      kind: "Model",
      name: node.id.sv,
      node: node,
      properties,
      baseModel: baseModels,
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

    if (shouldCreateTypeForTemplate(node)) {
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

  function shouldCreateTypeForTemplate(node: TemplateDeclarationNode) {
    const instantiatingThisTemplate = instantiatingTemplate === node;

    return (
      (instantiatingThisTemplate &&
        templateInstantiation.every((t) => t.kind !== "TemplateParameter")) ||
      node.templateParameters.length === 0
    );
  }

  function checkModelExpression(node: ModelExpressionNode) {
    const properties = new Map();
    checkModelProperties(node, properties);
    const type: ModelType = createType({
      kind: "Model",
      name: "",
      node: node,
      properties,
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

  function checkClassHeritage(heritageRef: ReferenceExpression): ModelType | undefined {
    const heritageType = getTypeForNode(heritageRef);
    if (isErrorType(heritageType)) {
      compilerAssert(program.hasError(), "Should already have reported an error.", heritageRef);
      return undefined;
    }

    if (heritageType.kind !== "Model") {
      program.reportDiagnostic("Models must extend other models.", heritageRef);
      return undefined;
    }

    return heritageType;
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
        const newProp = cloneType(prop, { sourceProperty: prop });
        props.push(newProp);
      }
    }

    return props;
  }

  function* walkPropertiesInherited(model: ModelType) {
    let current: ModelType | undefined = model;

    while (current) {
      yield* current.properties.values();
      current = current.baseModel;
    }
  }

  function checkModelProperty(prop: ModelPropertyNode): ModelTypeProperty {
    const decorators = checkDecorators(prop);
    let type: ModelTypeProperty;
    if (prop.id.kind === SyntaxKind.Identifier) {
      type = {
        kind: "ModelProperty",
        name: prop.id.sv,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
        decorators,
      };
    } else {
      const name = prop.id.value;
      type = {
        kind: "ModelProperty",
        name,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
        decorators,
      };
    }

    const parentModel = prop.parent! as
      | ModelStatementNode
      | ModelExpressionNode
      | OperationStatementNode;
    if (
      parentModel.kind !== SyntaxKind.ModelStatement ||
      shouldCreateTypeForTemplate(parentModel)
    ) {
      createType(type);
    }

    return type;
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

      decorators.unshift({
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

  function checkInterface(node: InterfaceStatementNode): InterfaceType {
    const links = getSymbolLinks(node.symbol!);
    const instantiatingThisTemplate = instantiatingTemplate === node;

    if (links.declaredType && !instantiatingThisTemplate) {
      // we're not instantiating this interface and we've already checked it
      return links.declaredType as InterfaceType;
    }

    const decorators = checkDecorators(node);

    const interfaceType: InterfaceType = {
      kind: "Interface",
      decorators,
      node,
      namespace: getParentNamespaceType(node),
      operations: new Map(),
      name: node.id.sv,
    };

    for (const mixinNode of node.mixes) {
      const mixinType = getTypeForNode(mixinNode);
      if (mixinType.kind !== "Interface") {
        program.reportDiagnostic("Interfaces can only mix other interfaces", mixinNode);
        continue;
      }

      for (const newMember of mixinType.operations.values()) {
        if (interfaceType.operations.has(newMember.name)) {
          program.reportDiagnostic(
            `Interface mixes cannot have duplicate members. The duplicate member is named ${newMember.name}`,
            mixinNode
          );
        }

        interfaceType.operations.set(newMember.name, cloneType(newMember));
      }
    }

    const ownMembers = new Map<string, OperationType>();

    checkInterfaceMembers(node, ownMembers);

    for (const [k, v] of ownMembers) {
      // don't do a duplicate check here because interface members can override
      // an member coming from a mixin.
      interfaceType.operations.set(k, v);
    }

    if (
      (instantiatingThisTemplate &&
        templateInstantiation.every((t) => t.kind !== "TemplateParameter")) ||
      node.templateParameters.length === 0
    ) {
      createType(interfaceType);
    }

    if (!instantiatingThisTemplate) {
      links.declaredType = interfaceType;
      links.instantiations = new TypeInstantiationMap();
      interfaceType.namespace?.interfaces.set(interfaceType.name, interfaceType);
    }

    return interfaceType;
  }

  function checkInterfaceMembers(
    node: InterfaceStatementNode,
    members: Map<string, OperationType>
  ) {
    for (const opNode of node.operations) {
      const opType = checkOperation(opNode);
      if (members.has(opType.name)) {
        program.reportDiagnostic(`Interface already has a member named ${opType.name}`, opNode);
        continue;
      }
      members.set(opType.name, opType);
    }
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

    try {
      const fn = decApp.decorator;
      fn(program, target, ...decApp.args);
    } catch (err) {
      // do not fail the language server for exceptions in decorators
      if (program.compilerOptions.designTimeBuild) {
        program.reportDiagnostic(`${decApp.decorator.name} failed with errors. ${err}`, target);
      } else {
        throw err;
      }
    }
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

  function mergeSymbolTable(source: SymbolTable, target: SymbolTable) {
    for (const dupe of source.duplicates) {
      target.duplicates.add(dupe);
    }
    for (const [key, sourceBinding] of source) {
      if (
        sourceBinding.kind === "type" &&
        sourceBinding.node.kind === SyntaxKind.NamespaceStatement
      ) {
        // we are merging a namespace symbol. See if is an existing namespace symbol
        // to merge with.
        let existingBinding = target.get(key);

        if (!existingBinding) {
          existingBinding = {
            kind: "type",
            node: sourceBinding.node,
            name: sourceBinding.name,
            id: sourceBinding.id,
          };
          target.set(key, existingBinding);
          mergedSymbols.set(sourceBinding, existingBinding);
        } else if (
          existingBinding.kind === "type" &&
          existingBinding.node.kind === SyntaxKind.NamespaceStatement
        ) {
          mergedSymbols.set(sourceBinding, existingBinding);
          // merge the namespaces
          mergeSymbolTable(sourceBinding.node.exports!, existingBinding.node.exports!);
        } else {
          target.set(key, sourceBinding);
        }
      } else {
        target.set(key, sourceBinding);
      }
    }
  }

  function getMergedSymbol(sym: Sym | undefined): Sym | undefined {
    if (!sym) return sym;
    return mergedSymbols.get(sym) || sym;
  }

  function getMergedNamespace(node: NamespaceStatementNode): NamespaceStatementNode {
    const sym = getMergedSymbol(node.symbol) as TypeSymbol;
    return sym.node as NamespaceStatementNode;
  }

  function createGlobalNamespaceNode(): NamespaceStatementNode {
    const nsId: IdentifierNode = {
      kind: SyntaxKind.Identifier,
      pos: 0,
      end: 0,
      sv: "__GLOBAL_NS",
    };

    return {
      kind: SyntaxKind.NamespaceStatement,
      decorators: [],
      pos: 0,
      end: 0,
      name: nsId,
      locals: createSymbolTable(),
      exports: createSymbolTable(),
    };
  }

  function createGlobalNamespaceType() {
    return createType({
      kind: "Namespace",
      name: "",
      node: globalNamespaceNode,
      models: new Map(),
      operations: new Map(),
      namespaces: new Map(),
      interfaces: new Map(),
      decorators: [],
    });
  }

  function cloneType<T extends Type>(type: T, additionalProps: { [P in keyof T]?: T[P] } = {}): T {
    return createType({
      ...type,
      ...additionalProps,
    });
  }

  /**
   * useful utility function to debug the scopes produced by the binder,
   * the result of symbol merging, and identifier resolution.
   */
  function dumpScope(scope = globalNamespaceNode, indent = 0) {
    if (scope.locals) {
      console.log(`${Array(indent * 2).join(" ")}-locals:`);
      for (const [name, sym] of scope.locals) {
        console.log(
          `${Array(indent * 2 + 1).join(" ")}${name} => ${
            sym.kind === "type" ? SyntaxKind[sym.node.kind] : "[fn]"
          }`
        );
      }
    }
    console.log(`${Array(indent * 2).join(" ")}-exports:`);
    for (const [name, sym] of scope.exports!) {
      console.log(
        `${Array(indent * 2 + 1).join(" ")}${name} => ${
          sym.kind === "type" ? SyntaxKind[sym.node.kind] : "[fn]"
        }`
      );
      if (sym.kind === "type" && sym.node.kind == SyntaxKind.NamespaceStatement) {
        dumpScope(sym.node, indent + 1);
      }
    }
  }
}

function isErrorType(type: Type): type is ErrorType {
  return type.kind === "Intrinsic" && type.name === "ErrorType";
}
