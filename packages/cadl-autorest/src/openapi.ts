import {
  ArrayType,
  checkIfServiceNamespace,
  EnumMemberType,
  EnumType,
  findChildModels,
  getAllTags,
  getDoc,
  getFormat,
  getFriendlyName,
  getMaxLength,
  getMaxValue,
  getMinLength,
  getMinValue,
  getPattern,
  getProperty,
  getServiceHost,
  getServiceNamespace,
  getServiceNamespaceString,
  getServiceTitle,
  getServiceVersion,
  getVisibility,
  isErrorType,
  isIntrinsic,
  isNumericType,
  isSecret,
  isStringType,
  joinPaths,
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
} from "@cadl-lang/compiler";
import {
  getAllRoutes,
  getDiscriminator,
  http,
  HttpOperationParameters,
  OperationDetails,
} from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";
const { getHeaderFieldName, getPathParamName, getQueryParamName, isBody, isHeader, isStatusCode } =
  http;

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
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      messageId: "modelsOperations",
      format: { decoratorName: "useRef" },
      target: entity,
    });
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

const openApiExtensions = new Map<Type, Map<string, any>>();
function getExtensions(entity: Type): Map<string, any> {
  if (!openApiExtensions.has(entity)) {
    openApiExtensions.set(entity, new Map<string, any>());
  }
  return openApiExtensions.get(entity)!;
}

export function $extension(program: Program, entity: Type, extensionName: string, value: any) {
  const extensions = getExtensions(entity);
  extensions.set(extensionName, value);
}

