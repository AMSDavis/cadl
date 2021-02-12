import * as fs from 'fs';
import * as path from 'path';
import { Program } from '../compiler/program.js';
import { ArrayType, Namespace, NamespaceProperty, ModelType, ModelTypeProperty, Type, UnionType } from '../compiler/types.js';
import { getDoc, getFormat, getIntrinsicType, getMaxLength, getMinLength, isSecret, isList, isIntrinsic } from './decorators.js';
import {
  basePathForResource,
  getHeaderFieldName,
  getPathParamName,
  getQueryParamName,
  getResources,
  isBody,
  getOperationRoute,
  HttpVerb
} from './rest.js';

export function onBuild(p: Program) {
  const options: OpenAPIEmitterOptions = {
    outputFile: p.compilerOptions.swaggerOutputFile || path.resolve("./openapi.json")
  };

  const emitter = createOAPIEmitter(p, options);
  emitter.emitOpenAPI();
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
};

function createOAPIEmitter(program: Program, options: OpenAPIEmitterOptions) {
  const root: any = {
    swagger: '2.0',
    info: {
      title: '(title)',
      version: '0000-00-00'
    },
    schemes: ['https'],
    paths: {},
    definitions: {},
    parameters: {},
  };

  let currentBasePath: string | undefined = '';
  let currentPath: any = root.paths;
  let currentEndpoint: any;

  // Map types to their schema definition that will go in #/definitions. Inlined
  // schemas do not go in this map.
  const schemas = new Map<Type, any>();

  // Map model properties that represent shared parameters to their parameter
  // definition that will go in #/parameters. Inlined parameters do not go in
  // this map.
  const params = new Map<ModelTypeProperty, any>();

  return { emitOpenAPI };

  function emitOpenAPI() {
    for (let resource of getResources()) {
      if (resource.kind !== 'Namespace') {
        throw new Error("Resource goes on namespace");
      }

      emitResource(<Namespace>resource);
    }
    emitReferences();

    // Write out the OpenAPI document to the output path
    fs.writeFileSync(
      path.resolve(options.outputFile),
      JSON.stringify(root, null, 2));
  }

  function emitResource(resource: Namespace) {
    currentBasePath = basePathForResource(resource);

    for (const [name, prop] of resource.properties) {
      emitEndpoint(resource, prop);
    }
  }

  function getPathParameters(iface: Namespace, prop: NamespaceProperty) {
    return [
      ...(iface.parameters?.properties.values() ?? []),
      ...(prop.parameters?.properties.values() ?? []),
    ].filter((param) => getPathParamName(param) !== undefined);
  }

  /**
   * Translates endpoint names like `read` to REST verbs like `get`.
   */
  function pathForEndpoint(prop: NamespaceProperty, pathParams: ModelTypeProperty[]): [string, string[], string] {
    const paramByName = new Map(pathParams.map((p) => [p.name, p]));
    const route = getOperationRoute(prop);
    const inferredVerb = verbForEndpoint(prop.name);
    const verb = route?.verb || inferredVerb || 'get';

    // Build the full route path including any sub-path
    const routePath =
      (currentBasePath || "") +
      (route?.subPath
       ? `/${route?.subPath?.replace(/^\//g, '')}`
       : (!inferredVerb && !route ? "/get" : ""));

    // Find path parameter names
    const declaredPathParamNames =
      routePath.match(/\{\w+\}/g)?.map((s) => s.slice(1, -1)) ?? [];

    // For each param in the declared path parameters (e.g. /foo/{id} has one, id),
    // delete it because it doesn't need to be added to the path.
    for (const declaredParam of declaredPathParamNames) {
      const param = paramByName.get(declaredParam);
      if (!param) {
        throw new Error(
          `Path contains parameter ${declaredParam} but wasn't found in given parameters`
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
      case 'list':
        return 'get';
      case 'create':
        return 'post';
      case 'read':
        return 'get';
      case 'update':
        return 'get';
      case 'delete':
        return 'delete';
      case 'deleteAll':
        return 'delete';
    }

    return undefined;
  }

  function emitEndpoint(resource: Namespace, prop: NamespaceProperty) {
    const params = getPathParameters(resource, prop);
    const [verb, newPathParams, resolvedPath] = pathForEndpoint(
      prop,
      params
    );
    const fullPath =
      resolvedPath +
      (newPathParams.length > 0
        ? '/' + newPathParams.map((p) => '{' + p + '}').join('/')
        : '');

    if (fullPath === undefined) throw new Error('uhoh');

    if (!root.paths[fullPath]) {
      root.paths[fullPath] = {};
    }

    currentPath = root.paths[fullPath];
    if (!currentPath[verb]) {
      currentPath[verb] = {};
    }
    currentEndpoint = currentPath[verb];
    if (operationIds.has(prop)) {
      currentEndpoint.operationId = operationIds.get(prop);
    } else {
      // Synthesize an operation ID
      currentEndpoint.operationId = `${resource.name}_${prop.name}`;
    }
    currentEndpoint.summary = getDoc(prop);
    currentEndpoint.consumes = [];
    currentEndpoint.produces = [];
    currentEndpoint.parameters = [];
    currentEndpoint.responses = {};

    if (isList(prop)) {
      const nextLinkName = getPageable(prop) || "nextLink";
      if (nextLinkName) {
        currentEndpoint["x-ms-pageable"] = {
          nextLinkName
        }
      }
    }

    emitEndpointParameters(
      prop.parameters,
      [...resource.parameters?.properties.values() ?? []],
      [...prop.parameters?.properties.values() ?? []],
    );
    emitResponses(prop.returnType);
  }

  function emitResponses(responseType: Type) {
    if (responseType.kind === 'Union') {
      for (const [i, option] of responseType.options.entries()) {
        emitResponseObject(option, i === 0 ? '200' : 'default');
      }
    } else {
      emitResponseObject(responseType);
    }
  }

  function emitResponseObject(responseModel: Type, statusCode: string = '200') {
    if (
      responseModel.kind === 'Model' &&
      responseModel.assignmentType === undefined &&
      responseModel.properties.size === 0
    ) {
      currentEndpoint.responses[200] = {
        description: 'Null response',
      };

      return;
    }

    let contentType = 'application/json';
    const response: any = {
      schema: getSchemaOrPlaceholder(responseModel),
    };

    const desc = getDoc(responseModel);
    if (desc) {
      response.description = desc;
    }

    if (responseModel.kind === 'Model') {
      for (const prop of responseModel.properties.values()) {
        const type = prop.type;
        const headerName = getHeaderFieldName(prop);
        switch (headerName) {
          case undefined:
            break;
          case 'status-code':
            if (type.kind == "Number") {
              statusCode = String(type.value);
            }
            break;
          case 'content-type':
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

    if (!currentEndpoint.produces.includes(contentType)) {
      currentEndpoint.produces.push(contentType);
    }

    currentEndpoint.responses[statusCode] = response;
  }

  function getResponseHeader(prop: ModelTypeProperty) {
    const header: any = {};
    populateParameter(header, prop, undefined);
    delete header.in;
    delete header.name;
    delete header.required;
    return header;
  }


  function getSchemaOrPlaceholder(type: Type): any {
    if (schemas.has(type)) {
      return schemas.get(type);
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
      schema['x-adl-name'] = name; 
      return schema;
    } else {
      const placeholder = {};
      schemas.set(type, placeholder);
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
    parent: ModelType | undefined,
    resourceParams: ModelTypeProperty[],
    methodParams: ModelTypeProperty[]
  ) {
    const parameters = [...resourceParams, ...methodParams];

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
        emitParameter(parent, param, 'path');
      } else if (queryInfo) {
        emitParameter(parent, param, 'query');
      } else if (headerInfo) {
        emitParameter(parent, param, 'header');
      } else if (bodyInfo) {
        emitParameter(parent,param, 'body');
      } else {
        if (emittedImplicitBodyParam) {
          throw new Error('request has multiple body types');
        }
        emittedImplicitBodyParam = true;
        emitParameter(parent, param, 'body');
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
          throw new Error("The contentType property union must contain only string values");
        }
      }

      return contentTypes;
    }

    throw new Error("contentType parameter must be a string or union of strings");
  }

  function getModelTypeIfNullable(type: Type): ModelType | undefined {
    if (type.kind === "Model") {
      return type;
    } else if (type.kind === "Union") {
      // Remove all `null` types and make sure there's a single model type
      const nonNulls = type.options.filter(o => !isNullType(o));
      if (nonNulls.every(t => t.kind === "Model")) {
        return nonNulls.length === 1 ? nonNulls[0] as ModelType : undefined;
      }
    }

    return undefined;
  }

  function emitParameter(parent: ModelType | undefined, param: ModelTypeProperty, kind: string) {
    let skipParam = false;
    const ph = getParamPlaceholder(parent, param);
    populateParameter(ph, param, kind);

    let contentTypes: string[] = [];
    if (kind === 'body') {
      const modelType = getModelTypeIfNullable(param.type);
      if (modelType) {
        let contentTypeParam = modelType.properties.get('contentType');
        if (contentTypeParam) {
          contentTypes = getContentTypes(contentTypeParam);
        } else {
          contentTypes = ['application/json'];
        }
      }
    } else if (kind === 'header' && param.name === 'contentType') {
      contentTypes = getContentTypes(param);
      skipParam = true;
    }

    if (contentTypes.length > 0) {
      contentTypes.forEach(contentType => {
        if (!currentEndpoint.consumes.includes(contentType)) {
          currentEndpoint.consumes.push(contentType);
        }
      })
    }

    if (!skipParam) {
      currentEndpoint.parameters.push(ph);
    }
  }

  function populateParameter(ph: any, param: ModelTypeProperty, kind: string | undefined) {
    ph.name = param.name;
    ph.in = kind;
    ph.required = !param.optional;
    ph.description = getDoc(param);

    let schema = getSchemaOrPlaceholder(param.type);
    if (kind == 'body') {
      ph.schema = schema;
    } else {
      schema = getSchemaForType(param.type);
      if (param.type.kind == 'Array') {
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

      param['$ref'] = '#/parameters/' + key;
    }

    for (const [type, schema] of schemas) {
      const name = getTypeNameForSchemaProperties(type);
      const schemaForType = getSchemaForType(type);
      root.definitions[name] = schemaForType;

      for (const key of Object.keys(schema)) {
        delete schema[key];
      }

      schema['$ref'] = '#/definitions/' + name;
    }
  }

  function getParameterKey(property: ModelTypeProperty, param: any) {
    const parent = program.checker!.getTypeForNode(property.node.parent!) as ModelType;
    let key = program.checker!.getTypeName(parent);
    if (parent.properties.size > 1) {
      key += `.${property.name}`;
    }

    const baseKey = getRefSafeName(key);
    if (baseKey === key) {
      return key;
    }

    // deal with collisions we could introduce by mangling name
    let counter = 1;
    while (root.parameters[key] !== undefined) {
      key = baseKey + "." + counter;
      counter++;
    }

    return key;
  }

  function getSchemaForType(type: Type) {
    const builtinType = mapADLTypeToOpenAPI(type);
    if (builtinType !== undefined) return builtinType;

    if (type.kind === 'Array') {
      return getSchemaForArray(type);
    } else if (type.kind === 'Model') {
      return getSchemaForModel(type);
    } else if (type.kind === 'Union') {
      return getSchemaForUnion(type);
    }

    throw new Error("Couldn't get schema for type " + type.kind);
  }

  function getSchemaForUnion(union: UnionType) {
    let type: string;
    const nonNullOptions = union.options.filter(t => !isNullType(t));
    const nullable = union.options.length != nonNullOptions.length;
    if (nonNullOptions.length === 0) {
      throw new Error("Cannot have a union containing only null types.");
    }

    const kind = nonNullOptions[0].kind;
    switch (kind) {
      case 'String':
        type = 'string';
        break;
      case 'Number':
        type = 'number';
        break;
      case 'Boolean':
        type = 'boolean';
        break;
      case 'Model':
        type = 'model';
        break;
      default:
        throw invalidUnionForOpenAPIV2();
    }

    const values = [];
    if (type === 'model') {
      // Model unions can only ever be a model type with 'null'
      if (nonNullOptions.length == 1) {
        // Get the schema for the model type
        const schema: any = getSchemaForType(nonNullOptions[0]);
        schema["x-nullable"] = nullable;
        return schema;
      } else {
        throw new Error("Unions containing multiple model types cannot be emitted to OpenAPI v2 unless the union is between one model type and 'null'.");
      }
    }

    for (const option of nonNullOptions) {
      if (option.kind != kind) {
        throw invalidUnionForOpenAPIV2();
      } 

      // We already know it's not a model type
      values.push((<any>option).value);
    }

    const schema: any = { type };
    if (values.length > 0) {
      schema.enum = values;
    }
    if (nullable) {
      schema["x-nullable"] = true;
    }

    return schema;

    function invalidUnionForOpenAPIV2() {
      return new Error("Unions cannot be emitted to OpenAPI v2 unless all options are literals of the same type.");
    }
  }

  function getSchemaForArray(array: ArrayType) {
    const target = array.elementType;

    return {
      type: 'array',
      items: getSchemaOrPlaceholder(target),
    };
  }

  function isNullType(type: Type): boolean {
    return type.kind === "Model" && type.name === "null" && isIntrinsic(type);
  }

  function getSchemaForModel(model: ModelType) {
    model = getTypeForSchemaProperties(model);``

    const modelSchema: any = {
      type: 'object',
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
      modelSchema.properties[name] = applyStringDecorators(prop, getSchemaOrPlaceholder(prop.type));
      if (description) {
        modelSchema.properties[name].description = description;
      }
    }

    if (model.baseModels.length > 0) {
      for (let base of model.baseModels) {
        base = getTypeForSchemaProperties(base);
        if (hasSchemaProperties(base.properties)) {
          if (!modelSchema.allOf) {
            modelSchema.allOf = [];
          }
          modelSchema.allOf.push(getSchemaOrPlaceholder(base));
        }
      }
    }

    // Attach any OpenAPI extensions
    const extensions = getExtensions(model);
    if (extensions) {
      for (const key of extensions.keys()) {
        // console.log("Adding extension", key, extensions.get(key));
        modelSchema[key] = extensions.get(key);
      }
    }

    return modelSchema;
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
    if (type.kind === 'Model') {
      type = getTypeForSchemaProperties(type);
      if (!hasSchemaProperties(type.properties)) {
        return getIntrinsicType(type) || "{}";
      }
    }
    return program!.checker!.getTypeName(type);
  }

  function hasSchemaProperties(properties: Map<string, ModelTypeProperty>) {
    for (const property of properties.values()) {
      if (isSchemaProperty(property)) {
        return true;
      }
    }
    return false;
  }

  function applyStringDecorators(adlType: Type, schemaType: any): any {
    const pattern = getFormat(adlType);
    if (schemaType.type === "string" && !schemaType.format && pattern) {
      schemaType = {
        ...schemaType,
        pattern
      };
    }

    const minLength = getMinLength(adlType);
    if (schemaType.type === "string" && !schemaType.minLength && minLength !== undefined) {
      schemaType = {
        ...schemaType,
        minLength
      };
    }

    const maxLength = getMaxLength(adlType);
    if (schemaType.type === "string" && !schemaType.maxLength && maxLength !== undefined) {
      schemaType = {
        ...schemaType,
        maxLength
      };
    }

    if (isSecret(adlType)) {
      schemaType = {
        ...schemaType,
        format: "password"
      }
    }

    return schemaType;
  }

  function mapADLTypeToOpenAPI(adlType: Type): any {
    switch (adlType.kind) {
      case 'Number':
        return { type: 'number', enum: [adlType.value] };
      case 'String':
        return { type: 'string', enum: [adlType.value] };
      case 'Boolean':
        return { type: 'boolean', enum: [adlType.value] };
      case 'Model':
        // Is the type templated with only one type?
        if (adlType.baseModels.length === 1 && !hasSchemaProperties(adlType.properties)) {
          return mapADLTypeToOpenAPI(adlType.baseModels[0]);
        }

        switch (adlType.name) {
          case 'byte':
            return { type: 'string', format: 'byte' };
          case 'int32':
            return { type: 'integer', format: 'int32' };
          case 'int64':
            return { type: 'integer', format: 'int64' };
          case 'float64':
            return { type: 'number', format: 'double' };
          case 'float32':
            return { type: 'number', format: 'float' };
          case 'string':
            // Return a string schema augmented by decorators
            return applyStringDecorators(adlType, { type: 'string' });
          case 'boolean':
            return { type: 'boolean' };
          case 'date':
            return { type: 'string', format: 'date' };
          case 'datetime':
            return { type: 'string', format: 'date-time' };
          case 'Map':
            // We assert on valType because Map types always have a type
            const valType = adlType.properties.get("v");
            return {
              type: 'object',
              additionalProperties: mapADLTypeToOpenAPI(valType!.type)
            };
          default:
            // Recursively call this function to find the underlying OpenAPI type
            if (adlType.assignmentType) {
              const assignedType = mapADLTypeToOpenAPI(adlType.assignmentType)
              return assignedType
                ? applyStringDecorators(adlType, assignedType)
                : undefined;
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
    return name.replace(/^[A-Za-z0-9-_.]/g, '_');
  }
}


