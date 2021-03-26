import { SymbolTable } from "./binder.js";
import { throwDiagnostic } from "./diagnostics.js";
import { Program } from "./program.js";
import {
  ArrayExpressionNode,
  BooleanLiteralNode,
  BooleanLiteralType,
  IdentifierNode,
  OperationStatementNode,
  NamespaceStatementNode,
  NamespaceType,
  OperationType,
  IntersectionExpressionNode,
  LiteralNode,
  LiteralType,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  ModelType,
  ModelTypeProperty,
  Node,
  NumericLiteralNode,
  NumericLiteralType,
  StringLiteralNode,
  StringLiteralType,
  SyntaxKind,
  TypeReferenceNode,
  TemplateParameterDeclarationNode,
  TupleExpressionNode,
  TupleType,
  Type,
  UnionExpressionNode,
  UnionType,
  ReferenceExpression,
  DecoratorSymbol,
  TypeSymbol,
  SymbolLinks,
  MemberExpressionNode,
  Sym,
  ADLScriptNode,
  IntrinsicType,
} from "./types.js";
import { reportDuplicateSymbols } from "./util.js";

/**
 * A map keyed by a set of objects. Used as a type cache where the base type
 * and any types in the instantiation set are used as keys.
 *
 * This is likely non-optimal.
 */
export class MultiKeyMap<T> {
  #currentId = 0;
  #idMap = new WeakMap<object, number>();
  #items = new Map<string, T>();

  get(items: Array<object>): T | undefined {
    return this.#items.get(this.compositeKeyFor(items));
  }

  set(items: Array<object>, value: any): string {
    const key = this.compositeKeyFor(items);
    this.#items.set(key, value);
    return key;
  }

  compositeKeyFor(items: Array<object>) {
    return items.map((i) => this.keyFor(i)).join(",");
  }

  keyFor(item: object) {
    if (this.#idMap.has(item)) {
      return this.#idMap.get(item);
    }

    const id = this.#currentId++;
    this.#idMap.set(item, id);
    return id;
  }
}

interface PendingModelInfo {
  id: IdentifierNode;
  type: ModelType;
}

