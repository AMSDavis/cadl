import {
  ArrayType,
  checkIfServiceNamespace,
  DecoratorContext,
  EnumMemberType,
  EnumType,
  getAllTags,
  getDoc,
  getFormat,
  getFriendlyName,
  getIntrinsicModelName,
  getKnownValues,
  getMaxLength,
  getMaxValue,
  getMinLength,
  getMinValue,
  getPattern,
  getProperty,
  getPropertyType,
  getServiceHost,
  getServiceNamespace,
  getServiceNamespaceString,
  getServiceTitle,
  getServiceVersion,
  getSummary,
  getVisibility,
  isErrorModel,
  isErrorType,
  isIntrinsic,
  isNumericType,
  isSecret,
  isStringType,
  isVoidType,
  joinPaths,
  mapChildModels,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  resolvePath,
  StringLiteralType,
  SyntaxKind,
  Type,
  UnionType,
  validateDecoratorParamType,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { $extension, getExtensions, getExternalDocs, getOperationId } from "@cadl-lang/openapi";
import {
  getAllRoutes,
  getDiscriminator,
  http,
  HttpOperationParameters,
  OperationDetails,
} from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";
const {
  getHeaderFieldName,
  getPathParamName,
  getQueryParamName,
  getStatusCodes,
  getStatusCodeDescription,
  isBody,
  isHeader,
  isStatusCode,
} = http;

export async function $onEmit(p: Program) {
  const options: OpenAPIEmitterOptions = {
    outputFile:
      (await checkAndGenResourceProviderSubfolder(p, getServiceVersion(p))) ||
      p.compilerOptions.swaggerOutputFile ||
      resolvePath("./openapi.json"),
  };

  const emitter = createOAPIEmitter(p, options);
  await emitter.emitOpenAPI();
}

const pageableOperationsKey = Symbol();
export function $pageable(
  { program }: DecoratorContext,
  entity: Type,
  nextLinkName: string = "nextLink"
) {
  if (
    !validateDecoratorTarget(program, entity, "@pageable", "Operation") ||
    !validateDecoratorParamType(program, entity, nextLinkName, "String")
  ) {
    return;
  }
  program.stateMap(pageableOperationsKey).set(entity, nextLinkName);
}

export function getPageable(program: Program, entity: Type): string | undefined {
  return program.stateMap(pageableOperationsKey).get(entity);
}

export interface Example {
  pathOrUri: string;
  title: string;
}

const exampleKey = Symbol();

export function $example(
  { program }: DecoratorContext,
  entity: Type,
  pathOrUri: string,
  title: string
) {
  if (
    !validateDecoratorTarget(program, entity, "@example", "Operation") ||
    !validateDecoratorParamType(program, entity, pathOrUri, "String") ||
    !validateDecoratorParamType(program, entity, title, "String")
  ) {
    return;
  }
  if (!program.stateMap(exampleKey).has(entity)) {
    program.stateMap(exampleKey).set(entity, []);
  } else if (
    program
      .stateMap(exampleKey)
      .get(entity)
      .find((e: Example) => e.title === title || e.pathOrUri === pathOrUri)
  ) {
    reportDiagnostic(program, {
      code: "duplicate-example",
      target: entity,
    });
  }
  program.stateMap(exampleKey).get(entity).push({
    pathOrUri,
    title,
  });
}

export function getExamples(program: Program, entity: Type): Example[] | undefined {
  return program.stateMap(exampleKey).get(entity);
}

const refTargetsKey = Symbol();

export function $useRef({ program }: DecoratorContext, entity: Type, refUrl: string): void {
  if (
    !validateDecoratorTarget(program, entity, "@useRef", ["Model", "ModelProperty"]) ||
    !validateDecoratorParamType(program, entity, refUrl, "String")
  ) {
    return;
  }

  program.stateMap(refTargetsKey).set(entity, refUrl);
}

export function getRef(program: Program, entity: Type): string | undefined {
  return program.stateMap(refTargetsKey).get(entity);
}

// NOTE: These functions aren't meant to be used directly as decorators but as a
// helper functions for other decorators.  The security information given here
// will be inserted into the `security` and `securityDefinitions` sections of
// the emitted OpenAPI document.

const securityDetailsKey = Symbol();
interface SecurityDetails {
  definitions: any;
  requirements: any[];
}

function getSecurityDetails(program: Program, serviceNamespace: NamespaceType): SecurityDetails {
  const definitions = program.stateMap(securityDetailsKey);
  if (definitions.has(serviceNamespace)) {
    return definitions.get(serviceNamespace)!;
  } else {
    const details = { definitions: {}, requirements: [] };
    definitions.set(serviceNamespace, details);
    return details;
  }
}

function getSecurityRequirements(program: Program, serviceNamespace: NamespaceType) {
  return getSecurityDetails(program, serviceNamespace).requirements;
}

function getSecurityDefinitions(program: Program, serviceNamespace: NamespaceType) {
  return getSecurityDetails(program, serviceNamespace).definitions;
}

export function addSecurityRequirement(
  program: Program,
  namespace: NamespaceType,
  name: string,
  scopes: string[]
): void {
  if (!checkIfServiceNamespace(program, namespace)) {
    reportDiagnostic(program, {
      code: "security-service-namespace",
      target: namespace,
    });
  }

  const req: any = {};
  req[name] = scopes;
  const requirements = getSecurityRequirements(program, namespace);
  requirements.push(req);
}

export function addSecurityDefinition(
  program: Program,
  namespace: NamespaceType,
  name: string,
  details: any
): void {
  if (!checkIfServiceNamespace(program, namespace)) {
    reportDiagnostic(program, {
      code: "security-service-namespace",
      target: namespace,
    });
    return;
  }

  const definitions = getSecurityDefinitions(program, namespace);
  definitions[name] = details;
}

export function $asyncOperationOptions(
  context: DecoratorContext,
  entity: Type,
  finalStateVia: string
) {
  $extension(context, entity, "x-ms-long-running-operation-options", {
    "final-state-via": finalStateVia,
  });
}

export interface OpenAPIEmitterOptions {
  outputFile: string;
}

function createOAPIEmitter(program: Program, options: OpenAPIEmitterOptions) {
  // Get the service namespace string for use in name shortening
  const serviceNamespaceName: string | undefined = getServiceNamespaceString(program);
  const serviceNamespace = getServiceNamespace(program)!;

  const root: any = {
    swagger: "2.0",
    info: {
      title: getServiceTitle(program),
      version: getServiceVersion(program),
      description: getDoc(program, serviceNamespace),
    },
    externalDocs: getExternalDocs(program, serviceNamespace),
    host: getServiceHost(program),
    schemes: ["https"],
    produces: [], // Pre-initialize produces and consumes so that
    consumes: [], // they show up at the top of the document
    security: getSecurityRequirements(program, serviceNamespace),
    securityDefinitions: getSecurityDefinitions(program, serviceNamespace),
    tags: [],
    paths: {},
    "x-ms-paths": {},
    definitions: {},
    parameters: {},
  };

  let currentPath: any = root.paths;
  let currentEndpoint: any;
  let currentConsumes: Set<string>;
  let currentProduces: Set<string>;

  // Keep a list of all Types encountered that need schema definitions
  const schemas = new Set<Type>();

  // Map model properties that represent shared parameters to their parameter
  // definition that will go in #/parameters. Inlined parameters do not go in
  // this map.
  const params = new Map<ModelTypeProperty, any>();

  // De-dupe the per-endpoint tags that will be added into the #/tags
  const tags = new Set<string>();

  // The set of produces/consumes values found in all operations
  const globalProduces = new Set<string>(["application/json"]);
  const globalConsumes = new Set<string>(["application/json"]);

  let childModelMap: ReadonlyMap<ModelType, readonly ModelType[]>;

  return { emitOpenAPI };

  async function emitOpenAPI() {
    try {
      childModelMap = mapChildModels(program);
      getAllRoutes(program).forEach(emitOperation);
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
        // Sort the document
        const sortedRoot = sortOpenAPIDocument(root);

        // Write out the OpenAPI document to the output path
        await program.host.writeFile(
          resolvePath(options.outputFile),
          prettierOutput(JSON.stringify(sortedRoot, null, 2))
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

  function emitOperation(operation: OperationDetails) {
    const { path: fullPath, operation: op, groupName, verb, parameters } = operation;

    // If path contains a literal query string parameter, add it to x-ms-paths instead
    const pathsObject = fullPath.indexOf("?") < 0 ? root.paths : root["x-ms-paths"];

    if (!pathsObject[fullPath]) {
      pathsObject[fullPath] = {};
    }

    currentPath = pathsObject[fullPath];
    if (!currentPath[verb]) {
      currentPath[verb] = {};
    }
    currentEndpoint = currentPath[verb];
    currentConsumes = new Set<string>();
    currentProduces = new Set<string>();

    const operationId = getOperationId(program, op);
    if (operationId) {
      currentEndpoint.operationId = operationId;
    } else {
      // Synthesize an operation ID
      currentEndpoint.operationId = (groupName.length > 0 ? `${groupName}_` : "") + op.name;
    }

    applyExternalDocs(op, currentEndpoint);

    // allow operation extensions
    attachExtensions(op, currentEndpoint);
    currentEndpoint.summary = getSummary(program, op);
    currentEndpoint.description = getDoc(program, op);
    currentEndpoint.parameters = [];
    currentEndpoint.responses = {};

    const currentTags = getAllTags(program, op);
    if (currentTags) {
      currentEndpoint.tags = currentTags;
      for (const tag of currentTags) {
        // Add to root tags if not already there
        tags.add(tag);
      }
    }

    if (getPageable(program, op)) {
      const nextLinkName = getPageable(program, op) || "nextLink";
      if (nextLinkName) {
        currentEndpoint["x-ms-pageable"] = {
          nextLinkName,
        };
      }
    }

    emitEndpointParameters(op, op.parameters, parameters);
    emitResponses(op.returnType);
    applyEndpointConsumes();
    applyEndpointProduces();

    const examples = getExamples(program, op);
    if (examples) {
      currentEndpoint["x-ms-examples"] = examples.reduce(
        (acc, example) => ({ ...acc, [example.title]: { $ref: example.pathOrUri } }),
        {}
      );
    }
  }

  function applyEndpointProduces() {
    if (currentProduces.size > 0 && !checkLocalAndGlobalEqual(globalProduces, currentProduces)) {
      currentEndpoint.produces = [...currentProduces];
    }
  }

  function applyEndpointConsumes() {
    if (currentConsumes.size > 0 && !checkLocalAndGlobalEqual(globalConsumes, currentConsumes)) {
      currentEndpoint.consumes = [...currentConsumes];
    }
  }

  function checkLocalAndGlobalEqual(global: Set<string>, local: Set<string>) {
    if (global.size !== local.size) {
      return false;
    }
    for (const entry of local) {
      if (!global.has(entry)) {
        return false;
      }
    }
    return true;
  }

  function isBinaryPayload(body: Type, contentType: string | string[]) {
    const types = new Set(typeof contentType === "string" ? [contentType] : contentType);
    return (
      body.kind === "Model" &&
      body.name === "bytes" &&
      !types.has("application/json") &&
      !types.has("text/plain")
    );
  }

  function emitResponses(responseType: Type) {
    if (responseType.kind === "Union") {
      for (const option of responseType.options) {
        emitResponseObject(option);
      }
    } else {
      emitResponseObject(responseType);
    }
  }

  function emitResponseObject(responseModel: Type) {
    // Get explicity defined status codes
    const statusCodes = getResponseStatusCodes(responseModel);

    // Get explicitly defined content types
    const contentTypes = getResponseContentTypes(responseModel);

    // Get response headers
    const headers = getResponseHeaders(responseModel);

    // Get explicitly defined body
    let bodyModel = getResponseBody(responseModel);

    // If there is no explicit body, it should be conjured from the return type
    // if it is a primitive type or it contains more than just response metadata
    if (!bodyModel) {
      if (responseModel.kind === "Model") {
        if (mapCadlTypeToOpenAPI(responseModel)) {
          bodyModel = responseModel;
        } else {
          const isResponseMetadata = (p: ModelTypeProperty) =>
            isHeader(program, p) || isStatusCode(program, p);
          const allProperties = (p: ModelType): ModelTypeProperty[] => {
            return [...p.properties.values(), ...(p.baseModel ? allProperties(p.baseModel) : [])];
          };
          if (allProperties(responseModel).some((p) => !isResponseMetadata(p))) {
            bodyModel = responseModel;
          }
        }
      } else {
        // body is array or possibly something else
        bodyModel = responseModel;
      }
    }

    // If there is no explicit status code, set the default
    if (statusCodes.length === 0) {
      statusCodes.push(getDefaultStatusCode(responseModel, bodyModel));
    }

    // If there is a body but no explicit content types, use application/json
    if (bodyModel && !isVoidType(bodyModel) && contentTypes.length === 0) {
      contentTypes.push("application/json");
    }

    if (!bodyModel && contentTypes.length > 0) {
      reportDiagnostic(program, {
        code: "content-type-ignored",
        target: responseModel,
      });
    }

    // Assertion: bodyModel <=> contentTypes.length > 0

    // Put them into currentEndpoint.responses

    for (const statusCode of statusCodes) {
      if (currentEndpoint.responses[statusCode]) {
        reportDiagnostic(program, {
          code: "duplicate-response",
          format: { statusCode },
          target: responseModel,
        });
        continue;
      }
      const response: any = {
        description: getResponseDescription(responseModel, statusCode),
      };
      if (Object.keys(headers).length > 0) {
        response.headers = headers;
      }

      if (contentTypes.length > 0) {
        // If we have multiple content types, it is possible that some should have
        // the "binary" schema but others not. So we'll only "flip" the schema to
        // "binary" in the event that _all_ the content types are binary.
        const isBinary = contentTypes.every((t) => isBinaryPayload(bodyModel!, t));
        response.schema = isBinary ? { type: "file" } : getSchemaOrRef(bodyModel!);
      }
      currentEndpoint.responses[statusCode] = response;
    }

    for (const contentType of contentTypes) {
      currentProduces.add(contentType);
    }
  }

  /**
   * Return the default status code for the given response/body
   * @param model representing the body
   */
  function getDefaultStatusCode(responseModel: Type, bodyModel: Type | undefined) {
    if (bodyModel === undefined || isVoidType(bodyModel)) {
      return "204";
    } else {
      return isErrorModel(program, responseModel) ? "default" : "200";
    }
  }

  // Get explicity defined status codes from response Model
  // Return is an array of strings, possibly empty, which indicates no explicitly defined status codes.
  // We do not check for duplicates here -- that will be done by the caller.
  function getResponseStatusCodes(responseModel: Type): string[] {
    const codes: string[] = [];
    if (responseModel.kind === "Model") {
      if (responseModel.baseModel) {
        codes.push(...getResponseStatusCodes(responseModel.baseModel));
      }
      for (const prop of responseModel.properties.values()) {
        if (isStatusCode(program, prop)) {
          codes.push(...getStatusCodes(program, prop));
        }
      }
    }
    return codes;
  }

  function getResponseDescription(responseModel: Type, statusCode: string) {
    const desc = getDoc(program, responseModel);
    if (desc) {
      return desc;
    }

    if (statusCode === "default") {
      return "An unexpected error response";
    }
    return getStatusCodeDescription(statusCode) ?? "unknown";
  }

  // Get explicity defined content-types from response Model
  // Return is an array of strings, possibly empty, which indicates no explicitly defined content-type.
  // We do not check for duplicates here -- that will be done by the caller.
  function getResponseContentTypes(responseModel: Type): string[] {
    const contentTypes: string[] = [];
    if (responseModel.kind === "Model") {
      if (responseModel.baseModel) {
        contentTypes.push(...getResponseContentTypes(responseModel.baseModel));
      }
      for (const prop of responseModel.properties.values()) {
        if (isHeader(program, prop) && getHeaderFieldName(program, prop) === "content-type") {
          contentTypes.push(...getContentTypes(prop));
        }
      }
    }
    return contentTypes;
  }

  // Get response headers from response Model
  function getResponseHeaders(responseModel: Type) {
    if (responseModel.kind === "Model") {
      const responseHeaders: any = responseModel.baseModel
        ? getResponseHeaders(responseModel.baseModel)
        : {};
      for (const prop of responseModel.properties.values()) {
        const headerName = getHeaderFieldName(program, prop);
        if (isHeader(program, prop) && headerName !== "content-type") {
          responseHeaders[headerName] = getResponseHeader(prop);
        }
      }
      return responseHeaders;
    }
    return {};
  }

  // Get explicity defined response body from response Model
  // Search inheritance chain and error on any duplicates found
  function getResponseBody(responseModel: Type): Type | undefined {
    if (responseModel.kind === "Model") {
      const getAllBodyProps = (m: ModelType): ModelTypeProperty[] => {
        const bodyProps = [...m.properties.values()].filter((t) => isBody(program, t));
        if (m.baseModel) {
          bodyProps.push(...getAllBodyProps(m.baseModel));
        }
        return bodyProps;
      };
      const bodyProps = getAllBodyProps(responseModel);
      if (bodyProps.length > 0) {
        // Report all but first body as duplicate
        for (const prop of bodyProps.slice(1)) {
          reportDiagnostic(program, { code: "duplicate-body", target: prop });
        }
        return bodyProps[0].type;
      }
    }
    return undefined;
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

    if (type.kind === "Model" && type.name === getIntrinsicModelName(program, type)) {
      // if the model is one of the Cadl Intrinsic type.
      // it's a base Cadl "primitive" that corresponds directly to an OpenAPI
      // primitive. In such cases, we don't want to emit a ref and instead just
      // emit the base type directly.
      const builtIn = mapCadlIntrinsicModelToOpenAPI(type);
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
    methodParams: HttpOperationParameters
  ) {
    const consumes: string[] = [];
    for (const { type, name, param } of methodParams.parameters) {
      if (params.has(param)) {
        currentEndpoint.parameters.push(params.get(param));
        continue;
      }
      switch (type) {
        case "path":
          emitParameter(parent, param, "path");
          break;
        case "query":
          emitParameter(parent, param, "query");
          break;
        case "header":
          if (name === "content-type") {
            getContentTypes(param).forEach((c) => consumes.push(c));
          } else {
            emitParameter(parent, param, "header");
          }
          break;
      }
    }

    if (consumes.length === 0 && methodParams.body) {
      // we didn't find an explicit content type anywhere, so infer from body.
      const modelType = getModelTypeIfNullable(methodParams.body.type);
      if (modelType) {
        const contentTypeParam = modelType.properties.get("contentType");
        if (contentTypeParam) {
          getContentTypes(contentTypeParam).forEach((c) => consumes.push(c));
        } else {
          consumes.push("application/json");
        }
      }
    }

    for (const consume of consumes) {
      currentConsumes.add(consume);
    }

    if (methodParams.body) {
      const isBinary = isBinaryPayload(methodParams.body.type, consumes);
      if (isBinary) {
        const binaryType = { type: "string", format: "binary" };
        emitParameter(parent, methodParams.body, "body", binaryType);
      } else {
        emitParameter(parent, methodParams.body, "body");
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
          reportDiagnostic(program, {
            code: "content-type-string",
            target: param,
          });
          continue;
        }
      }

      return contentTypes;
    }

    reportDiagnostic(program, { code: "content-type-string", target: param });
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

  function emitParameter(
    parent: ModelType | undefined,
    param: ModelTypeProperty,
    kind: string,
    typeOverride?: any
  ) {
    const ph = getParamPlaceholder(parent, param);
    currentEndpoint.parameters.push(ph);

    // If the parameter already has a $ref, don't bother populating it
    if (!("$ref" in ph)) {
      populateParameter(ph, param, kind, typeOverride);
    }
  }

  function populateParameter(
    ph: any,
    param: ModelTypeProperty,
    kind: string | undefined,
    typeOverride?: any
  ) {
    ph.name = param.name;
    ph.in = kind;
    ph.required = !param.optional;
    ph.description = getDoc(program, param);
    if (param.default) {
      ph.default = getDefaultValue(param.default);
    }

    // Apply decorators to a copy of the parameter definition.  We use
    // Object.assign here because applyIntrinsicDecorators returns a new object
    // based on the target object and we need to apply its changes back to the
    // original parameter.
    Object.assign(ph, applyIntrinsicDecorators(param, ph));

    let schema = getSchemaOrRef(param.type);
    if (kind === "body") {
      ph.schema = typeOverride ?? schema;
    } else {
      schema = getSchemaForType(param.type);
      if (param.type.kind === "Array") {
        schema.items = getSchemaForType(param.type.elementType);
      }
      for (const property in schema) {
        ph[property] = schema[property];
      }
    }
    attachExtensions(param, ph);
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
    let isQualifiedParamName = false;

    if (parent.properties.size > 1) {
      key += `.${property.name}`;
      isQualifiedParamName = true;
    }

    // Try to shorten the type name to exclude the top-level service namespace
    let baseKey = getRefSafeName(key);
    if (serviceNamespaceName && key.startsWith(serviceNamespaceName)) {
      baseKey = key.substring(serviceNamespaceName.length + 1);

      // If no parameter exists with the shortened name, use it, otherwise use the fully-qualified name
      if (!root.parameters[baseKey] || isQualifiedParamName) {
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

    reportDiagnostic(program, {
      code: "invalid-schema",
      format: { type: type.kind },
      target: type,
    });
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
      reportDiagnostic(program, { code: "union-unsupported", target: e });
    }
  }

  function getSchemaForUnion(union: UnionType) {
    let type: string;
    const nonNullOptions = union.options.filter((t) => !isNullType(t));
    const nullable = union.options.length != nonNullOptions.length;
    if (nonNullOptions.length === 0) {
      reportDiagnostic(program, { code: "union-null", target: union });
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
      case "Array":
        type = "array";
        break;
      default:
        reportInvalidUnionForOpenAPIV2();
        return {};
    }

    const values = [];
    if (type === "model" || type === "array") {
      // Model unions can only ever be a model type with 'null'
      if (nonNullOptions.length === 1) {
        // Get the schema for the model type
        const schema: any = getSchemaForType(nonNullOptions[0]);
        if (schema) {
          schema["x-nullable"] = nullable;
        }

        return schema;
      } else {
        reportDiagnostic(program, {
          code: "union-unsupported",
          messageId: "null",
          target: union,
        });
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
      reportDiagnostic(program, {
        code: "union-unsupported",
        target: union,
      });
    }
  }

  function ifArrayItemContainsIdentifier(program: Program, array: ArrayType) {
    if (array.elementType.kind != "Model") {
      return true;
    }
    return (
      getExtensions(program, array).has("x-ms-identifier") ||
      isIntrinsic(program, array.elementType) ||
      getProperty(array.elementType, "id")
    );
  }

  function getSchemaForArray(array: ArrayType) {
    const target = array.elementType;
    let schema = {
      type: "array",
      items: getSchemaOrRef(target),
    } as any;
    // set default x-ms-identifier.
    if (!ifArrayItemContainsIdentifier(program, array)) {
      schema["x-ms-identifier"] = [];
    }
    return schema;
  }

  function isNullType(type: Type): boolean {
    return isIntrinsic(program, type) && getIntrinsicModelName(program, type) === "null";
  }

  function getDefaultValue(type: Type): any {
    switch (type.kind) {
      case "String":
        return type.value;
      case "Number":
        return type.value;
      case "Boolean":
        return type.value;
      case "Tuple":
        return type.values.map(getDefaultValue);
      default:
        reportDiagnostic(program, {
          code: "invalid-default",
          format: { type: type.kind },
          target: type,
        });
    }
  }

  function getSchemaForModel(model: ModelType) {
    let modelSchema: any = {
      type: "object",
      properties: {},
      description: getDoc(program, model),
    };
    const childModels = childModelMap.get(model) ?? [];

    // getSchemaOrRef on all children to push them into components.schemas
    for (const child of childModels) {
      getSchemaOrRef(child);
    }

    const discriminator = getDiscriminator(program, model);
    if (discriminator) {
      if (!validateDiscriminator(discriminator, childModels)) {
        // appropriate diagnostic is generated in the validate function
        return {};
      }

      const { propertyName } = discriminator;

      for (const child of childModels) {
        // Set x-ms-discriminator-value if only one value for the discriminator property
        const prop = getProperty(child, propertyName);
        if (prop) {
          const vals = getStringValues(prop.type);
          if (vals.length === 1) {
            const extensions = getExtensions(program, child);
            if (!extensions.has("x-ms-discriminator-value")) {
              $extension({ program }, child, "x-ms-discriminator-value", vals[0]);
            }
          }
        }
      }

      modelSchema.discriminator = propertyName;
      // Push discriminator into base type, but only if it is not already there
      if (!model.properties?.get(propertyName)) {
        modelSchema.properties[propertyName] = { type: "string" };
        modelSchema.required = [propertyName];
      }
    }

    applyExternalDocs(model, modelSchema);

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

      const propSchema = getSchemaOrRef(prop.type);

      // if this property is a discriminator property, remove enum values to keep autorest happy
      if (model.baseModel) {
        const { propertyName } = getDiscriminator(program, model.baseModel) || {};
        if (name === propertyName) {
          delete propSchema["enum"];
        }
      }

      // Apply decorators on the property to the type's schema
      modelSchema.properties[name] = applyIntrinsicDecorators(prop, propSchema);
      if (description) {
        modelSchema.properties[name].description = description;
      }

      if (prop.default) {
        modelSchema.properties[name].default = getDefaultValue(prop.default);
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
      model.baseModel &&
      model.baseModel.templateArguments &&
      model.baseModel.templateArguments.length > 0 &&
      Object.keys(modelSchema.properties).length === 0
    ) {
      // Take the base model schema but carry across the documentation property
      // that we set before
      const baseSchema = getSchemaForType(model.baseModel);
      modelSchema = {
        ...baseSchema,
        description: modelSchema.description,
      };
    } else if (model.baseModel) {
      modelSchema.allOf = [getSchemaOrRef(model.baseModel)];
    }

    // Attach any OpenAPI extensions
    attachExtensions(model, modelSchema);
    return modelSchema;
  }

  function attachExtensions(type: Type, emitObject: any) {
    // Attach any OpenAPI extensions
    const extensions = getExtensions(program, type);
    if (extensions) {
      for (const key of extensions.keys()) {
        emitObject[key] = extensions.get(key);
      }
    }
  }

  function validateDiscriminator(discriminator: any, childModels: readonly ModelType[]): boolean {
    const { propertyName } = discriminator;
    const retVals = childModels.map((t) => {
      const prop = getProperty(t, propertyName);
      if (!prop) {
        reportDiagnostic(program, { code: "discriminator", messageId: "missing", target: t });
        return false;
      }
      let retval = true;
      if (!isOasString(prop.type)) {
        reportDiagnostic(program, { code: "discriminator", messageId: "type", target: prop });
        retval = false;
      }
      if (prop.optional) {
        reportDiagnostic(program, { code: "discriminator", messageId: "required", target: prop });
        retval = false;
      }
      return retval;
    });
    // Map of discriminator value to the model in which it is declared
    const discriminatorValues = new Map<string, string>();
    for (const t of childModels) {
      // Get the discriminator property directly in the child model
      const prop = t.properties?.get(propertyName);
      // Issue warning diagnostic if discriminator property missing or is not a string literal
      if (!prop || !isStringLiteral(prop.type)) {
        reportDiagnostic(program, {
          code: "discriminator-value",
          messageId: "literal",
          target: prop || t,
        });
      }
      if (prop) {
        const vals = getStringValues(prop.type);
        vals.forEach((val) => {
          if (discriminatorValues.has(val)) {
            reportDiagnostic(program, {
              code: "discriminator",
              messageId: "duplicate",
              format: { val: val, model1: discriminatorValues.get(val)!, model2: t.name },
              target: prop,
            });
            retVals.push(false);
          } else {
            discriminatorValues.set(val, t.name);
          }
        });
      }
    }
    return retVals.every((v) => v);
  }

  // An openapi "string" can be defined in several different ways in Cadl
  function isOasString(type: Type): boolean {
    if (type.kind === "String") {
      // A string literal
      return true;
    } else if (type.kind === "Model" && type.name === "string") {
      // string type
      return true;
    } else if (type.kind === "Union") {
      // A union where all variants are an OasString
      return type.options.every((o) => isOasString(o));
    }
    return false;
  }

  function isStringLiteral(type: Type): boolean {
    return (
      type.kind === "String" ||
      (type.kind === "Union" && type.options.every((o) => o.kind === "String"))
    );
  }

  // Return any string literal values for type
  function getStringValues(type: Type): string[] {
    if (type.kind === "String") {
      return [type.value];
    } else if (type.kind === "Union") {
      return type.options.flatMap(getStringValues).filter((v) => v);
    }
    return [];
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
    const statusCodeinfo = isStatusCode(program, property);
    return !(headerInfo || queryInfo || pathInfo || statusCodeinfo);
  }

  function getTypeNameForSchemaProperties(type: Type) {
    // If there's a friendly name for the type, use that instead
    let typeName = getFriendlyName(program, type);
    if (typeName) {
      return typeName;
    }

    // Try to shorten the type name to exclude the top-level service namespace
    typeName = program!.checker!.getTypeName(type).replace(/<([\w.]+)>/, "_$1");

    if (isRefSafeName(typeName)) {
      if (serviceNamespaceName) {
        typeName = typeName.replace(RegExp(serviceNamespaceName + "\\.", "g"), "");
      }
      // exclude the Cadl namespace in type names
      typeName = typeName.replace(/($|_)(Cadl\.)/g, "$1");
    }

    return typeName;
  }

  function applyIntrinsicDecorators(cadlType: ModelType | ModelTypeProperty, target: any): any {
    const newTarget = { ...target };
    const docStr = getDoc(program, cadlType);
    const isString = isStringType(program, getPropertyType(cadlType));
    const isNumeric = isNumericType(program, getPropertyType(cadlType));

    if (isString && !target.documentation && docStr) {
      newTarget.description = docStr;
    }

    const summaryStr = getSummary(program, cadlType);
    if (isString && !target.summary && summaryStr) {
      newTarget.summary = summaryStr;
    }

    const formatStr = getFormat(program, cadlType);
    if (isString && !target.format && formatStr) {
      newTarget.format = formatStr;
    }

    const pattern = getPattern(program, cadlType);
    if (isString && !target.pattern && pattern) {
      newTarget.pattern = pattern;
    }

    const minLength = getMinLength(program, cadlType);
    if (isString && !target.minLength && minLength !== undefined) {
      newTarget.minLength = minLength;
    }

    const maxLength = getMaxLength(program, cadlType);
    if (isString && !target.maxLength && maxLength !== undefined) {
      newTarget.maxLength = maxLength;
    }

    const minValue = getMinValue(program, cadlType);
    if (isNumeric && !target.minimum && minValue !== undefined) {
      newTarget.minimum = minValue;
    }

    const maxValue = getMaxValue(program, cadlType);
    if (isNumeric && !target.maximum && maxValue !== undefined) {
      newTarget.maximum = maxValue;
    }

    if (isSecret(program, cadlType)) {
      newTarget.format = "password";
      newTarget["x-ms-secret"] = true;
    }

    if (isString) {
      const values = getKnownValues(program, cadlType);
      if (values) {
        const enumSchema = { ...newTarget, ...getSchemaForEnum(values) };
        enumSchema["x-ms-enum"].modelAsString = true;
        enumSchema["x-ms-enum"].name = (getPropertyType(cadlType) as ModelType).name;
        return enumSchema;
      }
    }

    return newTarget;
  }

  function applyExternalDocs(cadlType: Type, target: Record<string, unknown>) {
    const externalDocs = getExternalDocs(program, cadlType);
    if (externalDocs) {
      target.externalDocs = externalDocs;
    }
  }

  function addXMSEnum(type: StringLiteralType | UnionType | EnumType, schema: any): any {
    // For now, automatically treat any nominal union type as an `x-ms-enum`
    // that is expandable, i.e. sets `modelAsString: true`
    if (type.node && type.node.parent && type.node.parent.kind === SyntaxKind.ModelStatement) {
      schema["x-ms-enum"] = {
        name: type.node.parent.id.sv,
        modelAsString: true,
      };
    } else if (type.kind === "Enum") {
      schema["x-ms-enum"] = {
        name: type.name,
        modelAsString: false,
      };

      const values = [];
      let foundCustom = false;
      for (const member of type.members) {
        const description = getDoc(program, member);
        values.push({
          name: member.name,
          value: member.value ?? member.name,
          description,
        });

        if (description || member.value) {
          foundCustom = true;
        }
      }
      if (foundCustom) {
        schema["x-ms-enum"].values = values;
      }
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
        return mapCadlIntrinsicModelToOpenAPI(cadlType);
    }
  }

  /**
   * Map Cadl intrinsic models to open api definitions
   */
  function mapCadlIntrinsicModelToOpenAPI(cadlType: ModelType): any | undefined {
    if (!isIntrinsic(program, cadlType)) {
      return undefined;
    }
    const name = getIntrinsicModelName(program, cadlType);
    switch (name) {
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
      case "safeint":
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
      case "duration":
        return { type: "string", format: "duration" };
      case "Map":
        // We assert on valType because Map types always have a type
        const valType = cadlType.properties.get("v");
        return {
          type: "object",
          additionalProperties: getSchemaOrRef(valType!.type),
        };
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

function sortObjectByKeys(obj: any, compareFn: any = undefined): any {
  return Object.keys(obj)
    .sort(compareFn)
    .reduce((sortedObj: any, key: string) => {
      sortedObj[key] = obj[key];
      return sortedObj;
    }, {});
}

export function comparePaths(leftPath: string, rightPath: string) {
  const leftParts = leftPath.split("/").slice(1);
  const rightParts = rightPath.split("/").slice(1);

  for (let i = 0; i < Math.max(leftParts.length, rightParts.length); i++) {
    // Have we exhausted the path parts of one of them?
    if (i === leftParts.length) return -1;
    if (i === rightParts.length) return 1;

    // Does this segment represent a path parameter (field) on either side?
    const leftIsField = leftParts[i][0] === "{";
    const rightIsField = rightParts[i][0] === "{";

    // If both are fields, try the next part regardless of the field name
    // since the field ordering is all that really matters
    if (leftIsField && rightIsField) {
      continue;
    }

    // If only one is a field, it automatically wins
    if (leftIsField || rightIsField) {
      return leftIsField ? -1 : 1;
    }

    // Sort lexicographically
    const result = leftParts[i].localeCompare(rightParts[i]);
    if (result !== 0) {
      return result;
    }
  }

  // Must be the same
  return 0;
}

function sortOpenAPIDocument(doc: any): any {
  doc.paths = sortObjectByKeys(doc.paths, comparePaths);
  doc.definitions = sortObjectByKeys(doc.definitions);
  doc.parameters = sortObjectByKeys(doc.parameters);

  return doc;
}

async function checkAndGenResourceProviderSubfolder(p: Program, version: string) {
  const resourceProviderFolder = p.getOption("azure-resource-provider-folder");
  const nameSpace = getServiceNamespaceString(p);
  let outputPath = p.compilerOptions.outputPath || ".";
  if (resourceProviderFolder && nameSpace) {
    outputPath = joinPaths(
      outputPath,
      resourceProviderFolder,
      nameSpace,
      version.includes("preview") ? "preview" : "stable",
      version
    );
    await p.host.mkdirp(outputPath);
    return joinPaths(outputPath, "openapi.json");
  }
  return undefined;
}
