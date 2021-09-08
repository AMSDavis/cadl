import {
  ArrayType,
  EnumMemberType,
  EnumType,
  getAllTags,
  getDoc,
  getFormat,
  getMaxLength,
  getMinLength,
  getMinValue,
  getVisibility,
  isErrorType,
  isIntrinsic,
  isList,
  isNumericType,
  isSecret,
  isStringType,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  StringLiteralType,
  SyntaxKind,
  Type,
  UnionType,
} from "@cadl-lang/compiler";
import {
  basePathForResource,
  checkIfServiceNamespace,
  getConsumes,
  getHeaderFieldName,
  getOperationRoute,
  getPathParamName,
  getProduces,
  getQueryParamName,
  getResources,
  getServiceHost,
  getServiceNamespaceString,
  getServiceTitle,
  getServiceVersion,
  HttpVerb,
  isBody,
  isHeader,
} from "@cadl-lang/rest";
import * as path from "path";

export async function $onBuild(p: Program) {
  const options: OpenAPIEmitterOptions = {
    outputFile: p.compilerOptions.swaggerOutputFile || path.resolve("./openapi.json"),
  };

  const emitter = createOAPIEmitter(p, options);
  await emitter.emitOpenAPI();
}

const operationIdsKey = Symbol();
export function $operationId(program: Program, entity: Type, opId: string) {
  program.stateMap(operationIdsKey).set(entity, opId);
}

const pageableOperationsKey = Symbol();
export function $pageable(program: Program, entity: Type, nextLinkName: string = "nextLink") {
  program.stateMap(pageableOperationsKey).set(entity, nextLinkName);
}

function getPageable(program: Program, entity: Type): string | undefined {
  return program.stateMap(pageableOperationsKey).get(entity);
}

const refTargetsKey = Symbol();

export function $useRef(program: Program, entity: Type, refUrl: string): void {
  if (entity.kind === "Model" || entity.kind === "ModelProperty") {
    program.stateMap(refTargetsKey).set(entity, refUrl);
  } else {
    program.reportDiagnostic(
      "@useRef decorator can only be applied to models and operation parameters.",
      entity
    );
  }
}

function getRef(program: Program, entity: Type): string | undefined {
  return program.stateMap(refTargetsKey).get(entity);
}

// NOTE: These functions aren't meant to be used directly as decorators but as a
// helper functions for other decorators.  The security information given here
// will be inserted into the `security` and `securityDefinitions` sections of
// the emitted OpenAPI document.

const securityDetailsKey = Symbol();
const securityRequirementsKey = "requirements";
const securityDefinitionsKey = "definitions";

function getSecurityRequirements(program: Program) {
  const definitions = program.stateMap(securityDetailsKey);
  return definitions?.has(securityRequirementsKey) ? definitions.get(securityRequirementsKey) : [];
}

function setSecurityRequirements(program: Program, requirements: any[]) {
  program.stateMap(securityDetailsKey).set(securityRequirementsKey, requirements);
}

function getSecurityDefinitions(program: Program) {
  const definitions = program.stateMap(securityDetailsKey);
  return definitions?.has(securityDefinitionsKey) ? definitions.get(securityDefinitionsKey) : {};
}

function setSecurityDefinitions(program: Program, definitions: any) {
  program.stateMap(securityDetailsKey).set(securityDefinitionsKey, definitions);
}

export function addSecurityRequirement(
  program: Program,
  namespace: NamespaceType,
  name: string,
  scopes: string[]
): void {
  if (!checkIfServiceNamespace(program, namespace)) {
    program.reportDiagnostic(
      "Cannot add security details to a namespace other than the service namespace.",
      namespace
    );
  }

  const req: any = {};
  req[name] = scopes;
  const requirements = getSecurityRequirements(program);
  requirements.push(req);
  setSecurityRequirements(program, requirements);
}

export function addSecurityDefinition(
  program: Program,
  namespace: NamespaceType,
  name: string,
  details: any
): void {
  if (!checkIfServiceNamespace(program, namespace)) {
    program.reportDiagnostic(
      "Cannot add security details to a namespace other than the service namespace.",
      namespace
    );
    return;
  }

  const definitions = getSecurityDefinitions(program);
  definitions[name] = details;
  setSecurityDefinitions(program, definitions);
}

const openApiExtensions = new Map<Type, Map<string, any>>();
export function $extension(program: Program, entity: Type, extensionName: string, value: any) {
  let typeExtensions = openApiExtensions.get(entity) ?? new Map<string, any>();
  typeExtensions.set(extensionName, value);
  openApiExtensions.set(entity, typeExtensions);
}