export function createChecker(program: Program) {
  let templateInstantiation: Array<Type> = [];
  let instantiatingTemplate: Node | undefined;
  let currentSymbolId = 0;
  const symbolLinks = new Map<number, SymbolLinks>();
  const errorType: IntrinsicType = { kind: "Intrinsic", name: "ErrorType" };

  // This variable holds on to the model type that is currently
  // being instantiated in checkModelStatement so that it is
  // possible to have recursive type references in properties.
  let pendingModelType: PendingModelInfo | undefined = undefined;

  for (const file of program.sourceFiles) {
    for (const using of file.usings) {
      const parentNs = using.parent! as NamespaceStatementNode | ADLScriptNode;
      const sym = resolveTypeReference(using.name);
      if (sym.kind === "decorator") throwDiagnostic("Can't use a decorator", using);
      if (sym.node.kind !== SyntaxKind.NamespaceStatement) {
        throwDiagnostic("Using must refer to a namespace", using);
      }

      for (const [name, binding] of sym.node.exports!) {
        parentNs.locals!.set(name, binding);
      }
    }
  }

  reportDuplicateSymbols(program.globalNamespace.exports!);
  for (const file of program.sourceFiles) {
    reportDuplicateSymbols(file.locals!);
    for (const ns of file.namespaces) {
      reportDuplicateSymbols(ns.locals!);
      reportDuplicateSymbols(ns.exports!);
    }
  }

  return {
    getTypeForNode,
    checkProgram,
    getLiteralType,
    getTypeName,
    getNamespaceString,
    checkOperation,
  };

  function getTypeForNode(node: Node): Type {
    switch (node.kind) {
      case SyntaxKind.ModelExpression:
        return checkModel(node);
      case SyntaxKind.ModelStatement:
        return checkModel(node);
      case SyntaxKind.ModelProperty:
        return checkModelProperty(node);
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

    return parent ? `${getNamespaceString(parent)}.${type.name}` : type.name;
  }

  function getModelName(model: ModelType) {
    const nsName = getNamespaceString(model.namespace);
    const modelName = (nsName ? nsName + "." : "") + (model.name || "(anonymous model)");
    if (model.templateArguments && model.templateArguments.length > 0) {
      // template instantiation
      const args = model.templateArguments.map(getTypeName);
      return `${modelName}<${args.join(", ")}>`;
    } else if ((<ModelStatementNode>model.node).templateParameters?.length > 0) {
      // template
      const params = (<ModelStatementNode>model.node).templateParameters.map((t) => t.id.sv);
      return `${model.name}<${params.join(", ")}>`;
    } else {
      // regular old model.
      return modelName;
    }
  }

  function checkTemplateParameterDeclaration(node: TemplateParameterDeclarationNode): Type {
    const parentNode = <ModelStatementNode>node.parent!;

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
    if (sym.kind === "decorator") {
      throwDiagnostic("Can't put a decorator in a type", node);
    }

    const symbolLinks = getSymbolLinks(sym);
    const args = node.arguments.map(getTypeForNode);

    if (sym.node.kind === SyntaxKind.ModelStatement && !sym.node.assignment) {
      // model statement, possibly templated
      if (sym.node.templateParameters.length === 0) {
        if (args.length > 0) {
          throwDiagnostic("Can't pass template arguments to model that is not templated", node);
        }

        if (symbolLinks.declaredType) {
          return symbolLinks.declaredType;
        } else if (pendingModelType && pendingModelType.id.sv === sym.node.id.sv) {
          return pendingModelType.type;
        }

        return checkModelStatement(sym.node);
      } else {
        // model is templated, lets instantiate.

        if (!symbolLinks.declaredType) {
          // we haven't checked the declared type yet, so do so.
          checkModelStatement(sym.node);
        }
        if (sym.node.templateParameters!.length > node.arguments.length) {
          throwDiagnostic("Too few template arguments provided.", node);
        }

        if (sym.node.templateParameters!.length < node.arguments.length) {
          throwDiagnostic("Too many template arguments provided.", node);
        }

        return instantiateTemplate(sym.node, args);
      }
    }
    // some other kind of reference

    if (args.length > 0) {
      throwDiagnostic("Can't pass template arguments to non-templated type", node);
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
  function instantiateTemplate(templateNode: ModelStatementNode, args: Array<Type>): ModelType {
    const symbolLinks = getSymbolLinks(templateNode.symbol!);
    const cached = symbolLinks.instantiations!.get(args) as ModelType;
    if (cached) {
      return cached;
    }

    const oldTis = templateInstantiation;
    const oldTemplate = instantiatingTemplate;
    templateInstantiation = args;
    instantiatingTemplate = templateNode;
    // this cast is invalid once we support templatized `model =`.
    const type = <ModelType>getTypeForNode(templateNode);

    symbolLinks.instantiations!.set(args, type);

    type.templateNode = templateNode;
    templateInstantiation = oldTis;
    instantiatingTemplate = oldTemplate;
    return type;
  }

  function checkUnionExpression(node: UnionExpressionNode): UnionType {
    return createType({
      kind: "Union",
      node,
      options: node.options.map(getTypeForNode),
    });
  }

  function allModelTypes(types: Array<Type>): types is Array<ModelType> {
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
      throwDiagnostic("Cannot intersect non-model types (including union types).", node);
    }

    const properties = new Map<string, ModelTypeProperty>();
    for (const option of optionTypes) {
      const allProps = walkPropertiesInherited(option);
      for (const prop of allProps) {
        if (properties.has(prop.name)) {
          throwDiagnostic(
            `Intersection contains duplicate property definitions for ${prop.name}`,
            node
          );
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
    if (!links.type) {
      // haven't seen this namespace before
      const type: NamespaceType = createType({
        kind: "Namespace",
        name: node.name.sv,
        namespace: getParentNamespaceType(node),
        node: node,
        models: new Map(),
        operations: new Map(),
        namespaces: new Map(),
      });

      links.type = type;
    } else {
      // seen it before, need to execute the decorators on this node
      // against the type we've already made.
      for (const dec of node.decorators) {
        program.executeDecorator(dec, program, links.type);
      }
    }

    const type = links.type as NamespaceType;

    if (Array.isArray(node.statements)) {
      for (const statement of node.statements.map(getTypeForNode)) {
        switch (statement.kind) {
          case "Model":
            type.models.set(statement.name, statement as ModelType);
            break;
          case "Operation":
            type.operations.set(statement.name, statement as OperationType);
            break;
          case "Namespace":
            type.namespaces.set(statement.name, statement as NamespaceType);
            break;
        }
      }
    } else if (node.statements) {
      const subNs = checkNamespace(node.statements);
      type.namespaces.set(subNs.name, subNs);
    }
    return type;
  }

  function getParentNamespaceType(
    node: ModelStatementNode | NamespaceStatementNode | OperationStatementNode
  ): NamespaceType | undefined {
    if (!node.namespaceSymbol) return undefined;

    const symbolLinks = getSymbolLinks(node.namespaceSymbol);
    if (!symbolLinks.type) {
      throw new Error("Parent namespace isn't typed yet, please file a bug.");
    }
    return symbolLinks.type as NamespaceType;
  }

  function checkOperation(node: OperationStatementNode): OperationType {
    return createType({
      kind: "Operation",
      name: node.id.sv,
      namespace: getParentNamespaceType(node),
      node: node,
      parameters: <ModelType>getTypeForNode(node.parameters),
      returnType: getTypeForNode(node.returnType),
    });
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

  function resolveIdentifierInTable(node: IdentifierNode, table: SymbolTable) {
    return table.get(node.sv);
  }

  function resolveIdentifier(node: IdentifierNode) {
    let scope: Node | undefined = node.parent;
    let binding;

    while (scope && scope.kind !== SyntaxKind.ADLScript) {
      if ("exports" in scope) {
        binding = resolveIdentifierInTable(node, scope.exports!);
        if (binding) return binding;
      }

      if ("locals" in scope) {
        binding = resolveIdentifierInTable(node, scope.locals!);
        if (binding) return binding;
      }

      scope = scope.parent;
    }

    if (!binding && scope && scope.kind === SyntaxKind.ADLScript) {
      // check any blockless namespace decls and global scope
      for (const ns of scope.inScopeNamespaces) {
        binding = resolveIdentifierInTable(node, ns.exports!);
        if (binding) return binding;
      }
      
      // check "global scope" usings
      binding = resolveIdentifierInTable(node, scope.locals);
      if (binding) return binding;
    }

    
    throwDiagnostic("Unknown identifier " + node.sv, node);

  }

  function resolveTypeReference(node: ReferenceExpression): DecoratorSymbol | TypeSymbol {
    if (node.kind === SyntaxKind.TypeReference) {
      return resolveTypeReference(node.target);
    }

    if (node.kind === SyntaxKind.MemberExpression) {
      const base = resolveTypeReference(node.base);
      if (base.kind === "type" && base.node.kind === SyntaxKind.NamespaceStatement) {
        const symbol = resolveIdentifierInTable(node.id, base.node.exports!);
        if (!symbol) {
          throwDiagnostic(`Namespace doesn't have member ${node.id.sv}`, node);
        }
        return symbol;
      } else if (base.kind === "decorator") {
        throwDiagnostic(`Cannot resolve '${node.id.sv}' in decorator`, node);
      } else {
        throwDiagnostic(
          `Cannot resolve '${node.id.sv}' in non-namespace node ${base.node.kind}`,
          node
        );
      }
    }

    if (node.kind === SyntaxKind.Identifier) {
      return resolveIdentifier(node);
    }

    throw new Error("Unknown type reference kind");
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
    for (const file of program.sourceFiles) {
      checkSourceFile(file);
    }
  }

  function checkSourceFile(file: ADLScriptNode) {
    for (const statement of file.statements) {
      getTypeForNode(statement);
    }
  }

  function checkModel(node: ModelExpressionNode | ModelStatementNode) {
    if (node.kind === SyntaxKind.ModelStatement) {
      if (node.properties) {
        return checkModelStatement(node);
      } else {
        return checkModelEquals(node);
      }
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

    const baseModels = checkClassHeritage(node.heritage);
    const type: ModelType = {
      kind: "Model",
      name: node.id.sv,
      node: node,
      properties: new Map<string, ModelTypeProperty>(),
      baseModels: baseModels,
      namespace: getParentNamespaceType(node),
    };

    // Hold on to the model type that's being defined so that it
    // can be referenced
    pendingModelType = {
      id: node.id,
      type,
    };

    // Evaluate the properties after
    type.properties = checkModelProperties(node);

    if (
      (instantiatingThisTemplate &&
        templateInstantiation.every((t) => t.kind !== "TemplateParameter")) ||
      node.templateParameters.length === 0
    ) {
      createType(type);
    }

    if (!instantiatingThisTemplate) {
      links.declaredType = type;
      links.instantiations = new MultiKeyMap();
    }

    // The model is fully created now
    pendingModelType = undefined;

    return type;
  }

  function checkModelExpression(node: ModelExpressionNode) {
    const properties = checkModelProperties(node);
    const type: ModelType = createType({
      kind: "Model",
      name: "",
      node: node,
      properties,
      baseModels: [],
    });

    return type;
  }

  function checkModelProperties(node: ModelExpressionNode | ModelStatementNode) {
    const properties = new Map();
    for (const prop of node.properties!) {
      if ("id" in prop) {
        const propType = <ModelTypeProperty>getTypeForNode(prop);
        properties.set(propType.name, propType);
      } else {
        // spread property
        const newProperties = checkSpreadProperty(prop.target);

        for (const newProp of newProperties) {
          if (properties.has(newProp.name)) {
            throwDiagnostic(`Model already has a property named ${newProp.name}`, node);
          }

          properties.set(newProp.name, newProp);
        }
      }
    }

    return properties;
  }

  function checkModelEquals(node: ModelStatementNode) {
    // model =
    // this will likely have to change, as right now `model =` is really just
    // alias and so disappears. That means you can't easily rename symbols.
    const assignmentType = getTypeForNode((<ModelStatementNode>node).assignment!);

    if (assignmentType.kind === "Model") {
      const type: ModelType = createType({
        ...(<ModelType>assignmentType),
        node: node,
        name: (<ModelStatementNode>node).id.sv,
        assignmentType,
        namespace: getParentNamespaceType(node),
      });

      return type;
    }

    return assignmentType;
  }

  function checkClassHeritage(heritage: ReferenceExpression[]): ModelType[] {
    return heritage.map((heritageRef) => {
      const heritageType = getTypeForNode(heritageRef);

      if (heritageType.kind !== "Model") {
        throwDiagnostic("Models must extend other models.", heritageRef);
      }

      return heritageType;
    });
  }

  function checkSpreadProperty(targetNode: ReferenceExpression): ModelTypeProperty[] {
    const props: ModelTypeProperty[] = [];
    const targetType = getTypeForNode(targetNode);

    if (targetType.kind != "TemplateParameter") {
      if (targetType.kind !== "Model") {
        throwDiagnostic("Cannot spread properties of non-model type.", targetNode);
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
    if (prop.id.kind === SyntaxKind.Identifier) {
      return createType({
        kind: "ModelProperty",
        name: prop.id.sv,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
      });
    } else {
      const name = prop.id.value;
      return createType({
        kind: "ModelProperty",
        name,
        node: prop,
        optional: prop.optional,
        type: getTypeForNode(prop.value),
      });
    }
  }

  // the types here aren't ideal and could probably be refactored.
  function createType<T extends Type>(typeDef: T): T {
    (<any>typeDef).templateArguments = templateInstantiation;

    program.executeDecorators(typeDef);
    return typeDef;
  }

  function getLiteralType(node: StringLiteralNode): StringLiteralType;
  function getLiteralType(node: NumericLiteralNode): NumericLiteralType;
  function getLiteralType(node: BooleanLiteralNode): BooleanLiteralType;
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