export function $asyncOperationOptions(program: Program, entity: Type, finalStateVia: string) {
  let typeExtensions = getExtensions(entity);
  typeExtensions.set("x-ms-long-running-operation-options", { "final-state-via": finalStateVia });
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
    },
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

  let currentBasePath: string | undefined = "";
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

  return { emitOpenAPI };

  async function emitOpenAPI() {
    try {
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
    const { path: fullPath, operation: op, groupName, container, verb, parameters } = operation;

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
    currentConsumes = new Set<string>();
    currentProduces = new Set<string>();

    if (program.stateMap(operationIdsKey).has(op)) {
      currentEndpoint.operationId = program.stateMap(operationIdsKey).get(op);
    } else {
      // Synthesize an operation ID
      currentEndpoint.operationId = (groupName.length > 0 ? `${groupName}_` : "") + op.name;
    }

    // allow operation extensions
    attachExtensions(op, currentEndpoint);
    currentEndpoint.summary = getDoc(program, op);
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
      for (const [i, option] of responseType.options.entries()) {
        emitResponseObject(option);
      }
    } else {
      emitResponseObject(responseType);
    }
  }

  function emitResponseObject(responseModel: Type) {
    let statusCode = undefined;
    let contentType = "application/json";
    if (
      responseModel.kind === "Model" &&
      !responseModel.baseModel &&
      responseModel.properties.size === 0
    ) {
      const isBinary = isBinaryPayload(responseModel, contentType);
      const schema = isBinary ? { type: "file" } : mapCadlTypeToOpenAPI(responseModel);
      currentProduces.add("application/json");
      if (schema) {
        currentEndpoint.responses["200"] = {
          description: getResponseDescription(responseModel, "200"),
          schema: schema,
        };
      } else {
        currentEndpoint.responses["204"] = {
          description: "No content",
        };
      }

      return;
    }

    const response: any = {};

    let bodyModel = responseModel;
    if (responseModel.kind === "Model") {
      for (const prop of responseModel.properties.values()) {
        if (isBody(program, prop)) {
          if (bodyModel !== responseModel) {
            reportDiagnostic(program, { code: "duplicate-body", target: responseModel });
            continue;
          }

          bodyModel = prop.type;
        }
        if (isStatusCode(program, prop)) {
          if (statusCode) {
            reportDiagnostic(program, {
              code: "duplicate-status-code",
              target: responseModel,
            });
            continue;
          }
          if (prop.type.kind === "Number") {
            statusCode = String(prop.type.value);
          } else if (prop.type.kind === "String") {
            statusCode = prop.type.value;
          }
        }
        const type = prop.type;
        const headerName = getHeaderFieldName(program, prop);
        switch (headerName) {
          case undefined:
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

    // If no status code was defined in the response model, use 200.
    statusCode ??= "200";

    response.description = getResponseDescription(responseModel, statusCode);

    if (!isEmptyResponse(bodyModel)) {
      const isBinary = isBinaryPayload(bodyModel, contentType);
      response.schema = isBinary ? { type: "file" } : getSchemaOrRef(bodyModel);
    }

    currentProduces.add(contentType);
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
            const headerInfo = isHeader(program, element);
            const statusCodeinfo = isStatusCode(program, element);
            if (!(headerInfo || statusCodeinfo)) return false;
          }
        }
        if (adlType.baseModel) {
          if (!isEmptyResponse(adlType.baseModel)) return false;
        }
        if (adlType.templateArguments) {
          for (let element of adlType.templateArguments) {
            if (!isEmptyResponse(element)) return false;
          }
        }
        if (getDiscriminator(program, adlType)) {
          return false;
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

    if (type.kind === "Model" && !type.baseModel) {
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
        let contentTypeParam = modelType.properties.get("contentType");
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
            messageId: "unionOfString",
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
    if (parent.properties.size > 1) {
      key += `.${property.name}`;
    }

    // Try to shorten the type name to exclude the top-level service namespace
    let baseKey = getRefSafeName(key);
    if (serviceNamespaceName && key.startsWith(serviceNamespaceName)) {
      baseKey = key.substring(serviceNamespaceName.length + 1);

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

    const discriminator = getDiscriminator(program, model);
    if (discriminator) {
      const childModels = findChildModels(program, model);

      if (!validateDiscriminator(discriminator, childModels)) {
        // appropriate diagnostic is generated in the validate function
        return {};
      }

      const { propertyName } = discriminator;

      for (let child of childModels) {
        // getSchemaOrRef on all children to make sure these are pushed into definitions
        getSchemaOrRef(child);

        // Set x-ms-discriminator-value if only one value for the discriminator property
        const prop = getProperty(child, propertyName);
        if (prop) {
          const vals = getStringValues(prop.type);
          if (vals.length === 1) {
            const extensions = getExtensions(child);
            if (!extensions.has("x-ms-discriminator-value")) {
              extensions.set("x-ms-discriminator-value", vals[0]);
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
    const extensions = getExtensions(type);
    if (extensions) {
      for (const key of extensions.keys()) {
        emitObject[key] = extensions.get(key);
      }
    }
  }

  function validateDiscriminator(discriminator: any, childModels: ModelType[]): boolean {
    const { propertyName } = discriminator;
    var retVals = childModels.map((t) => {
      const prop = getProperty(t, propertyName);
      if (!prop) {
        reportDiagnostic(program, { code: "discriminator", messageId: "missing", target: t });
        return false;
      }
      var retval = true;
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
    for (let t of childModels) {
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
    typeName = program!.checker!.getTypeName(type).replace(/<([\w\.]+)>/, "_$1");

    if (isRefSafeName(typeName)) {
      if (serviceNamespaceName) {
        typeName = typeName.replace(RegExp(serviceNamespaceName + "\\.", "g"), "");
      }
      // exclude the Cadl namespace in type names
      typeName = typeName.replace(/($|_)(Cadl\.)/g, "$1");
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
    const format = getFormat(program, cadlType);
    if (isStringType(program, cadlType) && !target.format && format) {
      target = {
        ...target,
        format,
      };
    }

    const pattern = getPattern(program, cadlType);
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

    const maxValue = getMaxValue(program, cadlType);
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
    if (type.node && type.node.parent && type.node.parent.kind === SyntaxKind.ModelStatement) {
      schema["x-ms-enum"] = {
        name: type.node.parent.id.sv,
        modelAsString: true,
      };
    } else if (type.kind === "Enum") {
      schema["x-ms-enum"] = {
        name: type.name,
        modelAsString: true,
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
    // The base model doesn't correspond to a primitive OA type, but it could
    // derive from one. Let's check.
    if (cadlType.kind === "Model" && cadlType.baseModel) {
      const baseSchema = mapCadlTypeToOpenAPI(cadlType.baseModel);
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