export function $asyncOperationOptions(program: Program, entity: Type, finalStateVia: string) {
  let typeExtensions = openApiExtensions.get(entity) ?? new Map<string, any>();
  typeExtensions.set("x-ms-long-running-operation-options", { "final-state-via": finalStateVia });
  openApiExtensions.set(entity, typeExtensions);
}

function getExtensions(entity: Type): Map<string, any> {
  return openApiExtensions.get(entity) ?? new Map<string, any>();
}

export interface OpenAPIEmitterOptions {
  outputFile: string;
}

function createOAPIEmitter(program: Program, options: OpenAPIEmitterOptions) {
  const root: any = {
    swagger: "2.0",
    info: {
      title: getServiceTitle(program),
      version: getServiceVersion(program),
    },
    host: getServiceHost(program),
    schemes: ["https"],
    produces: [], // Pre-initialize produces and consumes so that
    consumes: [], // they show up at the top of the document
    security: getSecurityRequirements(program),
    securityDefinitions: getSecurityDefinitions(program),
    tags: [],
    paths: {},
    "x-ms-paths": {},
    definitions: {},
    parameters: {},
  };

  // Get the service namespace string for use in name shortening
  const serviceNamespace: string | undefined = getServiceNamespaceString(program);

  let currentBasePath: string | undefined = "";
  let currentPath: any = root.paths;
  let currentEndpoint: any;

  // Keep a list of all Types encountered that need schema definitions
  const schemas = new Set<Type>();

  // Map model properties that represent shared parameters to their parameter
  // definition that will go in #/parameters. Inlined parameters do not go in
  // this map.
  const params = new Map<ModelTypeProperty, any>();

  // De-dupe the per-endpoint tags that will be added into the #/tags
  const tags = new Set<string>();

  // The set of produces/consumes values found in all operations
  const globalProduces = new Set<string>();
  const globalConsumes = new Set<string>();

  return { emitOpenAPI };

  async function emitOpenAPI() {
    try {
      for (let resource of getResources(program)) {
        if (resource.kind !== "Namespace") {
          program.reportDiagnostic("Resource goes on namespace", resource);
          continue;
        }

        emitResource(resource as NamespaceType);
      }
      emitReferences();
      emitTags();

      // Finalize global produces/consumes
      if (globalProduces.size > 0) {
        root.produces = [...globalProduces.values()];
      } else {
        delete root.produces;
      }
      if (globalConsumes.size > 0) {
        root.consumes = [...globalConsumes.values()];
      } else {
        delete root.consumes;
      }

      // Clean up empty entries
      if (Object.keys(root["x-ms-paths"]).length === 0) {
        delete root["x-ms-paths"];
      }
      if (Object.keys(root.security).length === 0) {
        delete root["security"];
      }
      if (Object.keys(root.securityDefinitions).length === 0) {
        delete root["securityDefinitions"];
      }

      if (!program.compilerOptions.noEmit && !program.hasError()) {
        // Write out the OpenAPI document to the output path
        await program.host.writeFile(
          path.resolve(options.outputFile),
          prettierOutput(JSON.stringify(root, null, 2))
        );
      }
    } catch (err) {
      if (err instanceof ErrorTypeFoundError) {
        // Return early, there must be a parse error if an ErrorType was
        // inserted into the Cadl output
        return;
      } else {
        throw err;
      }
    }
  }

  function emitResource(resource: NamespaceType): void {
    currentBasePath = basePathForResource(program, resource);

    // Gather produces/consumes data up the namespace hierarchy
    let currentNamespace: NamespaceType | undefined = resource;
    while (currentNamespace) {
      getProduces(program, currentNamespace).forEach((p) => globalProduces.add(p));
      getConsumes(program, currentNamespace).forEach((c) => globalConsumes.add(c));
      currentNamespace = currentNamespace.namespace;
    }

    for (const [name, op] of resource.operations) {
      emitEndpoint(resource, op);
    }
  }

  function getPathParameters(ns: NamespaceType, op: OperationType) {
    return [...(op.parameters?.properties.values() ?? [])].filter(
      (param) => getPathParamName(program, param) !== undefined
    );
  }

  /**
   * Translates endpoint names like `read` to REST verbs like `get`.
   */
  function pathForEndpoint(
    op: OperationType,
    pathParams: ModelTypeProperty[]
  ): [string, string[], string] {
    const paramByName = new Map(pathParams.map((p) => [p.name, p]));
    const route = getOperationRoute(program, op);
    const inferredVerb = verbForEndpoint(op.name);
    const verb = route?.verb || inferredVerb || "get";

    // Build the full route path including any sub-path
    const routePath =
      (currentBasePath || "") +
      (route?.subPath
        ? `/${route?.subPath?.replace(/^\//g, "")}`
        : !inferredVerb && !route
        ? "/get"
        : "");

    // Find path parameter names
    const declaredPathParamNames = routePath.match(/\{\w+\}/g)?.map((s) => s.slice(1, -1)) ?? [];

    // For each param in the declared path parameters (e.g. /foo/{id} has one, id),
    // delete it because it doesn't need to be added to the path.
    for (const declaredParam of declaredPathParamNames) {
      const param = paramByName.get(declaredParam);
      if (!param) {
        program.reportDiagnostic(
          `Path contains parameter ${declaredParam} but wasn't found in given parameters`,
          op
        );
        continue;
      }

      paramByName.delete(declaredParam);
    }

    // Add any remaining declared path params
    const pathSegments = [];
    for (const name of paramByName.keys()) {
      pathSegments.push(name);
    }

    return [verb, pathSegments, routePath];
  }

  function verbForEndpoint(name: string): HttpVerb | undefined {
    switch (name) {
      case "list":
        return "get";
      case "create":
        return "post";
      case "read":
        return "get";
      case "update":
        return "get";
      case "delete":
        return "delete";
      case "deleteAll":
        return "delete";
    }

    return undefined;
  }

  function addProduces(producesValue: string) {
    if (globalProduces.size < 1) {
      globalProduces.add(producesValue);
    }

    if (!globalProduces.has(producesValue)) {
      if (!currentEndpoint.produces) {
        currentEndpoint.produces = [];
      }

      if (!currentEndpoint.produces.includes(producesValue)) {
        currentEndpoint.produces.push(producesValue);
      }
    }
  }

  function addConsumes(consumesValue: string) {
    if (globalConsumes.size < 1) {
      globalConsumes.add(consumesValue);
    }

    if (!globalConsumes.has(consumesValue)) {
      if (!currentEndpoint.consumes) {
        currentEndpoint.consumes = [];
      }

      if (!currentEndpoint.consumes.includes(consumesValue)) {
        currentEndpoint.consumes.push(consumesValue);
      }
    }
  }

  function emitEndpoint(resource: NamespaceType, op: OperationType) {
    const params = getPathParameters(resource, op);
    const [verb, newPathParams, resolvedPath] = pathForEndpoint(op, params);
    const fullPath =
      resolvedPath +
      (newPathParams.length > 0 ? "/" + newPathParams.map((p) => "{" + p + "}").join("/") : "");

    // If path contains a literal query string parameter, add it to x-ms-paths instead
    let pathsObject = fullPath.indexOf("?") < 0 ? root.paths : root["x-ms-paths"];

    if (!pathsObject[fullPath]) {
      pathsObject[fullPath] = {};
    }

    currentPath = pathsObject[fullPath];
    if (!currentPath[verb]) {
      currentPath[verb] = {};
    }
    currentEndpoint = currentPath[verb];

    if (program.stateMap(operationIdsKey).has(op)) {
      currentEndpoint.operationId = program.stateMap(operationIdsKey).get(op);
    } else {
      // Synthesize an operation ID
      currentEndpoint.operationId = `${resource.name}_${op.name}`;
    }

    // allow operation extensions
    attachExtensions(op, currentEndpoint);
    currentEndpoint.summary = getDoc(program, op);
    currentEndpoint.parameters = [];
    currentEndpoint.responses = {};

    const currentTags = getAllTags(program, resource, op);
    if (currentTags) {
      currentEndpoint.tags = currentTags;
      for (const tag of currentTags) {
        // Add to root tags if not already there
        tags.add(tag);
      }
    }

    if (isList(program, op) || getPageable(program, op)) {
      const nextLinkName = getPageable(program, op) || "nextLink";
      if (nextLinkName) {
        currentEndpoint["x-ms-pageable"] = {
          nextLinkName,
        };
      }
    }

    emitEndpointParameters(op, op.parameters, [...(op.parameters?.properties.values() ?? [])]);
    emitResponses(op.returnType);
  }

  function emitResponses(responseType: Type) {
    if (responseType.kind === "Union") {
      for (const [i, option] of responseType.options.entries()) {
        emitResponseObject(option, i === 0 ? "200" : "default");
      }
    } else {
      emitResponseObject(responseType);
    }
  }

  function emitResponseObject(responseModel: Type, statusCode: string = "200") {
    if (
      responseModel.kind === "Model" &&
      responseModel.baseModels.length === 0 &&
      responseModel.properties.size === 0
    ) {
      currentEndpoint.responses[200] = {
        description: "Null response",
      };

      return;
    }

    let contentType = "application/json";
    const response: any = {};

    let bodyModel = responseModel;
    if (responseModel.kind === "Model") {
      for (const prop of responseModel.properties.values()) {
        if (isBody(program, prop)) {
          if (bodyModel !== responseModel) {
            program.reportDiagnostic(
              "Duplicate @body declarations on response type",
              responseModel
            );
            continue;
          }

          bodyModel = prop.type;
        }
        const type = prop.type;
        const headerName = getHeaderFieldName(program, prop);
        switch (headerName) {
          case undefined:
            break;
          case "status-code":
            if (type.kind === "Number") {
              statusCode = String(type.value);
            }
            break;
          case "content-type":
            if (type.kind === "String") {
              contentType = type.value;
            }
            break;
          default:
            const header = getResponseHeader(prop);
            response.headers = response.headers ?? {};
            response.headers[headerName] = header;
            break;
        }
      }
    }

    response.description = getResponseDescription(responseModel, statusCode);
    if (!isEmptyResponse(bodyModel)) {
      let responseSchema = getSchemaOrRef(bodyModel);
      response.schema = responseSchema;
    }

    addProduces(contentType);
    currentEndpoint.responses[statusCode] = response;
  }

  function isEmptyResponse(adlType: Type) {
    switch (adlType.kind) {
      case "TemplateParameter":
        {
          if (adlType.instantiationParameters) {
            for (let element of adlType.instantiationParameters) {
              if (!isEmptyResponse(element)) return false;
            }
          }
        }
        return true;
      case "Model": {
        if (isIntrinsic(program, adlType)) {
          return false;
        }
        if (adlType.properties) {
          for (let element of adlType.properties.values()) {
            if (!isHeader(program, element)) return false;
          }
        }
        if (adlType.baseModels) {
          for (let element of adlType.baseModels) {
            if (!isEmptyResponse(element)) return false;
          }
        }
        if (adlType.templateArguments) {
          for (let element of adlType.templateArguments) {
            if (!isEmptyResponse(element)) return false;
          }
        }

        return true;
      }
      case "Tuple":
        for (let element of adlType.values) {
          if (!isEmptyResponse(element)) return false;
        }

        return false;
      case "Union":
        for (let element of adlType.options) {
          if (!isEmptyResponse(element)) return false;
        }

        return false;
      default:
        return false;
    }
  }

  function getResponseDescription(responseModel: Type, statusCode: string) {
    const desc = getDoc(program, responseModel);
    if (desc) {
      return desc;
    }

    if (statusCode === "default") {
      return "An unexpected error response";
    }
    return "A successful response";
  }

  function getResponseHeader(prop: ModelTypeProperty) {
    const header: any = {};
    populateParameter(header, prop, undefined);
    delete header.in;
    delete header.name;
    delete header.required;
    return header;
  }

  function getSchemaOrRef(type: Type): any {
    const refUrl = getRef(program, type);
    if (refUrl) {
      return {
        $ref: refUrl,
      };
    }

    if (type.kind === "Model" && type.baseModels.length === 0) {
      // If this is a model that isn't derived from anything, there's a chance
      // it's a base Cadl "primitive" that corresponds directly to an OpenAPI
      // primitive. In such cases, we don't want to emit a ref and instead just
      // emit the base type directly.
      const builtIn = mapCadlTypeToOpenAPI(type);
      if (builtIn !== undefined) {
        return builtIn;
      }
    }

    if (type.kind === "String" || type.kind === "Number" || type.kind === "Boolean") {
      // For literal types, we just want to emit them directly as well.
      return mapCadlTypeToOpenAPI(type);
    }
    const name = getTypeNameForSchemaProperties(type);
    if (!isRefSafeName(name)) {
      // Schema's name is not reference-able in OpenAPI so we inline it.
      // This will usually happen with instantiated/anonymous types, but could also
      // happen if Cadl identifier uses characters that are problematic for OpenAPI.
      // Users will have to rename / alias type to have it get ref'ed.
      const schema = getSchemaForType(type);

      if (schema === undefined && isErrorType(type)) {
        // Exit early so that syntax errors are exposed.  This error will
        // be caught and handled in emitOpenAPI.
        throw new ErrorTypeFoundError();
      }

      // helps to read output and correlate to Cadl
      if (schema) {
        schema["x-cadl-name"] = name;
      }
      return schema;
    } else {
      const placeholder = {
        $ref: "#/definitions/" + name,
      };

      schemas.add(type);
      return placeholder;
    }
  }

  function getParamPlaceholder(parent: ModelType | undefined, property: ModelTypeProperty) {
    let spreadParam = false;

    if (property.sourceProperty) {
      // chase our sources all the way back to the first place this property
      // was defined.
      spreadParam = true;
      property = property.sourceProperty;
      while (property.sourceProperty) {
        property = property.sourceProperty;
      }
    }

    const refUrl = getRef(program, property);
    if (refUrl) {
      return {
        $ref: refUrl,
      };
    }

    if (params.has(property)) {
      return params.get(property);
    }

    const placeholder = {};
    // only parameters inherited by spreading or from interface are shared in #/parameters
    // bt: not sure about the interface part of this comment?

    if (spreadParam) {
      params.set(property, placeholder);
    }

    return placeholder;
  }

  function emitEndpointParameters(
    op: OperationType,
    parent: ModelType | undefined,
    methodParams: ModelTypeProperty[]
  ) {
    const parameters = [...methodParams];

    let bodyType: Type | undefined;
    let emittedImplicitBodyParam = false;
    for (const param of parameters) {
      if (params.has(param)) {
        currentEndpoint.parameters.push(params.get(param));
        continue;
      }
      const queryInfo = getQueryParamName(program, param);
      const pathInfo = getPathParamName(program, param);
      const headerInfo = getHeaderFieldName(program, param);
      const bodyInfo = isBody(program, param);

      if (pathInfo) {
        emitParameter(parent, param, "path");
      } else if (queryInfo) {
        emitParameter(parent, param, "query");
      } else if (headerInfo) {
        if (headerInfo === "content-type") {
          getContentTypes(param).forEach((c) => addConsumes(c));
        } else {
          emitParameter(parent, param, "header");
        }
      } else if (bodyInfo) {
        bodyType = param.type;
        emitParameter(parent, param, "body");
      } else {
        if (emittedImplicitBodyParam) {
          program.reportDiagnostic("request has multiple body types", op);
          continue;
        }
        emittedImplicitBodyParam = true;
        bodyType = param.type;
        emitParameter(parent, param, "body");
      }
    }

    if ((!currentEndpoint.consumes || currentEndpoint.consumes.length === 0) && bodyType) {
      // we didn't find an explicit content type anywhere, so infer from body.
      const modelType = getModelTypeIfNullable(bodyType);
      if (modelType) {
        let contentTypeParam = modelType.properties.get("contentType");
        if (contentTypeParam) {
          getContentTypes(contentTypeParam).forEach((c) => addConsumes(c));
        } else {
          addConsumes("application/json");
        }
      }
    }
  }

  function getContentTypes(param: ModelTypeProperty): string[] {
    if (param.type.kind === "String") {
      return [param.type.value];
    } else if (param.type.kind === "Union") {
      const contentTypes = [];
      for (const option of param.type.options) {
        if (option.kind === "String") {
          contentTypes.push(option.value);
        } else {
          program.reportDiagnostic(
            "The contentType property union must contain only string values",
            param
          );
          continue;
        }
      }

      return contentTypes;
    }

    program.reportDiagnostic("contentType parameter must be a string or union of strings", param);
    return [];
  }

  function getModelTypeIfNullable(type: Type): ModelType | undefined {
    if (type.kind === "Model") {
      return type;
    } else if (type.kind === "Union") {
      // Remove all `null` types and make sure there's a single model type
      const nonNulls = type.options.filter((o) => !isNullType(o));
      if (nonNulls.every((t) => t.kind === "Model")) {
        return nonNulls.length === 1 ? (nonNulls[0] as ModelType) : undefined;
      }
    }

    return undefined;
  }

  function emitParameter(parent: ModelType | undefined, param: ModelTypeProperty, kind: string) {
    const ph = getParamPlaceholder(parent, param);
    currentEndpoint.parameters.push(ph);

    // If the parameter already has a $ref, don't bother populating it
    if (!("$ref" in ph)) {
      populateParameter(ph, param, kind);
    }
  }

  function populateParameter(ph: any, param: ModelTypeProperty, kind: string | undefined) {
    ph.name = param.name;
    ph.in = kind;
    ph.required = !param.optional;
    ph.description = getDoc(program, param);

    // Apply decorators to a copy of the parameter definition.  We use
    // Object.assign here because applyIntrinsicDecorators returns a new object
    // based on the target object and we need to apply its changes back to the
    // original parameter.
    Object.assign(ph, applyIntrinsicDecorators(param, ph));

    let schema = getSchemaOrRef(param.type);
    if (kind === "body") {
      ph.schema = schema;
    } else {
      schema = getSchemaForType(param.type);
      if (param.type.kind === "Array") {
        schema.items = getSchemaForType(param.type.elementType);
      }
      for (const property in schema) {
        ph[property] = schema[property];
      }
    }
  }

  function emitReferences() {
    for (const [property, param] of params) {
      const key = getParameterKey(property, param);
      root.parameters[key] = {
        // Add an extension which tells AutoRest that this is a shared operation
        // parameter definition
        "x-ms-parameter-location": "method",
        ...param,
      };

      for (const key of Object.keys(param)) {
        delete param[key];
      }

      param["$ref"] = "#/parameters/" + key;
    }

    for (const type of schemas) {
      const name = getTypeNameForSchemaProperties(type);
      const schemaForType = getSchemaForType(type);
      if (schemaForType) {
        root.definitions[name] = schemaForType;
      }
    }
  }

  function emitTags() {
    for (const tag of tags) {
      root.tags.push({ name: tag });
    }
  }

  function getParameterKey(property: ModelTypeProperty, param: any) {
    const parent = program.checker!.getTypeForNode(property.node.parent!) as ModelType;
    let key = program.checker!.getTypeName(parent);
    if (parent.properties.size > 1) {
      key += `.${property.name}`;
    }

    // Try to shorten the type name to exclude the top-level service namespace
    let baseKey = getRefSafeName(key);
    if (serviceNamespace && key.startsWith(serviceNamespace)) {
      baseKey = key.substring(serviceNamespace.length + 1);

      // If no parameter exists with the shortened name, use it, otherwise use the fully-qualified name
      if (root.parameters[baseKey] === undefined) {
        key = baseKey;
      }
    }

    return key;
  }

  function getSchemaForType(type: Type) {
    const builtinType = mapCadlTypeToOpenAPI(type);
    if (builtinType !== undefined) {
      // add in description elements for types derived from primitive types (SecureString, etc.)
      const doc = getDoc(program, type);
      if (doc) {
        builtinType.description = doc;
      }
      return builtinType;
    }
    if (type.kind === "Array") {
      return getSchemaForArray(type);
    } else if (type.kind === "Model") {
      return getSchemaForModel(type);
    } else if (type.kind === "Union") {
      return getSchemaForUnion(type);
    } else if (type.kind === "Enum") {
      return getSchemaForEnum(type);
    }

    program.reportDiagnostic("Couldn't get schema for type " + type.kind, type);
    return undefined;
  }

  function getSchemaForEnum(e: EnumType) {
    const values = [];
    const type = enumMemberType(e.members[0]);
    for (const option of e.members) {
      if (type !== enumMemberType(option)) {
        reportInvalidUnionForOpenAPIV2();
        continue;
      }

      values.push(option.value ? option.value : option.name);
    }

    const schema: any = { type, description: getDoc(program, e) };
    if (values.length > 0) {
      schema.enum = values;
      addXMSEnum(e, schema);
    }

    return schema;
    function enumMemberType(member: EnumMemberType) {
      if (!member.value || typeof member.value === "string") return "string";
      return "number";
    }

    function reportInvalidUnionForOpenAPIV2() {
      program.reportDiagnostic(
        "Unions cannot be emitted to OpenAPI v2 unless all options are literals of the same type.",
        e
      );
    }
  }

  function getSchemaForUnion(union: UnionType) {
    let type: string;
    const nonNullOptions = union.options.filter((t) => !isNullType(t));
    const nullable = union.options.length != nonNullOptions.length;
    if (nonNullOptions.length === 0) {
      program.reportDiagnostic("Cannot have a union containing only null types.", union);
      return {};
    }

    const kind = nonNullOptions[0].kind;
    switch (kind) {
      case "String":
        type = "string";
        break;
      case "Number":
        type = "number";
        break;
      case "Boolean":
        type = "boolean";
        break;
      case "Model":
        type = "model";
        break;
      default:
        reportInvalidUnionForOpenAPIV2();
        return {};
    }

    const values = [];
    if (type === "model") {
      // Model unions can only ever be a model type with 'null'
      if (nonNullOptions.length === 1) {
        // Get the schema for the model type
        const schema: any = getSchemaForType(nonNullOptions[0]);
        if (schema) {
          schema["x-nullable"] = nullable;
        }

        return schema;
      } else {
        program.reportDiagnostic(
          "Unions containing multiple model types cannot be emitted to OpenAPI v2 unless the union is between one model type and 'null'.",
          union
        );
        return {};
      }
    }

    for (const option of nonNullOptions) {
      if (option.kind != kind) {
        reportInvalidUnionForOpenAPIV2();
      }

      // We already know it's not a model type
      values.push((option as any).value);
    }

    const schema: any = { type };
    if (values.length > 0) {
      schema.enum = values;
      addXMSEnum(union, schema);
    }
    if (nullable) {
      schema["x-nullable"] = true;
    }

    return schema;

    function reportInvalidUnionForOpenAPIV2() {
      program.reportDiagnostic(
        "Unions cannot be emitted to OpenAPI v2 unless all options are literals of the same type.",
        union
      );
    }
  }

  function getSchemaForArray(array: ArrayType) {
    const target = array.elementType;

    return {
      type: "array",
      items: getSchemaOrRef(target),
    };
  }

  function isNullType(type: Type): boolean {
    return type.kind === "Model" && type.name === "null" && isIntrinsic(program, type);
  }

  function getSchemaForModel(model: ModelType) {
    let modelSchema: any = {
      type: "object",
      properties: {},
      description: getDoc(program, model),
    };

    for (const [name, prop] of model.properties) {
      if (!isSchemaProperty(prop)) {
        continue;
      }

      const description = getDoc(program, prop);
      if (!prop.optional) {
        if (!modelSchema.required) {
          modelSchema.required = [];
        }
        modelSchema.required.push(name);
      }

      // Apply decorators on the property to the type's schema
      modelSchema.properties[name] = applyIntrinsicDecorators(prop, getSchemaOrRef(prop.type));
      if (description) {
        modelSchema.properties[name].description = description;
      }

      // Should the property be marked as readOnly?
      const vis = getVisibility(program, prop);
      if (vis && vis.includes("read")) {
        const mutability = [];
        if (vis.includes("read")) {
          if (vis.length > 1) {
            mutability.push("read");
          } else {
            modelSchema.properties[name].readOnly = true;
          }
        }
        if (vis.includes("write")) {
          mutability.push("update");
        }
        if (vis.includes("create")) {
          mutability.push("create");
        }

        if (mutability.length > 0) {
          modelSchema.properties[name]["x-ms-mutability"] = mutability;
        }
      }

      // Attach any additional OpenAPI extensions
      attachExtensions(prop, modelSchema.properties[name]);
    }

    // Special case: if a model type extends a single *templated* base type and
    // has no properties of its own, absorb the definition of the base model
    // into this schema definition.  The assumption here is that any model type
    // defined like this is just meant to rename the underlying instance of a
    // templated type.
    if (
      model.baseModels.length === 1 &&
      model.baseModels[0].templateArguments &&
      model.baseModels[0].templateArguments.length > 0 &&
      Object.keys(modelSchema.properties).length === 0
    ) {
      // Take the base model schema but carry across the documentation property
      // that we set before
      const baseSchema = getSchemaForType(model.baseModels[0]);
      modelSchema = {
        ...baseSchema,
        description: modelSchema.description,
      };
    } else if (model.baseModels.length > 0) {
      for (let base of model.baseModels) {
        if (!modelSchema.allOf) {
          modelSchema.allOf = [];
        }
        modelSchema.allOf.push(getSchemaOrRef(base));
      }
    }

    // Attach any OpenAPI extensions
    attachExtensions(model, modelSchema);
    return modelSchema;
  }

  function attachExtensions(type: Type, emitObject: any) {
    // Attach any OpenAPI extensions
    const extensions = getExtensions(type);
    if (extensions) {
      for (const key of extensions.keys()) {
        emitObject[key] = extensions.get(key);
      }
    }
  }

  /**
   * A "schema property" here is a property that is emitted to OpenAPI schema.
   *
   * Headers, parameters, status codes are not schema properties even they are
   * represented as properties in Cadl.
   */
  function isSchemaProperty(property: ModelTypeProperty) {
    const headerInfo = getHeaderFieldName(program, property);
    const queryInfo = getQueryParamName(program, property);
    const pathInfo = getPathParamName(program, property);
    return !(headerInfo || queryInfo || pathInfo);
  }

  function getTypeNameForSchemaProperties(type: Type) {
    // Try to shorten the type name to exclude the top-level service namespace
    const typeName = program!.checker!.getTypeName(type).replace(/<([\w\.]+)>/, "_$1");

    if (isRefSafeName(typeName) && serviceNamespace) {
      return typeName.replace(RegExp(serviceNamespace + "\\.", "g"), "");
    }

    return typeName;
  }

  function hasSchemaProperties(properties: Map<string, ModelTypeProperty>) {
    for (const property of properties.values()) {
      if (isSchemaProperty(property)) {
        return true;
      }
    }
    return false;
  }

  function applyIntrinsicDecorators(cadlType: Type, target: any): any {
    const pattern = getFormat(program, cadlType);
    if (isStringType(program, cadlType) && !target.pattern && pattern) {
      target = {
        ...target,
        pattern,
      };
    }

    const minLength = getMinLength(program, cadlType);
    if (isStringType(program, cadlType) && !target.minLength && minLength !== undefined) {
      target = {
        ...target,
        minLength,
      };
    }

    const maxLength = getMaxLength(program, cadlType);
    if (isStringType(program, cadlType) && !target.maxLength && maxLength !== undefined) {
      target = {
        ...target,
        maxLength,
      };
    }

    const minValue = getMinValue(program, cadlType);
    if (isNumericType(program, cadlType) && !target.minimum && minValue !== undefined) {
      target = {
        ...target,
        minimum: minValue,
      };
    }

    const maxValue = getMinValue(program, cadlType);
    if (isNumericType(program, cadlType) && !target.maximum && maxValue !== undefined) {
      target = {
        ...target,
        maximum: maxValue,
      };
    }

    if (isSecret(program, cadlType)) {
      target = {
        ...target,
        format: "password",
        "x-ms-secret": true,
      };
    }

    return target;
  }

  function addXMSEnum(type: StringLiteralType | UnionType | EnumType, schema: any): any {
    // For now, automatically treat any nominal union type as an `x-ms-enum`
    // that is expandable, i.e. sets `modelAsString: true`
    if (type.node.parent && type.node.parent.kind === SyntaxKind.ModelStatement) {
      schema["x-ms-enum"] = {
        name: type.node.parent.id.sv,
        modelAsString: true,
      };
    } else if (type.kind === "Enum") {
      schema["x-ms-enum"] = {
        name: type.name,
        modelAsString: true,
      };
    }

    return schema;
  }

  // Map an Cadl type to an OA schema. Returns undefined when the resulting
  // OA schema is just a regular object schema.
  function mapCadlTypeToOpenAPI(cadlType: Type): any {
    switch (cadlType.kind) {
      case "Number":
        return { type: "number", enum: [cadlType.value] };
      case "String":
        return addXMSEnum(cadlType, { type: "string", enum: [cadlType.value] });
      case "Boolean":
        return { type: "boolean", enum: [cadlType.value] };
      case "Model":
        switch (cadlType.name) {
          case "bytes":
            return { type: "string", format: "byte" };
          case "int8":
            return applyIntrinsicDecorators(cadlType, { type: "integer", format: "int8" });
          case "int16":
            return applyIntrinsicDecorators(cadlType, { type: "integer", format: "int16" });
          case "int32":
            return applyIntrinsicDecorators(cadlType, { type: "integer", format: "int32" });
          case "int64":
            return applyIntrinsicDecorators(cadlType, { type: "integer", format: "int64" });
          case "uint8":
            return applyIntrinsicDecorators(cadlType, { type: "integer", format: "uint8" });
          case "uint16":
            return applyIntrinsicDecorators(cadlType, { type: "integer", format: "uint16" });
          case "uint32":
            return applyIntrinsicDecorators(cadlType, { type: "integer", format: "uint32" });
          case "uint64":
            return applyIntrinsicDecorators(cadlType, { type: "integer", format: "uint64" });
          case "float64":
            return applyIntrinsicDecorators(cadlType, { type: "number", format: "double" });
          case "float32":
            return applyIntrinsicDecorators(cadlType, { type: "number", format: "float" });
          case "string":
            return applyIntrinsicDecorators(cadlType, { type: "string" });
          case "boolean":
            return { type: "boolean" };
          case "plainDate":
            return { type: "string", format: "date" };
          case "zonedDateTime":
            return { type: "string", format: "date-time" };
          case "plainTime":
            return { type: "string", format: "time" };
          case "Map":
            // We assert on valType because Map types always have a type
            const valType = cadlType.properties.get("v");
            return {
              type: "object",
              additionalProperties: getSchemaOrRef(valType!.type),
            };
        }
    }
    // The base model doesn't correspond to a primitive OA type, but it could
    // derive from one. Let's check.
    // TODO: multiple inheritance is not supported here.
    if (cadlType.kind === "Model" && cadlType.baseModels.length > 0) {
      const baseSchema = mapCadlTypeToOpenAPI(cadlType.baseModels[0]);
      if (baseSchema) {
        return applyIntrinsicDecorators(cadlType, baseSchema);
      }
    }
  }
}

function isRefSafeName(name: string) {
  return /^[A-Za-z0-9-_.]+$/.test(name);
}

function getRefSafeName(name: string) {
  return name.replace(/^[A-Za-z0-9-_.]/g, "_");
}

function prettierOutput(output: string) {
  return output + "\n";
}

class ErrorTypeFoundError extends Error {
  constructor() {
    super("Error type found in evaluated Cadl output");
  }
}
