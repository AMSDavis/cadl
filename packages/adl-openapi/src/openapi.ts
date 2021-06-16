import {
  ArrayType,
  getAllTags,
  getDoc,
  getFormat,
  getIntrinsicType,
  getMaxLength,
  getMinLength,
  getMinValue,
  getVisibility,
  isIntrinsic,
  isList,
  isNumericType,
  isSecret,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  StringLiteralType,
  SyntaxKind,
  throwDiagnostic,
  Type,
  UnionType,
} from "@azure-tools/adl";
import {
  basePathForResource,
  getConsumes,
  getHeaderFieldName,
  getOperationRoute,
  getPathParamName,
  getProduces,
  getQueryParamName,
  getResources,
  getServiceNamespaceString,
  getServiceTitle,
  getServiceVersion,
  getServiceHost,
  HttpVerb,
  isBody,
  _checkIfServiceNamespace,
} from "@azure-tools/adl-rest";
import * as path from "path";

export async function onBuild(p: Program) {
  const options: OpenAPIEmitterOptions = {
    outputFile: p.compilerOptions.swaggerOutputFile || path.resolve("./openapi.json"),
  };

  const emitter = createOAPIEmitter(p, options);
  await emitter.emitOpenAPI();
}

const operationIds = new Map<Type, string>();
export function operationId(program: Program, entity: Type, opId: string) {
  operationIds.set(entity, opId);
}

const pageableOperations = new Map<Type, string>();
export function pageable(program: Program, entity: Type, nextLinkName: string = "nextLink") {
  pageableOperations.set(entity, nextLinkName);
}

function getPageable(entity: Type): string | undefined {
  return pageableOperations.get(entity);
}

// Keep a list of all Types encountered that need schema definitions
const schemas = new Set<Type>();

export function getModels(): Type[] {
  return [...schemas.values()];
}

const refTargets = new Map<Type, string>();
export function useRef(program: Program, entity: Type, refUrl: string): void {
  if (entity.kind === "Model" || entity.kind === "ModelProperty") {
    refTargets.set(entity, refUrl);
  } else {
    throwDiagnostic(
      "@useRef decorator can only be applied to models and operation parameters.",
      entity
    );
  }
}

function getRef(entity: Type): string | undefined {
  return refTargets.get(entity);
}

// NOTE: These functions aren't meant to be used directly as decorators but as a
// helper functions for other decorators.  The security information given here
// will be inserted into the `security` and `securityDefinitions` sections of
// the emitted OpenAPI document.

const securityDetails: {
  namespace?: NamespaceType;
  requirements: any[];
  definitions: any;
} = { requirements: [], definitions: {} };

export function _addSecurityRequirement(
  namespace: NamespaceType,
  name: string,
  scopes: string[]
): void {
  if (!_checkIfServiceNamespace(namespace)) {
    throwDiagnostic(
      "Cannot add security details to a namespace other than the service namespace.",
      namespace
    );
  }

  const req: any = {};
  req[name] = scopes;
  securityDetails.requirements.push(req);
}

export function _addSecurityDefinition(namespace: NamespaceType, name: string, details: any): void {
  if (!_checkIfServiceNamespace(namespace)) {
    throwDiagnostic(
      "Cannot add security details to a namespace other than the service namespace.",
      namespace
    );
  }

  securityDetails.definitions[name] = details;
}

