import {
  ArmResourceInfo,
  getArmNamespace,
  getArmResourceInfo,
  getArmResources,
  ParameterInfo,
} from "@azure-tools/cadl-rpaas";
import {
  ArrayType,
  BooleanLiteralType,
  checkIfServiceNamespace,
  EnumType,
  getDoc,
  getFormat,
  getMaxLength,
  getMinLength,
  getServiceNamespaceString,
  getServiceVersion,
  ModelSpreadPropertyNode,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  Node,
  NoTarget,
  NumericLiteralType,
  OperationType,
  Program,
  StringLiteralType,
  TupleType,
  Type,
  UnionType,
} from "@cadl-lang/compiler";
import { http } from "@cadl-lang/rest";
import * as fs from "fs/promises";
import mkdirp from "mkdirp";
import * as path from "path";
import * as sqrl from "squirrelly";
import { fileURLToPath } from "url";
import { reportDiagnostic } from "./lib.js";

const {
  getHttpOperation,
  getPathParamName,
  getRoutes,
  isBody,
  isPathParam,
  isQueryParam,
  isRoute,
} = http;

// Squirelly escape for xml which is not what we want here https://v7--squirrellyjs.netlify.app/docs/v7/auto-escaping/
sqrl.defaultConfig.autoEscape = false;

export async function $onBuild(program: Program) {
  const rootPath = program.host.resolveAbsolutePath(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  );
  const options: ServiceGenerationOptions = {
    controllerOutputPath:
      program.compilerOptions.serviceCodePath || program.compilerOptions.outputPath
        ? path.join(program.compilerOptions.outputPath!, "generated")
        : path.join(
            program.host.resolveAbsolutePath(path.resolve(".")),
            "cadl-output",
            "generated"
          ),
    controllerModulePath: rootPath,
    controllerHost: program.compilerOptions.miscOptions?.controllerHost || "rpaas",
    operationPollingLocation:
      program.compilerOptions.miscOptions?.operationPollingLocation || "tenant",
    registrationOutputPath: program.getOption("registrationOutputPath"),
  };

  const generator = CreateServiceCodeGenerator(program, options);
  await generator.generateServiceCode();
}

export interface ServiceGenerationOptions {
  controllerOutputPath: string;
  controllerModulePath: string;
  controllerHost: "liftr" | "rpaas";
  operationPollingLocation: "tenant" | "subscription";
  registrationOutputPath?: string;
}