const openApiExtensions = new Map<Type, Map<string, any>>();
export function extension(program: Program, entity: Type, extensionName: string, value: any) {
  let typeExtensions = openApiExtensions.get(entity) ?? new Map<string, any>();
  typeExtensions.set(extensionName, value);
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
      title: getServiceTitle(),
      version: getServiceVersion(),
    },
    host: getServiceHost(),
    schemes: ["https"],
    produces: [], // Pre-initialize produces and consumes so that
    consumes: [], // they show up at the top of the document
    security: securityDetails.requirements,
    securityDefinitions: securityDetails.definitions,
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
    for (let resource of getResources()) {
      if (resource.kind !== "Namespace") {
        throwDiagnostic("Resource goes on namespace", resource);
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

    if (!program.compilerOptions.noEmit) {
      // Write out the OpenAPI document to the output path
      await program.host.writeFile(path.resolve(options.outputFile), JSON.stringify(root, null, 2));
    }
  }

  function emitResource(resource: NamespaceType): void {
    currentBasePath = basePathForResource(resource);

    // Gather produces/consumes data up the namespace hierarchy
    let currentNamespace: NamespaceType | undefined = resource;
    while (currentNamespace) {
      getProduces(currentNamespace).forEach((p) => globalProduces.add(p));
      getConsumes(currentNamespace).forEach((c) => globalConsumes.add(c));
      currentNamespace = currentNamespace.namespace;
    }

    for (const [name, op] of resource.operations) {
      emitEndpoint(resource, op);
    }
  }

  function getPathParameters(ns: NamespaceType, op: OperationType) {
    return [...(op.parameters?.properties.values() ?? [])].filter(
      (param) => getPathParamName(param) !== undefined
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
    const route = getOperationRoute(op);
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
        throwDiagnostic(
          `Path contains parameter ${declaredParam} but wasn't found in given parameters`,
          op
        );
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
    if (operationIds.has(op)) {
      currentEndpoint.operationId = operationIds.get(op);
    } else {
      // Synthesize an operation ID
      currentEndpoint.operationId = `${resource.name}_${op.name}`;
    }
    currentEndpoint.summary = getDoc(op);
    currentEndpoint.consumes = [];
    currentEndpoint.produces = [];
    currentEndpoint.parameters = [];
    currentEndpoint.responses = {};

    const currentTags = getAllTags(resource, op);
    if (currentTags) {
      currentEndpoint.tags = currentTags;
      for (const tag of currentTags) {
        // Add to root tags if not already there
        tags.add(tag);
      }
    }

    if (isList(op)) {
      const nextLinkName = getPageable(op) || "nextLink";
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
      responseModel.assignmentType === undefined &&
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
        if (isBody(prop)) {
          if (bodyModel !== responseModel) {
            throwDiagnostic("Duplicate @body declarations on response type", responseModel);
          }

          bodyModel = prop.type;
        }
        const type = prop.type;
        const headerName = getHeaderFieldName(prop);
        switch (headerName) {
          case undefined:
            break;
          case "status-code":
            if (type.kind == "Number") {
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
    const bodyType = bodyModel as ModelType;
    if (!bodyType || (bodyType.name !== undefined && bodyType.name !== "")) {
      response.schema = getSchemaOrRef(bodyModel);
    }

    if (!currentEndpoint.produces.includes(contentType)) {
      currentEndpoint.produces.push(contentType);
    }

    currentEndpoint.responses[statusCode] = response;
  }

  function getResponseDescription(responseModel: Type, statusCode: string) {
    const desc = getDoc(responseModel);
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
    const refUrl = getRef(type);
    if (refUrl) {
      return {
        $ref: refUrl,
      };
    }

    const builtIn = mapADLTypeToOpenAPI(type);
    if (builtIn !== undefined) {
      return builtIn;
    }

    const name = getTypeNameForSchemaProperties(type);
    if (!isRefSafeName(name)) {
      // Schema's name is not reference-able in OpenAPI so we inline it.
      // This will usually happen with instantiated/anonymous types, but could also
      // happen if ADL identifier uses characters that are problematic for OpenAPI.
      // Users will have to rename / alias type to have it get ref'ed.
      const schema = getSchemaForType(type);
      // helps to read output and correlate to ADL
      if (schema) { schema["x-adl-name"] = name; }
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

    const refUrl = getRef(property);
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
      const queryInfo = getQueryParamName(param);
      const pathInfo = getPathParamName(param);
      const headerInfo = getHeaderFieldName(param);
      const bodyInfo = isBody(param);

      if (pathInfo) {
        emitParameter(parent, param, "path");
      } else if (queryInfo) {
        emitParameter(parent, param, "query");
      } else if (headerInfo) {
        if (headerInfo === "content-type") {
          currentEndpoint.consumes = getContentTypes(param);
        } else {
          emitParameter(parent, param, "header");
        }
      } else if (bodyInfo) {
        bodyType = param.type;
        emitParameter(parent, param, "body");
      } else {
        if (emittedImplicitBodyParam) {
          throwDiagnostic("request has multiple body types", op);
        }
        emittedImplicitBodyParam = true;
        bodyType = param.type;
        emitParameter(parent, param, "body");
      }
    }

    if (currentEndpoint.consumes.length === 0 && bodyType) {
      // we didn't find an explicit content type anywhere, so infer from body.
      const modelType = getModelTypeIfNullable(bodyType);
      if (modelType) {
        let contentTypeParam = modelType.properties.get("contentType");
        if (contentTypeParam) {
          currentEndpoint.consumes = getContentTypes(contentTypeParam);
        } else {
          currentEndpoint.consumes = ["application/json"];
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
          throwDiagnostic("The contentType property union must contain only string values", param);
        }
      }

      return contentTypes;
    }

    throwDiagnostic("contentType parameter must be a string or union of strings", param);
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
    ph.description = getDoc(param);

    let schema = getSchemaOrRef(param.type);
    if (kind == "body") {
      ph.schema = schema;
    } else {
      schema = getSchemaForType(param.type);
      if (schema) {
        if (param.type.kind == "Array") {
          schema.items = getSchemaForType(param.type.elementType);
        }
        for (const property in schema) {
          ph[property] = schema[property];
        }
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
    const builtinType = mapADLTypeToOpenAPI(type);
    if (builtinType !== undefined) return builtinType;

    if (type.kind === "Array") {
      return getSchemaForArray(type);
    } else if (type.kind === "Model") {
      return getSchemaForModel(type);
    } else if (type.kind === "Union") {
      return getSchemaForUnion(type);
    }

    throwDiagnostic("Couldn't get schema for type " + type.kind, type);
  }

  function getSchemaForUnion(union: UnionType) {
    let type: string;
    const nonNullOptions = union.options.filter((t) => !isNullType(t));
    const nullable = union.options.length != nonNullOptions.length;
    if (nonNullOptions.length === 0) {
      throwDiagnostic("Cannot have a union containing only null types.", union);
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
        throwInvalidUnionForOpenAPIV2();
    }

    const values = [];
    if (type === "model") {
      // Model unions can only ever be a model type with 'null'
      if (nonNullOptions.length == 1) {
        // Get the schema for the model type
        const schema: any = getSchemaForType(nonNullOptions[0]);
        if (schema) {
          schema["x-nullable"] = nullable;
        }

        return schema;
      } else {
        throwDiagnostic(
          "Unions containing multiple model types cannot be emitted to OpenAPI v2 unless the union is between one model type and 'null'.",
          union
        );
      }
    }

    for (const option of nonNullOptions) {
      if (option.kind != kind) {
        throwInvalidUnionForOpenAPIV2();
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

    function throwInvalidUnionForOpenAPIV2(): never {
      throwDiagnostic(
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
    return type.kind === "Model" && type.name === "null" && isIntrinsic(type);
  }

  function getSchemaForModel(model: ModelType) {
    model = getTypeForSchemaProperties(model);

    const modelSchema: any = {
      type: "object",
      properties: {},
      description: getDoc(model),
    };

    for (const [name, prop] of model.properties) {
      if (!isSchemaProperty(prop)) {
        continue;
      }

      const description = getDoc(prop);
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
      const vis = getVisibility(prop);
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

    if (model.baseModels.length > 0) {
      for (let base of model.baseModels) {
        base = getTypeForSchemaProperties(base);
        if (hasSchemaProperties(base.properties)) {
          if (!modelSchema.allOf) {
            modelSchema.allOf = [];
          }
          modelSchema.allOf.push(getSchemaOrRef(base));
        }
      }
    }

    // Attach any OpenAPI extensions
    attachExtensions(model, modelSchema);

    if (modelSchema.properties === undefined || modelSchema.properties === null || Object.keys(modelSchema.properties).length == 0) {
      return undefined;
    }

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
   * represented as properties in ADL.
   */
  function isSchemaProperty(property: ModelTypeProperty) {
    const headerInfo = getHeaderFieldName(property);
    const queryInfo = getQueryParamName(property);
    const pathInfo = getPathParamName(property);
    return !(headerInfo || queryInfo || pathInfo);
  }

  /**
   * If a model type has an unspeakable name in OpenAPI, no schema properties of
   * its own, and exactly one base model that has schema properties, then when
   * emitting the type as a schema, we can use the single base model with schema
   * properties directly. The other properties will go elsewhere in OpenAPI.
   *
   * This ensures we use the best name in OpenAPI when the ADL pattern of adding
   * headers and status codes is done by instantiating a template. For example,
   * given `OkResponse<T> { @header statusCode: 200; ... T }`, then T is the schema
   * type.
   */
  function getTypeForSchemaProperties(type: ModelType): ModelType {
    if (type.baseModels.length === 0 || hasSchemaProperties(type.properties)) {
      return type;
    }

    if (type.baseModels.length === 1) {
      return getTypeForSchemaProperties(type.baseModels[0]);
    }

    let schemaBase = undefined;
    for (let base of type.baseModels) {
      base = getTypeForSchemaProperties(base);
      if (hasSchemaProperties(base.properties)) {
        if (schemaBase) {
          // more than one base with schema properties, can't reduce.
          return type;
        }
        schemaBase = base;
      }
    }

    return schemaBase ?? type;
  }

  function getTypeNameForSchemaProperties(type: Type) {
    if (type.kind === "Model") {
      type = getTypeForSchemaProperties(type);
      if (!hasSchemaProperties(type.properties)) {
        return getIntrinsicType(type) || "{}";
      }
    }

    // Try to shorten the type name to exclude the top-level service namespace
    const typeName = program!.checker!.getTypeName(type);
    if (isRefSafeName(typeName)) {
      if (serviceNamespace && typeName.startsWith(serviceNamespace)) {
        return typeName.substring(serviceNamespace.length + 1);
      }
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

  function applyIntrinsicDecorators(adlType: Type, schemaType: any): any {
    const pattern = getFormat(adlType);
    if (schemaType) {
      if (schemaType.type === "string" && !schemaType.format && pattern) {
        schemaType = {
          ...schemaType,
          pattern,
        };
      }

      const minLength = getMinLength(adlType);
      if (schemaType.type === "string" && !schemaType.minLength && minLength !== undefined) {
        schemaType = {
          ...schemaType,
          minLength,
        };
      }

      const maxLength = getMaxLength(adlType);
      if (schemaType.type === "string" && !schemaType.maxLength && maxLength !== undefined) {
        schemaType = {
          ...schemaType,
          maxLength,
        };
      }

      const minValue = getMinValue(adlType);
      if (isNumericType(adlType) && !schemaType.minimum && minValue !== undefined) {
        schemaType = {
          ...schemaType,
          minimum: minValue,
        };
      }

      const maxValue = getMinValue(adlType);
      if (isNumericType(adlType) && !schemaType.maximum && maxValue !== undefined) {
        schemaType = {
          ...schemaType,
          maximum: maxValue,
        };
      }


      if (isSecret(adlType)) {
        schemaType = {
          ...schemaType,
          format: "password",
        };
      }
    }

    return schemaType;
  }

  function addXMSEnum(type: StringLiteralType | UnionType, schema: any): any {
    // For now, automatically treat any nominal union type as an `x-ms-enum`
    // that is expandable, i.e. sets `modelAsString: true`
    if (type.node.parent && type.node.parent.kind === SyntaxKind.ModelStatement) {
      schema["x-ms-enum"] = {
        name: type.node.parent.id.sv,
        modelAsString: true,
      };
    }

    return schema;
  }

  function mapADLTypeToOpenAPI(adlType: Type): any {
    switch (adlType.kind) {
      case "Number":
        return { type: "number", enum: [adlType.value] };
      case "String":
        return addXMSEnum(adlType, { type: "string", enum: [adlType.value] });
      case "Boolean":
        return { type: "boolean", enum: [adlType.value] };
      case "Model":
        // Is the type templated with only one type?
        if (adlType.baseModels.length === 1 && !hasSchemaProperties(adlType.properties)) {
          return mapADLTypeToOpenAPI(adlType.baseModels[0]);
        }

        switch (adlType.name) {
          case "byte":
            return { type: "string", format: "byte" };
          case "int32":
            return applyIntrinsicDecorators(adlType, { type: "integer", format: "int32" });
          case "int64":
            return applyIntrinsicDecorators(adlType, { type: "integer", format: "int64" });
          case "float64":
            return applyIntrinsicDecorators(adlType, { type: "number", format: "double" });
          case "float32":
            return applyIntrinsicDecorators(adlType, { type: "number", format: "float" });
          case "string":
            return applyIntrinsicDecorators(adlType, { type: "string" });
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
            const valType = adlType.properties.get("v");
            return {
              type: "object",
              additionalProperties: mapADLTypeToOpenAPI(valType!.type),
            };
          default:
            // Recursively call this function to find the underlying OpenAPI type
            if (adlType.assignmentType) {
              const assignedType = mapADLTypeToOpenAPI(adlType.assignmentType);
              return assignedType ? applyIntrinsicDecorators(adlType, assignedType) : undefined;
            }
            break;
        }
      // fallthrough
      default:
        return undefined;
    }
  }

  function isRefSafeName(name: string) {
    return /^[A-Za-z0-9-_.]+$/.test(name);
  }

  function getRefSafeName(name: string) {
    return name.replace(/^[A-Za-z0-9-_.]/g, "_");
  }
}