export function CreateServiceCodeGenerator(program: Program, options: ServiceGenerationOptions) {
  const rootPath = options.controllerModulePath;
  const serviceNamespaceName = getServiceNamespaceString(program);
  const serviceRootNamespace = findServiceNamespace(
    program,
    program.checker!.getGlobalNamespaceType()
  );
  if (!serviceNamespaceName) {
    return {
      generateServiceCode(): void {
        return;
      },
    };
  }
  const serviceName: string = getServiceName(serviceNamespaceName);
  const serviceNamespace = "Microsoft." + serviceName;
  const modelNamespace = serviceNamespace + ".Models";
  const ListName = "list",
    PutName = "create",
    PatchName = "update",
    DeleteName = "delete",
    GetName = "read";
  reportInfo(`Service name: ${serviceName}`, serviceRootNamespace?.node);
  reportProgress("rootpath: " + rootPath);

  interface TraceableEntity {
    sourceNode?: Node;
  }

  interface Resource extends TraceableEntity {
    name: string;
    nameSpace: string;
    serviceName: string;
    serializedName: string;
    nameParameter: string;
    hasSubscriptionList: boolean;
    hasResourceGroupList: boolean;
    itemPath: string;
    operations?: Operation[];
    specificationArmNamespace: string;
    specificationModelName: string;
    specificationListModelName: string;
  }

  interface Operation extends TraceableEntity {
    name: string;
    returnType: string;
    verb: string;
    subPath?: string;
    parameters?: MethodParameter[];
    requestParameter?: MethodParameter;
  }

  interface MethodParameter extends TraceableEntity {
    name: string;
    type: string;
    location?: string;
    description?: string;
    default?: string;
  }

  interface Model extends TypeDeclaration, TraceableEntity {
    serviceName: string;
    description?: string;
    properties: Property[];
  }

  interface Property extends TraceableEntity {
    name: string;
    type: TypeReference;
    validations: ValidationAttribute[];
    description?: string;
    default?: string;
  }

  interface TypeReference {
    name: string;
    nameSpace: string;
    typeParameters?: TypeReference[];
    isBuiltIn: boolean;
  }

  interface TypeDeclaration extends TypeReference {
    isDerivedType: boolean;
    isImplementer: boolean;
    baseClass?: TypeReference;
    implements?: TypeReference[];
    validations?: ValidationAttribute[];
  }

  interface ValidationAttribute {
    name: string;
    parameters?: ValueParameter[];
  }

  interface ValueParameter {
    value: any;
    type: string;
  }

  interface Enumeration extends TraceableEntity {
    serviceName: string;
    name: string;
    description?: string;
    isClosed: boolean;
    values: EnumValue[];
  }

  interface EnumValue extends TraceableEntity {
    name: string;
    value?: string | number;
    description?: string;
  }

  interface ServiceModel {
    nameSpace: string;
    serviceName: string;
    resources: Resource[];
    models: Model[];
    enumerations: Enumeration[];
  }

  const outputModel: ServiceModel = {
    nameSpace: serviceNamespace,
    serviceName: serviceName,
    resources: [],
    models: [],
    enumerations: [],
  };

  return { generateServiceCode };

  function reportInfo(message: string, target: Node | undefined) {
    program.logger.log({ level: "info", message, target });
  }

  function reportProgress(message: string) {
    program.logger.info(message);
  }

  function reportVerboseInfo(message: string) {
    program.logger.verbose(message);
  }

  function findServiceNamespace(
    program: Program,
    rootNamespace: NamespaceType
  ): NamespaceType | undefined {
    let current = rootNamespace;
    if (checkIfServiceNamespace(program, current)) {
      return current;
    }

    let result: NamespaceType | undefined = undefined;
    current.namespaces.forEach((namespace) => {
      let candidate = findServiceNamespace(program, namespace);
      if (candidate && result === undefined) {
        result = candidate;
      }
    });

    return result;
  }

  function resolvePath(fsPath: string): string {
    return program.host.resolveAbsolutePath(path.resolve(fsPath));
  }

  function getServiceName(serviceNamespace: string): string {
    const dotPos = serviceNamespace.indexOf(".");
    return serviceNamespace.substring(dotPos + 1);
  }

  async function generateServiceCode() {
    const genPath = options.controllerOutputPath;
    const registrationOutputPath = options.registrationOutputPath;

    // maps resource model name to arm Namespace
    const resourceNamespaceTable = new Map<string, string>();

    function transformPathParameter(parameter: ParameterInfo): MethodParameter {
      return {
        name: parameter.name,
        type: "string",
        description: parameter.description,
        location: "path",
        sourceNode: parameter.resourceType?.node,
      };
    }

    const modelsToGenerate = new Map<string, ModelType>();
    const resources = new Map<string, Resource>();

    function populateResources() {
      const armResourceLookup: Map<string, Resource> = new Map<string, Resource>();
      function getStandardOperation(
        opName: string,
        resourceInfo: ArmResourceInfo,
        modelName: string,
        sourceType: Type
      ): Operation | undefined {
        const pathParams = resourceInfo.resourcePath?.parameters.map((p) =>
          transformPathParameter(p)
        );
        if (resourceInfo.resourceNameParam) {
          pathParams!.push(transformPathParameter(resourceInfo.resourceNameParam!));
        }
        switch (opName) {
          case GetName:
            return {
              name: "Get",
              parameters: pathParams,
              returnType: modelName,
              verb: "GET",
              sourceNode: sourceType.node,
            };
          case PutName:
            return {
              name: "CreateOrUpdate",
              parameters: [
                ...pathParams!,
                {
                  name: "body",
                  location: "body",
                  description: "The resource data.",
                  type: modelName,
                  sourceNode: sourceType.node,
                },
              ],
              returnType: modelName,
              verb: "PUT",
              requestParameter: {
                name: "body",
                location: "body",
                description: "The resource data.",
                type: modelName,
              },
              sourceNode: sourceType.node,
            };
          case DeleteName:
            return {
              name: "Delete",
              parameters: pathParams,
              returnType: "void",
              verb: "Delete",
              sourceNode: sourceType.node,
            };
          case PatchName:
            return {
              name: "Update",
              parameters: [
                ...pathParams!,
                {
                  name: "body",
                  location: "body",
                  description: "The resource patch data.",
                  type: `${modelName}Update`,
                  sourceNode: sourceType.node,
                },
              ],
              returnType: modelName,
              verb: "PATCH",
              requestParameter: {
                name: "body",
                location: "body",
                description: "The resource patch data.",
                type: `${modelName}Update`,
              },
              sourceNode: sourceType.node,
            };
          default:
            return undefined;
        }
      }

      function GetAdditionalOperations() {
        const modelNameSpaces: NamespaceType[] = getRoutes(program).map(
          (res) => res as NamespaceType
        );
        const visitedNamespaces = new Map<string, NamespaceType>();
        const visitedOperations = new Map<string, OperationType>();
        const outOperations = new Map<string, Operation[]>();
        function visitModel(model: ModelType, namespaceKey: string) {
          const modelKey: string = model.name;
          if (!modelsToGenerate.has(modelKey) && !getKnownType(model)) {
            modelsToGenerate.set(modelKey, model);
          }
        }

        function extractResponseType(operation: OperationType): ModelType | undefined {
          const model = operation.returnType;
          let union = model as UnionType;
          if (union) {
            let outModel: ModelType | undefined = undefined;
            union?.options.forEach((option) => {
              let optionModel = option as ModelType;
              if (
                optionModel &&
                optionModel.name === "ArmResponse" &&
                optionModel.templateArguments
              ) {
                let innerModel = optionModel.templateArguments[0] as ModelType;
                if (innerModel) {
                  outModel = innerModel;
                }
              } else if (optionModel && optionModel.name !== "ErrorResponse") {
                outModel = optionModel;
              }
            });

            if (outModel === undefined) {
              reportDiagnostic(program, {
                code: "invalid-response",
                format: { operationName: operation ? operation.name : "<unknown>" },
                target: operation,
              });
            }

            return outModel;
          }

          return model as ModelType;
        }

        function visitOperations(
          operations: Map<string, OperationType>,
          namespaceKey: string,
          resource?: Resource
        ) {
          let localOperations: Operation[] = [];
          const visitedTypes = new Set<Type>();
          operations.forEach((operation) => visitOperation(operation, namespaceKey));
          if (!outOperations.has(namespaceKey)) {
            outOperations.set(namespaceKey, localOperations);
          }

          function visitType(cadlType: Type) {
            if (!visitedTypes.has(cadlType)) {
              visitedTypes.add(cadlType);

              switch (cadlType.kind) {
                case "Array":
                  visitType(cadlType.elementType);
                  break;
                case "Tuple":
                  cadlType.values.forEach((element) => {
                    visitType(element);
                  });
                  break;
                case "TemplateParameter":
                  cadlType.instantiationParameters?.forEach((element) => {
                    visitType(element);
                  });
                  break;
                case "Union":
                  cadlType.options.forEach((element) => {
                    visitType(element);
                  });
                  break;
                case "ModelProperty":
                  visitType(cadlType.type);
                  break;
                case "Model":
                  if (cadlType.baseModel) {
                    visitType(cadlType.baseModel);
                  }
                  cadlType.templateArguments?.forEach((element) => {
                    visitType(element);
                  });
                  if (!getKnownType(cadlType)) {
                    cadlType.properties.forEach((element) => {
                      visitType(element);
                    });
                    visitModel(cadlType, namespaceKey);
                  }
                  break;
                default:
                  // do nothing
                  break;
              }
            }
          }

          function visitOperation(operation: OperationType, namespaceKey: string) {
            const operationKey: string = namespaceKey + "." + operation.name;
            let httpOperation = getHttpOperation(program, operation);
            let bodyProp: MethodParameter | undefined = undefined;
            if (!visitedOperations.has(operationKey)) {
              visitedOperations.set(operationKey, operation);
              let returnType = extractResponseType(operation);
              if (returnType) {
                visitType(returnType);
              }
              let parameters: MethodParameter[] = [];

              if (operation.parameters) {
                operation.parameters.properties.forEach((prop) => {
                  let propType = getCSharpType(prop.type);
                  if (prop.name === "api-version" && propType?.name === "string") {
                    // skip standard api-version parameter
                  } else if (propType) {
                    visitType(prop.type);
                    let propLoc: string = isQueryParam(program, prop)
                      ? "Query"
                      : isPathParam(program, prop)
                      ? "Path"
                      : isBody(program, prop)
                      ? "Body"
                      : "????";
                    const paramDescription = getDoc(program, prop);
                    parameters.push({
                      name: prop.name,
                      type: propType.name,
                      description: paramDescription,
                      location: propLoc,
                      sourceNode: prop.node,
                      default: prop.default && formatDefaultValue(prop.type, prop.default),
                    });
                    if (propLoc === "Body") {
                      bodyProp = {
                        name: prop.name,
                        type: propType.name,
                        description: paramDescription,
                        location: propLoc,
                        sourceNode: prop.node,
                      };
                    }
                  }
                });
              }

              let route = httpOperation?.route;

              getPathParamName(program, operation);
              const outOperation: Operation = {
                name: transformCSharpIdentifier(operation.name),
                returnType: returnType?.name ?? "void",
                parameters: parameters,
                subPath: httpOperation!.route?.subPath,
                verb: httpOperation!.route?.verb,
                sourceNode: operation.node,
              };
              if (bodyProp !== undefined) {
                outOperation.requestParameter = bodyProp;
              }
              // use the default path for post operations
              if (outOperation.verb === "post" && !outOperation.subPath) {
                outOperation.subPath = outOperation.name;
              }
              localOperations.push(outOperation);

              let exists: boolean = false;
              if (resource) {
                exists = resource.operations?.some((op) => op.name === outOperation.name) ?? false;
              }

              if (resource && !exists) {
                resource!.operations!.push(outOperation);
              }
            }
          }
        }
        function visitNamespace(visited: NamespaceType, parent?: string) {
          let key: string = visited.name;
          if (isRoute(program, visited)) {
          }

          let resource: Resource | undefined = undefined;
          if (armResourceLookup.has(key)) {
            resource = armResourceLookup.get(key)!;
          }

          if (!visitedNamespaces.has(key)) {
            visitedNamespaces.set(key, visited);
            let armSpace = getArmNamespace(program, visited);
            if (armSpace) {
              visitOperations(visited.operations, key, resource);
            }
          }
        }

        modelNameSpaces.forEach((namespace: NamespaceType) => {
          visitNamespace(namespace);
        });
      }

      for (let res of getArmResources(program).map((r) => <Type>r)) {
        let resourceInfo = getArmResourceInfo(program, res)!;
        if (!resources.has(resourceInfo.resourceModelName)) {
          let modelName = resourceInfo.resourceModelName;
          let listName = resourceInfo.resourceListModelName;
          let matchingNamespace = resourceInfo.armNamespace;
          const cSharpModelName = transformCSharpIdentifier(resourceInfo.resourceModelName);
          resourceNamespaceTable.set(resourceInfo.resourceModelName, resourceInfo.armNamespace);
          const map = new Map<string, Operation>();
          resourceInfo.standardOperations
            .filter((o) => o == PutName || o == PatchName || o == DeleteName || o == GetName)
            .forEach((op) => {
              let value = getStandardOperation(op, resourceInfo, cSharpModelName, res)!;
              if (value && !map.has(value.name)) {
                map.set(value.name, value);
              }
            });
          const outResource = {
            hasResourceGroupList: resourceInfo.standardOperations.includes(ListName),
            hasSubscriptionList: resourceInfo.standardOperations.includes(ListName),
            serviceName: serviceName,
            itemPath:
              resourceInfo.resourcePath!.path +
              (resourceInfo.resourceNameParam !== undefined
                ? "/{" + resourceInfo.resourceNameParam!.name + "}"
                : ""),
            name: resourceInfo.resourceModelName,
            resourceTypeName: resourceInfo.resourceTypeName,
            nameSpace: serviceNamespace,
            nameParameter: resourceInfo.resourceNameParam?.name ?? "name",
            serializedName: transformJsonIdentifier(resourceInfo.collectionName),
            operations: [...map.values()],
            specificationArmNamespace: matchingNamespace,
            specificationModelName: transformCSharpIdentifier(modelName),
            specificationListModelName: transformCSharpIdentifier(listName),
            sourceNode: res.node,
          };
          resources.set(modelName, outResource);
          outputModel.resources.push(outResource);
          resourceInfo.operationNamespaces.forEach((ns) => armResourceLookup.set(ns, outResource));
        }
      }

      GetAdditionalOperations();
    }

    function populateModels() {
      const models = new Map<string, Model>();
      function populateModel(cadlType: Type) {
        let model = cadlType as ModelType;
        if (model && model.name && model.name.length > 0) {
          const typeRef = getCSharpType(model);
          reportInfo(`*** ${model.name} => ${typeRef?.name}`, model.node);
          if (typeRef) {
            const outModel: Model = {
              name: typeRef?.name ?? model.name,
              nameSpace: typeRef?.nameSpace ?? modelNamespace,
              properties: [],
              description: getDoc(program, model),
              serviceName: serviceName,
              typeParameters: model.templateArguments
                ? model.templateArguments!.map((arg) => getCSharpType(arg)!)
                : [],
              isDerivedType: false,
              isImplementer: false,
              isBuiltIn: typeRef?.isBuiltIn ?? false,
              validations: getValidations(cadlType),
              sourceNode: cadlType.node,
            };
            if (
              model.baseModel ||
              (model.templateArguments && model.templateArguments.length > 0)
            ) {
              outModel.isDerivedType = true;
              const baseType: TypeReference[] = [];
              if (model.baseModel) {
                const converted = getCSharpType(model.baseModel);
                if (converted) {
                  baseType.push(converted);
                }
              }

              if (model.templateNode) {
                const templateBase = program.checker!.getTypeForNode(model.templateNode);
                if (templateBase) {
                  let modelType = templateBase as ModelType;
                  const converted = getCSharpType(modelType);
                  if (converted) {
                    baseType.push(converted);
                  }
                }
              }
              outModel.baseClass = baseType.length > 0 ? baseType[0] : undefined;
            }
            if (model.properties && model.properties.size > 0) {
              [...model.properties.values()]
                ?.filter((prop) => prop.name !== "systemData")
                ?.forEach((val) => {
                  const decl = getPropertyDecl(val, model);
                  if (decl) {
                    outModel.properties.push(decl);
                  }
                });
            }
            if (!outModel.isBuiltIn) {
              models.set(outModel.name, outModel);
            }
          }
        }
      }

      modelsToGenerate.forEach((r) => {
        if (!models.has(r.name)) {
          populateModel(r);
        }
      });

      models.forEach((model) => {
        outputModel.models.push(model);
      });

      reportVerboseInfo("MODELS");
      reportVerboseInfo("------");
      reportVerboseInfo(JSON.stringify(models, replacer));

      reportVerboseInfo("ENUMS");
      reportVerboseInfo("-----");
      reportVerboseInfo(JSON.stringify(outputModel.enumerations, replacer));
    }

    function replacer(key: any, value: any) {
      if (key === "sourceNode") {
        return "<redacted>";
      }
      if (value instanceof Map) {
        return {
          dataType: "Map",
          value: Array.from(value.entries()), // or with spread: value: [...value]
        };
      } else {
        return value;
      }
    }

    getArmResources(program).forEach((cadlType) => {
      function reportResourceInfo(message: string) {
        reportInfo(message, cadlType.node);
      }
      const resourceMeta = getArmResourceInfo(program, cadlType)!;
      reportResourceInfo("ARM RESOURCE DETAILS");
      reportResourceInfo("--------------------");
      reportResourceInfo("armNamespace: " + resourceMeta.armNamespace);
      reportResourceInfo("parentNamespace: " + resourceMeta.parentNamespace);
      reportResourceInfo("resourceModelName: " + resourceMeta.resourceModelName);
      reportResourceInfo("resourceListModelName: " + resourceMeta.resourceListModelName);
      reportResourceInfo("resourceKind: " + resourceMeta.resourceKind);
      reportResourceInfo("collectionName: " + resourceMeta.collectionName);
      reportResourceInfo("operations: " + resourceMeta.standardOperations);
      reportResourceInfo("resourceNameParam: " + resourceMeta.resourceNameParam?.name);
      reportResourceInfo("parentResourceType: " + resourceMeta.parentResourceType?.kind);
      reportResourceInfo("resourcePath: " + resourceMeta.resourcePath?.path);
      const cType = getCSharpType(cadlType);
      reportResourceInfo(
        `-- ${resourceMeta.resourceModelName} => ${cType?.nameSpace}.${cType?.name}`
      );
      reportResourceInfo("--------------------");
    });
    populateResources();
    reportVerboseInfo(JSON.stringify(outputModel.resources, replacer));
    populateModels();

    function getPropertyDecl(
      property: ModelTypeProperty,
      parent?: ModelType
    ): Property | undefined {
      const spreadNode = property.node as ModelSpreadPropertyNode;
      if (spreadNode && property.sourceProperty === undefined) {
        let parentNode = spreadNode.parent;
        if (parentNode) {
          let parentType = program.checker!.getTypeForNode(parentNode);
          const parentModel = parentType as ModelType;
          // remove special case when we refactor library type changes to models
          if (parentModel !== parent && property.name !== "properties") {
            return undefined;
          }
        }
      }
      const outPropertyType = getCSharpType(property.type)!;
      const outProperty: Property = {
        name: transformCSharpIdentifier(property.name),
        type: outPropertyType,
        validations: getValidations(property),
        description: getDoc(program, property),
        default: property.default && formatDefaultValue(property.type, property.default),
      };
      return outProperty;
    }

    function formatDefaultValue(propertyType: Type, defaultValue: Type): string {
      switch (defaultValue.kind) {
        case "String":
        case "Number":
        case "Boolean":
          return formatPrimitiveType(defaultValue);
        case "Tuple":
          return formatTupleValue(propertyType, defaultValue);
        default:
          throw new Error(`Unsupported default value '${defaultValue.kind}'`);
      }
    }

    function formatTupleValue(propertyType: Type, defaultValue: TupleType): string {
      const items = defaultValue.values.map((x) =>
        formatDefaultValue((propertyType as ArrayType).elementType, x)
      );
      const type = getCSharpType(propertyType)!;
      return `new ${type.name} { ${items.join(", ")} }`;
    }

    function formatPrimitiveType(
      type: StringLiteralType | BooleanLiteralType | NumericLiteralType
    ): string {
      switch (type.kind) {
        case "String":
          return `"${type.value}"`;
        case "Number":
          return `${type.value}`;
        case "Boolean":
          return `${type.value}`;
      }
    }

    function transformCSharpIdentifier(identifier: string): string {
      return identifier[0].toLocaleUpperCase() + identifier.substring(1);
    }

    function transformJsonIdentifier(identifier: string): string {
      return identifier[0].toLocaleLowerCase() + identifier.substring(1);
    }

    function getPatternAttribute(parameter: string): ValidationAttribute {
      return {
        name: "Pattern",
        parameters: [
          {
            value: parameter,
            type: "string",
          },
        ],
      };
    }

    function getLengthAttribute(minLength?: number, maxLength?: number): ValidationAttribute {
      const output: ValidationAttribute = {
        name: "Length",
        parameters: [],
      };

      if (minLength) {
        output.parameters?.push({ type: "int", value: minLength });
      }

      if (maxLength) {
        output.parameters?.push({ type: "int", value: maxLength });
      }

      return output;
    }

    function createInlineEnum(cadlType: EnumType): TypeReference {
      const outEnum: Enumeration = {
        isClosed: false,
        name: cadlType.name,
        serviceName: serviceName,
        values: [],
        sourceNode: cadlType.node,
      };
      cadlType.members.forEach((option) => {
        outEnum.values.push({
          name: option.name,
          value: option.value,
          sourceNode: option.node,
        });
      });

      outputModel.enumerations.push(outEnum);
      const outType: TypeReference = {
        name: outEnum.name,
        nameSpace: "Microsoft.Service.Models",
        isBuiltIn: false,
      };

      return outType;
    }

    function getValidations(cadlType: Type): ValidationAttribute[] {
      const visited: Map<Type, ValidationAttribute[]> = new Map<Type, ValidationAttribute[]>();
      function getLocalValidators(localType: Type): ValidationAttribute[] {
        if (visited.has(localType)) {
          return visited.get(localType)!;
        }

        const output: ValidationAttribute[] = [];

        let format = getFormat(program, localType);
        if (format) {
          output.push(getPatternAttribute(format));
        }

        let minLength = getMinLength(program, localType);
        let maxLength = getMaxLength(program, localType);
        if (minLength || maxLength) {
          output.push(getLengthAttribute(minLength, maxLength));
        }

        visited.set(localType, output);
        return output;
      }

      const outValidations: ValidationAttribute[] = getLocalValidators(cadlType);
      switch (cadlType.kind) {
        case "Array":
          getValidations(cadlType.elementType).forEach((i) => outValidations.push(i));
          break;
        case "Tuple":
          cadlType.values.forEach((v) =>
            getValidations(v).forEach((val) => outValidations.push(val))
          );
          break;
        case "Union":
          cadlType.options.forEach((o) =>
            getValidations(o).forEach((val) => outValidations.push(val))
          );
          break;
        case "Model":
          if (cadlType.baseModel) {
            getValidations(cadlType.baseModel).forEach((val) => outValidations.push(val));
          }
          if (cadlType.templateNode) {
            const templateType = program.checker!.getTypeForNode(cadlType.templateNode);
            getValidations(templateType).forEach((val) => outValidations.push(val));
          }
          break;
        case "ModelProperty":
          getValidations(cadlType.type).forEach((val) => outValidations.push(val));
          break;
        default:
          // do nothing
          break;
      }

      return outValidations;
    }

    function isSealedBaseModel(refType: TypeReference | undefined) {
      return refType && refType.isBuiltIn && refType.nameSpace.toLowerCase().startsWith("system");
    }

    function getCSharpType(cadlType: Type): TypeReference | undefined {
      switch (cadlType.kind) {
        case "String":
          return { name: "string", nameSpace: "System", isBuiltIn: true };
        case "Boolean":
          return { name: "bool", nameSpace: "System", isBuiltIn: true };
        case "Union":
          // Need to figure out if we want to support unions, otherwise this will require a static analysis rule.
          reportDiagnostic(program, { code: "no-union", target: cadlType.node });
          return undefined;
        case "Array":
          const arrType = getCSharpType(cadlType.elementType);
          if (arrType) {
            return {
              name: arrType.name + "[]",
              nameSpace: arrType.nameSpace,
              isBuiltIn: arrType.isBuiltIn,
            };
          }
          return undefined;
        case "Tuple":
          const params: TypeReference[] = [];
          cadlType.values.forEach((val) => {
            const ref = getCSharpType(val);
            if (ref) {
              params.push(ref);
            }
          });
          return {
            isBuiltIn: false,
            name: "Tuple",
            nameSpace: "System.Collections.Generic",
            typeParameters: params,
          };
        case "Enum":
          return createInlineEnum(cadlType);
        case "Model":
          // Is the type templated with only one type?
          if (cadlType.baseModel && (!cadlType.properties || cadlType.properties.size === 0)) {
            const outRef = getCSharpType(cadlType.baseModel);
            if (isSealedBaseModel(outRef)) {
              return outRef;
            }
          }

          switch (cadlType.name) {
            case "bytes":
              return { name: "byte[]", nameSpace: "System", isBuiltIn: true };
            case "int32":
              return { name: "int", nameSpace: "System", isBuiltIn: true };
            case "int64":
              return { name: "int", nameSpace: "System", isBuiltIn: true };
            case "float64":
              return { name: "double", nameSpace: "System", isBuiltIn: true };
            case "float32":
              return { name: "float", nameSpace: "System", isBuiltIn: true };
            case "string":
              return { name: "string", nameSpace: "System", isBuiltIn: true };
            case "boolean":
              return { name: "bool", nameSpace: "System", isBuiltIn: true };
            case "plainDate":
              return { name: "DateTime", nameSpace: "System", isBuiltIn: true };
            case "zonedDateTime":
              return { name: "DateTime", nameSpace: "System", isBuiltIn: true };
            case "plainTime":
              return { name: "DateTime", nameSpace: "System", isBuiltIn: true };
            case "Map":
              // We assert on valType because Map types always have a type
              const valType = cadlType.properties.get("v");
              return {
                name: "IDictionary",
                nameSpace: "System.Collections",
                isBuiltIn: true,
                typeParameters: [
                  { name: "string", nameSpace: "System", isBuiltIn: true },
                  getCSharpType(valType!.type)!,
                ],
              };
            default:
              const known = getKnownType(cadlType);
              if (cadlType.name === undefined || cadlType.name === "") {
                return undefined;
              }
              if (known) {
                return known;
              }
              return {
                name: transformCSharpIdentifier(cadlType.name),
                nameSpace: modelNamespace,
                isBuiltIn: false,
              };
          }
        case "Intrinsic":
          return undefined;
        case "TemplateParameter":
          return undefined;
        case "String":
          return undefined;
        default:
          return undefined;
      }
    }

    function getKnownType(model: ModelType): TypeReference | undefined {
      switch (model.name) {
        case "ErrorResponse":
          return {
            isBuiltIn: true,
            name: "Resource",
            nameSpace: "Microsoft.Cadl.RPaaS",
          };
        case "ArmResponse":
          return {
            isBuiltIn: true,
            name: "ArmResponse",
            nameSpace: "Microsoft.Cadl.RPaaS",
          };
        case "ArmDeleteAcceptedResponse":
        case "ArmCreatedResponse":
          return {
            isBuiltIn: true,
            name: "void",
            nameSpace: "System",
          };
        case "Operation":
          return {
            isBuiltIn: true,
            name: "Operation",
            nameSpace: "Microsoft.Cadl.RPaaS",
          };
        case "OperationListResult":
          return {
            isBuiltIn: true,
            name: "OperationListResult",
            nameSpace: "Microsoft.Cadl.RPaaS",
          };
        case "ArmResource":
          return {
            isBuiltIn: true,
            name: "Resource",
            nameSpace: "Microsoft.Cadl.RPaaS",
          };
        case "TrackedResourceBase":
        case "TrackedResource": {
          const baseResource: TypeReference = {
            isBuiltIn: true,
            name: "TrackedResource",
            nameSpace: "Microsoft.Cadl.RPaaS",
          };
          if (model.templateArguments && model.templateArguments.length === 1) {
            const propertiesType = getCSharpType(model.templateArguments[0]);
            if (propertiesType) {
              baseResource.typeParameters = [propertiesType];
            }
          }

          return baseResource;
        }
        case "ProxyResourceBase":
        case "ProxyResource":
          return {
            isBuiltIn: true,
            name: "ProxyResource",
            nameSpace: "Microsoft.Cadl.RPaaS",
          };
        case "SystemData":
          return {
            isBuiltIn: true,
            name: "SystemData",
            nameSpace: "Microsoft.Cadl.RPaaS",
          };
        case "ExtensionResourceBase":
        case "ExtensionResource":
          return {
            isBuiltIn: true,
            name: "ProxyResource",
            nameSpace: "Microsoft.Cadl.RPaaS",
          };
        case "Pageable":
        case "Page": {
          const returnValue: TypeReference = {
            isBuiltIn: true,
            name: "Pageable",
            nameSpace: "Microsoft.Cadl.RPaaS",
            typeParameters: [],
          };
          let innerType = model.templateArguments
            ? getCSharpType(model.templateArguments![0])
            : undefined;
          if (innerType) {
            returnValue.typeParameters!.push(innerType);
          }
          return returnValue;
        }
        default:
          return undefined;
      }
    }

    async function generateResource(resource: any) {
      const resourceControllerPath = genPath + "/" + resource.name + "Controller.cs";
      const resourceControllerBasePath = genPath + "/" + resource.name + "ControllerBase.cs";
      reportInfo("Writing resource controller for " + resource.name, undefined);
      await program.host.writeFile(
        resolvePath(resourceControllerBasePath),
        await sqrl.renderFile(
          resolvePath(path.join(templatePath, "resourceControllerBase.sq")),
          resource
        )
      );
      await program.host.writeFile(
        resolvePath(resourceControllerPath),
        await sqrl.renderFile(
          resolvePath(path.join(templatePath, "resourceController.sq")),
          resource
        )
      );
      if (registrationOutputPath) {
        await generateRegistration(resource);
      }
    }

    async function generateResourceProviderReg(serviceModel: ServiceModel) {
      const outputPath = registrationOutputPath + `/${serviceModel.nameSpace}.json`;
      const regTemplate = resolvePath(path.join(templatePath, "resourceProviderRegistration.sq"));
      await program.host.writeFile(
        outputPath,
        await sqrl.renderFile(regTemplate, { serviceName: serviceModel.serviceName })
      );
    }

    async function generateRegistration(resource: any) {
      const resourceRegistrationPath =
        registrationOutputPath + `/${resource.nameSpace}/` + resource.resourceTypeName + ".json";
      reportInfo("Writing resource registrations for " + resource.resourceTypeName, undefined);
      const extensions = new Set<string>();
      for (const operation of resource.operations) {
        const extensionMap = {
          put: ["ResourceCreationValidate", "ResourceCreationBegin", "ResourceCreationCompleted"],
          patch: ["ResourcePatchValidate", "ResourcePatchBegin", "ResourcePatchCompleted"],
          delete: ["ResourceDeleteValidate", "ResourceDeleteBegin", "ResourceDeleteCompleted"],
          get: ["ResourceReadValidate", "ResourceReadBegin"],
          post: ["ResourcePostAction"],
        } as any;
        const _extensions = extensionMap[operation.verb.toLowerCase()] as string[];
        if (_extensions) {
          _extensions.forEach((element) => {
            extensions.add(element as string);
          });
        }
      }
      await program.host.writeFile(
        resolvePath(resourceRegistrationPath),
        await sqrl.renderFile(resolvePath(path.join(templatePath, "resourceRegistration.sq")), {
          apiVersion: getServiceVersion(program),
          extensions: Array.from(extensions.values()),
        })
      );
    }

    async function generateModel(model: any) {
      const modelPath = path.join(genPath, "models", model.name + ".cs");
      const modelTemplate = resolvePath(path.join(templatePath, "model.sq"));
      await program.host.writeFile(
        resolvePath(modelPath),
        await sqrl.renderFile(modelTemplate, model)
      );
    }

    async function generateEnum(model: any) {
      const modelPath = genPath + "/models/" + model.name + ".cs";
      const templateFile = resolvePath(
        path.join(templatePath, model.isClosed ? "closedEnum.sq" : "openEnum.sq")
      );
      await program.host.writeFile(
        resolvePath(modelPath),
        await sqrl.renderFile(templateFile, model)
      );
    }

    async function generateSingleDirectory(basePath: string, outPath: string) {
      reportProgress("+++++++");
      reportProgress("Generating single file templates");
      reportProgress("  basePath: " + basePath);
      reportProgress("  outPath: " + outPath);

      const singleTemplatePath = path.join(templatePath, "single");

      (await fs.readdir(singleTemplatePath)).forEach(async (file) => {
        const templatePath = resolvePath(path.join(singleTemplatePath, file));
        await generateSingleFile(templatePath, outPath).catch((err) =>
          reportDiagnostic(program, {
            code: "creating-file",
            format: { filename: file, error: err },
            target: NoTarget,
          })
        );
      });

      reportProgress("++++++");
      async function generateSingleFile(templatePath: string, outPath: string) {
        const templateFile = path.basename(templatePath);
        const baseName = templateFile.substring(0, templateFile.lastIndexOf("."));
        const outFile = path.join(outPath, baseName + ".cs");
        reportProgress(`    -- ${templateFile} => ${outFile}`);
        const content = await sqrl.renderFile(templatePath, outputModel);
        await program.host.writeFile(resolvePath(outFile), content).catch((err) =>
          reportDiagnostic(program, {
            code: "writing-file",
            format: { filename: outFile, error: err },
            target: NoTarget,
          })
        );
      }
    }

    async function createDirIfNotExists(targetPath: string) {
      if (
        !(await program.host.stat(targetPath).catch((err) => {
          return false;
        }))
      ) {
        await mkdirp(targetPath);
      }
    }

    async function ensureCleanDirectory(targetPath: string) {
      try {
        await program.host.stat(targetPath);
        await fs.rmdir(targetPath, { recursive: true });
      } catch {}

      await fs.mkdir(targetPath);
    }

    const service = outputModel.serviceName;
    sqrl.filters.define("decl", (op) =>
      op.parameters
        .map((p: any) => p.type + " " + p.name + (p.default ? ` = ${p.default}` : ""))
        .join(", ")
    );
    sqrl.filters.define("call", (op) => op.parameters.map((p: any) => p.name).join(", "));
    sqrl.filters.define("bodyParameter", (op) => op.parameters[op.parameters.length - 1].name);
    sqrl.filters.define("typeParamList", (op) =>
      op.typeParameters.map((p: TypeReference) => p.name).join(", ")
    );
    sqrl.filters.define("callByValue", (op) =>
      op.parameters
        .map((p: ValueParameter) => (p.type === "string" ? `@"${p.value}"` : p.value))
        .join(", ")
    );
    sqrl.filters.define("initialCaps", (op) => transformCSharpIdentifier(op));
    const operationsPath = genPath;
    const routesPath = resolvePath(path.join(genPath, service + "ServiceRoutes.cs"));
    const templatePath = path.join(rootPath, "templates", options.controllerHost);
    const modelsPath = path.join(genPath, "models");
    if (!program.compilerOptions.noEmit && !program.hasError()) {
      await ensureCleanDirectory(genPath).catch((err) =>
        reportDiagnostic(program, {
          code: "cleaning-dir",
          format: { error: err },
          target: NoTarget,
        })
      );
      await createDirIfNotExists(operationsPath).catch((err) =>
        reportDiagnostic(program, {
          code: "creating-dir",
          format: { error: err },
          target: NoTarget,
        })
      );
      await createDirIfNotExists(modelsPath).catch((err) =>
        reportDiagnostic(program, {
          code: "creating-dir",
          format: { error: err },
          target: NoTarget,
        })
      );
      await program.host.writeFile(
        routesPath,
        await sqrl.renderFile(path.join(templatePath, "serviceRoutingConstants.sq"), outputModel)
      );
      await generateSingleDirectory(rootPath, operationsPath).catch((err) =>
        reportDiagnostic(program, {
          code: "creating-dir",
          format: { error: err },
          target: NoTarget,
        })
      );
      if (registrationOutputPath) {
        if (path.resolve(registrationOutputPath) !== path.resolve(genPath)) {
          await ensureCleanDirectory(registrationOutputPath).catch((err) =>
            reportDiagnostic(program, {
              code: "cleaning-dir",
              format: { error: err },
              target: NoTarget,
            })
          );
          await createDirIfNotExists(
            path.join(registrationOutputPath, outputModel.nameSpace)
          ).catch((err) =>
            reportDiagnostic(program, {
              code: "creating-dir",
              format: { error: err },
              target: NoTarget,
            })
          );
        }
        await generateResourceProviderReg(outputModel);
      }
      outputModel.resources.forEach(
        async (resource: Resource) =>
          await generateResource(resource).catch((error) =>
            reportDiagnostic(program, {
              code: "generating-resource",
              format: {
                namespace: resource?.nameSpace ?? "",
                resourceName: resource?.name ?? "",
                error,
              },
              target: NoTarget,
            })
          )
      );
      outputModel.models.forEach(async (model) => {
        reportInfo(`Rendering model ${model.nameSpace}.${model.name}`, model.sourceNode);
        await generateModel(model).catch((error) =>
          reportDiagnostic(program, {
            code: "generating-model",
            format: {
              namespace: model?.nameSpace ?? "",
              modelName: model?.name ?? "",
              error,
            },
            target: NoTarget,
          })
        );
      });

      outputModel.enumerations?.forEach((enumeration) => {
        reportInfo(`Rendering enum ${enumeration.name}`, enumeration.sourceNode);
        generateEnum(enumeration);
      });
    }
  }
}
