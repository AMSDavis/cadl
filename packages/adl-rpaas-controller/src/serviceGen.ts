import {
  getDoc,
  getFormat,
  getMaxLength,
  getMinLength,
  ModelSpreadPropertyNode,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  StringLiteralType,
  SyntaxKind,
  Type,
  UnionType
} from "@azure-tools/adl";
import {
  basePathForResource,
  getOperationRoute,
  getPathParamName,
  getResources,
  getServiceNamespaceString,
  isResource,
  isBody,
  isQueryParam,
  isPathParam,
  resource,
  _checkIfServiceNamespace,
  getHttpOperation
} from "@azure-tools/adl-rest";

import { ArmResourceInfo, getArmNamespace, getArmResourceInfo, getArmResources, ParameterInfo } from "@azure-tools/adl-rpaas";

import {
  fileURLToPath
} from "url"
import * as path from "path";
import * as sqrl from "squirrelly"
import * as fs from "fs/promises"


export async function onBuild(program: Program) {
  const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  console.log("rootpath: " + rootPath);
  const options: ServiceGenerationOptions = {
    controllerOutputPath: program.compilerOptions.serviceCodePath || path.join(path.resolve("."), "output"),
    controllerModulePath: rootPath
  };


  const generator = CreateServiceCodeGenerator(program, options);
  await generator.generateServiceCode();
}

export interface ServiceGenerationOptions {
  controllerOutputPath: string,
  controllerModulePath: string
}

export function CreateServiceCodeGenerator(program: Program, options: ServiceGenerationOptions) {
  const rootPath = options.controllerModulePath;
  const serviceName: string = getServiceName(getServiceNamespaceString(program)!);
  const serviceNamespace = "Microsoft." + serviceName;
  const modelNamespace = serviceNamespace + ".Models";
  const ListName = "list", PutName = "create", PatchName = "update", DeleteName = "delete", GetName = "read";

  interface Resource {
    name: string,
    nameSpace: string,
    serviceName: string,
    serializedName: string,
    nameParameter: string,
    hasSubscriptionList: boolean,
    hasResourceGroupList: boolean,
    itemPath: string,
    operations?: Operation[],
    specificationArmNamespace: string,
    specificationModelName: string,
    specificationListModelName: string
  }

  interface Operation {
    name: string,
    returnType: string,
    verb: string,
    subPath?: string,
    parameters?: MethodParameter[],
  }

  interface MethodParameter {
    name: string,
    type: string,
    location?: string,
    description?: string
  }

  interface Model extends TypeDeclaration {
    serviceName: string,
    description?: string,
    properties: Property[]
  }

  interface Property {
    name: string,
    type: TypeReference,
    validations: ValidationAttribute[],
    description?: string
  }

  interface TypeReference {
    name: string,
    nameSpace: string,
    typeParameters?: TypeReference[],
    isBuiltIn: boolean
  }

  interface TypeDeclaration extends TypeReference {
    isDerivedType: boolean,
    isImplementer: boolean,
    baseClass?: TypeReference,
    implements?: TypeReference[],
    validations?: ValidationAttribute[]
  }

  interface ValidationAttribute {
    name: string,
    parameters?: ValueParameter[]
  }

  interface ValueParameter {
    value: any,
    type: string
  }

  interface Enumeration {
    serviceName: string,
    name: string,
    description?: string,
    isClosed: boolean,
    values: EnumValue[]
  }

  interface EnumValue {
    name: string,
    value?: string,
    description?: string
  }

  interface ServiceModel {
    nameSpace: string,
    serviceName: string,
    resources: Resource[],
    models: Model[],
    enumerations: Enumeration[]
  };

  const outputModel: ServiceModel = {
    nameSpace: serviceNamespace,
    serviceName: serviceName,
    resources: [],
    models: [],
    enumerations: []
  }

  let GenerationCounter: number = 1;


  return { generateServiceCode };

  function getServiceName(serviceNamespace: string): string {
    const dotPos = serviceNamespace.indexOf('.');
    return serviceNamespace.substring(dotPos + 1);
  }

  async function generateServiceCode() {

    const genPath = options.controllerOutputPath;
    // maps resource model name to arm Namespace
    const resourceNamespaceTable = new Map<string, string>();

    function transformPathParameter(parameter: ParameterInfo): MethodParameter {
      return {
        name: parameter.name,
        type: "string",
        description: "",
        location: "path"
      };
    }

    const modelsToGenerate = new Map<string, ModelType>();
    const resources = new Map<string, Resource>();

    function populateResources() {
      const armResources = getArmResources();
      const armResourceLookup: Map<string, Resource> = new Map<string, Resource>();
      function getStandardOperation(opName: string, resourceInfo: ArmResourceInfo, modelName: string): Operation | undefined {
        const pathParams = resourceInfo.resourcePath?.parameters.map(p => transformPathParameter(p));
        if (resourceInfo.resourceNameParam) {
          pathParams!.push(transformPathParameter(resourceInfo.resourceNameParam!));
        }
        switch (opName) {
          case GetName:
            return {
              name: "Get",
              parameters: pathParams,
              returnType: modelName,
              verb: "GET"
            };
          case PutName:
            return {
              name: "CreateOrUpdate",
              parameters: [...pathParams!, { name: "body", location: "body", description: "The resource data.", type: modelName }],
              returnType: modelName,
              verb: "PUT"
            };
          case DeleteName:
            return {
              name: "Delete",
              parameters: pathParams,
              returnType: "void",
              verb: "Delete"
            };
          case PatchName:
            return {
              name: "Update",
              parameters: [...pathParams!, { name: "body", location: "body", description: "The resource patch data.", type: "ResourceUpdate" }],
              returnType: modelName,
              verb: "PATCH"
            };
          default:
            return undefined;
        }
      }

      function GetAdditionalOperations() {
        const modelNameSpaces: NamespaceType[] = getResources(program).map(res => res as NamespaceType);
        const visitedNamespaces = new Map<string, NamespaceType>();
        const visitedOperations = new Map<string, OperationType>();
        const outOperations = new Map<string, Operation[]>();
        function visitModel(model: ModelType, namespaceKey: string) {
          const modelKey: string = model.name;
          if (!modelsToGenerate.has(modelKey) && !getKnownType(model)) {
            modelsToGenerate.set(modelKey, model);
          }
        }

        function extractResponseType(model: Type): ModelType | undefined {

          var union = model as UnionType;
          if (union) {
            let outModel: ModelType | undefined = undefined;
            union?.options.forEach(option => {
              let optionModel = option as ModelType;
              if (optionModel && optionModel.name === "ArmResponse" && optionModel.templateArguments) {
                let innerModel = optionModel.templateArguments[0] as ModelType;
                if (innerModel) {
                  outModel = innerModel;
                }
              }
            });

            return outModel;
          }
          
          return model as ModelType;
        }

        function visitOperations(operations: Map<string, OperationType>, namespaceKey: string, resource?: Resource) {
          let localOperations: Operation[] = [];
          const visitedTypes = new Set<Type>();
          operations.forEach(operation => visitOperation(operation, namespaceKey));
          if (!outOperations.has(namespaceKey)) {
            outOperations.set(namespaceKey, localOperations)
          }

          function visitType(adlType: Type) {
            if (!visitedTypes.has(adlType)) {
              visitedTypes.add(adlType);

              switch (adlType.kind) {
                case "Array":
                  visitType(adlType.elementType);
                  break;
                case "Tuple":
                  adlType.values.forEach(element => { visitType(element) });
                  break;
                case "TemplateParameter":
                  adlType.instantiationParameters?.forEach(element => { visitType(element) });
                  break;
                case "Union":
                  adlType.options.forEach(element => { visitType(element) });
                  break;
                case "ModelProperty":
                  visitType(adlType.type);
                  break;
                case "Model":
                  adlType.baseModels?.forEach(element => { visitType(element) });
                  adlType.templateArguments?.forEach(element => { visitType(element) });
                  if (!getKnownType(adlType)) {
                    adlType.properties.forEach(element => { visitType(element) });
                    visitModel(adlType, namespaceKey);
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
            console.log("== BEGIN OPERATION " + operation.name + " ==");
            if (!visitedOperations.has(operationKey)) {
              visitedOperations.set(operationKey, operation);
              let returnType = extractResponseType(operation.returnType);
              if (returnType) {
                visitType(returnType);
              }
              let parameters: MethodParameter[] = [];

              if (operation.parameters) {
                operation.parameters.properties.forEach(prop => {
                  var propType = getCSharpType(prop.type);
                  if (prop.name === "api-version" && propType?.name === "string") {
                    // skip standard api-version parameter
                  }
                  else if (propType) {
                    visitType(prop.type);
                    let propLoc: string = isQueryParam(program, prop) ? "Query" : isPathParam(program,prop) ? "Path" : isBody(program, prop) ? "Body" : "????";
                    parameters.push({
                      name: prop.name,
                      type: propType.name,
                      location: propLoc
                    })
                  }
                })
              }

              var route = httpOperation?.route;
              console.log("Verb: " + route?.verb);
              if (route?.subPath) {
                console.log("using subpath: " + route?.subPath);
              }

              getPathParamName(program, operation)
              console.log("== END OPERATION " + operation.name + " ==");
              console.log();
              const outOperation = {
                name: transformCSharpIdentifier(operation.name),
                returnType: returnType?.name ?? "void",
                parameters: parameters,
                subPath: httpOperation!.route?.subPath,
                verb: httpOperation!.route.verb
              };
              localOperations.push(outOperation);

              let exists: boolean = false;
              if (resource) {

                exists = resource.operations?.some(op => op.name === outOperation.name) ?? false
              }

              if (resource && !exists) {
                resource!.operations!.push(outOperation);
              }
            }
          }
        }
        function visitNamespace(visited: NamespaceType, parent?: string) {
          let key: string = visited.name;
          if (isResource(program, visited)) {
          }

          let resource: Resource | undefined = undefined;
          if (armResourceLookup.has(key)) {
            resource = armResourceLookup.get(key)!;
          }

          if (!visitedNamespaces.has(key)) {
            visitedNamespaces.set(key, visited);
            let armSpace = getArmNamespace(visited);
            if (armSpace) {
              visitOperations(visited.operations, key, resource);
            }
          }
        }

        modelNameSpaces.forEach((namespace: NamespaceType) => {
          visitNamespace(namespace);
        });

      }

      armResources.forEach(res => {
        let resourceInfo = getArmResourceInfo(res);
        if (!resources.has(resourceInfo.resourceModelName)) {
          var modelName = resourceInfo.resourceModelName;
          var listName = resourceInfo.resourceListModelName;
          var matchingNamespace = resourceInfo.armNamespace
          const cSharpModelName = transformCSharpIdentifier(resourceInfo.resourceModelName);
          resourceNamespaceTable.set(resourceInfo.resourceModelName, resourceInfo.armNamespace);
          var map = new Map<string, Operation>();
          resourceInfo.standardOperations
            .filter(o => o == PutName || o == PatchName || o == DeleteName)
            .forEach(op => {
              let value = (getStandardOperation(op, resourceInfo, cSharpModelName)!);
              if (value && !map.has(value.name)) {
                map.set(value.name, value);
              }
            });
          const outResource = {
            hasResourceGroupList: resourceInfo.standardOperations.includes(ListName),
            hasSubscriptionList: resourceInfo.standardOperations.includes(ListName),
            serviceName: serviceName,
            itemPath: resourceInfo.resourcePath!.path + (resourceInfo.resourceNameParam !== undefined ? "/{" + resourceInfo.resourceNameParam!.name + "}" : ""),
            name: resourceInfo.resourceModelName,
            nameSpace: serviceNamespace,
            nameParameter: resourceInfo.resourceNameParam?.name ?? "name",
            serializedName: transformJsonIdentifier(resourceInfo.collectionName),
            operations: [...map.values()],
            specificationArmNamespace: matchingNamespace,
            specificationModelName: transformCSharpIdentifier(modelName),
            specificationListModelName: transformCSharpIdentifier(listName)
          };
          resources.set(modelName, outResource);
          outputModel.resources.push(outResource);
          resourceInfo.operationNamespaces.forEach(ns => armResourceLookup.set(ns, outResource));
        }
      });

      GetAdditionalOperations();
    }

    function populateModels() {
      const models = new Map<string, Model>();
      function populateModel(adlType: Type) {
        let model = adlType as ModelType;
        if (model) {
          const typeRef = getCSharpType(model);
          console.log("*** " + model.name + " => " + typeRef?.name);
          if (typeRef) {
            const outModel: Model = {
              name: typeRef?.name ?? model.name,
              nameSpace: typeRef?.nameSpace ?? modelNamespace,
              properties: [],
              description: getDoc(program, model),
              serviceName: serviceName,
              typeParameters: model.templateArguments ? model.templateArguments!.map(arg => getCSharpType(arg)!) : [],
              isDerivedType: false,
              isImplementer: false,
              isBuiltIn: typeRef?.isBuiltIn ?? false,
              validations: getValidations(adlType)
            };
            if ((model.baseModels && model.baseModels.length > 0) || (model.templateArguments && model.templateArguments.length > 0)) {
              outModel.isDerivedType = true;
              const baseType: TypeReference[] = [];
              model.baseModels.forEach(model => {
                const converted = getCSharpType(model);
                if (converted) {
                  baseType.push(converted)
                }
              });
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
              [...model.properties.values()]?.filter(prop => prop.name !== "systemData")?.forEach(val => {
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


      modelsToGenerate.forEach(r => {
        if (!models.has(r.name)) {
          populateModel(r);
        }
      });

      models.forEach(model => { outputModel.models.push(model); })
      console.log("MODELS");
      console.log("------");
      console.log(JSON.stringify(models, replacer));

      console.log("ENUMS");
      console.log("-----");
      console.log(JSON.stringify(outputModel.enumerations, replacer));
    }

    function replacer(key: any, value: any) {
      if (value instanceof Map) {
        return {
          dataType: 'Map',
          value: Array.from(value.entries()), // or with spread: value: [...value]
        };
      } else {
        return value;
      }
    }

    getArmResources().forEach(adlType => {
      const resourceMeta = getArmResourceInfo(adlType);
      console.log("ARM RESOURCE DETAILS");
      console.log("--------------------");
      console.log("armNamespace: " + resourceMeta.armNamespace);
      console.log("parentNamespace: " + resourceMeta.parentNamespace);
      console.log("resourceModelName: " + resourceMeta.resourceModelName);
      console.log("resourceListModelName: " + resourceMeta.resourceListModelName);
      console.log("resourceKind: " + resourceMeta.resourceKind);
      console.log("collectionName: " + resourceMeta.collectionName);
      console.log("operations: " + resourceMeta.standardOperations);
      console.log("resourceNameParam: " + resourceMeta.resourceNameParam?.name);
      console.log("parentResourceType: " + resourceMeta.parentResourceType?.kind);
      console.log("resourcePath: " + resourceMeta.resourcePath?.path);
      const cType = getCSharpType(adlType);
      console.log("-- " + resourceMeta.resourceModelName + " => " + cType?.nameSpace + "." + cType?.name);
      console.log("--------------------");

    });
    populateResources();
    console.log(JSON.stringify(outputModel.resources, replacer));
    populateModels();

    function getPropertyDecl(property: ModelTypeProperty, parent?: ModelType): Property | undefined {
      const spreadNode = property.node as ModelSpreadPropertyNode;
      if (spreadNode && property.sourceProperty === undefined) {
        let parentNode = spreadNode.parent;
        if (parentNode) {
          let parentType = program.checker!.getTypeForNode(parentNode);
          const parentModel = parentType as ModelType;
          // remove special case when we refactor library type changes to models
          if (parentModel !== parent && property.name !== "properties") {
            const parentCsharp = getCSharpType(parentType);
            return undefined;
          }
        }
      }
      const outPropertyType = getCSharpType(property.type)!;
      const outProperty: Property = {
        name: transformCSharpIdentifier(property.name),
        type: outPropertyType,
        validations: getValidations(property),
        description: getDoc(program, property)
      }
      return outProperty;
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
            type: "string"
          }
        ]
      };
    }

    function getLengthAttribute(minLength?: number, maxLength?: number): ValidationAttribute {
      var output: ValidationAttribute = {
        name: "Length",
        parameters: []
      };

      if (minLength) {
        output.parameters?.push({ type: "int", value: minLength });
      }

      if (maxLength) {
        output.parameters?.push({ type: "int", value: maxLength });
      }

      return output;
    }

    function createInlineEnum(adlType: UnionType, nameHint?: string): TypeReference {
      const outEnum: Enumeration = {
        isClosed: false,
        name: nameHint ?? "Enumeration" + GenerationCounter++,
        serviceName: serviceName,
        values: [],
      };
      adlType.options.forEach(option => {
        var stringOption = option as StringLiteralType;
        if (stringOption) {
          outEnum.values.push(
            {
              name: stringOption.value,
              value: stringOption.value
            }
          )
        }
      });

      outputModel.enumerations.push(outEnum);
      const outType: TypeReference = {
        name: outEnum.name,
        nameSpace: "Microsoft.Service.Models",
        isBuiltIn: false
      }

      return outType;
    }

    function getValidations(adlType: Type): ValidationAttribute[] {
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

      const outValidations: ValidationAttribute[] = getLocalValidators(adlType);
      switch (adlType.kind) {
        case "Array":
          getValidations(adlType.elementType).forEach(i => outValidations.push(i));
          break;
        case "Tuple":
          adlType.values.forEach(v => getValidations(v).forEach(val => outValidations.push(val)));
          break;
        case "Union":
          adlType.options.forEach(o => getValidations(o).forEach(val => outValidations.push(val)));
          break;
        case "Model":
          if (adlType.baseModels) {
            adlType.baseModels.forEach(o => getValidations(o).forEach(val => outValidations.push(val)));
          }
          if (adlType.templateNode) {
            const templateType = program.checker!.getTypeForNode(adlType.templateNode);
            getValidations(templateType).forEach(val => outValidations.push(val));
          }
          break;
        case "ModelProperty":
          getValidations(adlType.type).forEach(val => outValidations.push(val));
          break;
        default:
          // do nothing
          break;
      }

      return outValidations;
    }

    function getCSharpType(adlType: Type): TypeReference | undefined {
      switch (adlType.kind) {
        case "String":
          return { name: "string", nameSpace: "System", isBuiltIn: true };
        case "Boolean":
          return { name: "bool", nameSpace: "System", isBuiltIn: true };
        case "Union":
          let nameHint: string | undefined = undefined;
          if (adlType.node.parent && adlType.node.parent.kind === SyntaxKind.ModelStatement) {
            nameHint = adlType.node.parent.id.sv;
          }

          return createInlineEnum(adlType, nameHint ? transformCSharpIdentifier(nameHint) : undefined);
        case "Array":
          var arrType = getCSharpType(adlType.elementType);
          if (arrType) {
            return { name: arrType.name + "[]", nameSpace: arrType.nameSpace, isBuiltIn: arrType.isBuiltIn };
          }
          return undefined;
        case "Tuple":
          const params: TypeReference[] = [];
          adlType.values.forEach(val => {
            const ref = getCSharpType(val);
            if (ref) {
              params.push(ref);
            }
          });
          return {
            isBuiltIn: false,
            name: "Tuple",
            nameSpace: "System.Collections.Generic",
            typeParameters: params
          };
        case "Model":
          // Is the type templated with only one type?
          if (adlType.baseModels.length === 1 && !(adlType.properties)) {
            return getCSharpType(adlType.baseModels[0]);
          }

          switch (adlType.name) {
            case "byte":
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
              const valType = adlType.properties.get("v");
              return {
                name: "IDictionary",
                nameSpace: "System.Collections",
                isBuiltIn: true,
                typeParameters: [{ name: "string", nameSpace: "System", isBuiltIn: true }, getCSharpType(valType!.type)!]
              };
            default:
              var known = getKnownType(adlType);
              if (adlType.name === undefined || adlType.name === "") {
                return undefined;
              }
              if (known) {
                return known;
              }
              if (adlType.templateNode) {
                const tempType = program.checker!.getTypeForNode(adlType.templateNode);
                var cSharpType = getCSharpType(tempType);
              }
              return {
                name: adlType.name,
                nameSpace: modelNamespace,
                isBuiltIn: false,
              };
              break;
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
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "ArmResponse":
          console.log("***[ding][ding][ding] ");
          var namespace = model.namespace;
          if (namespace) {
            console.log("and the namespace for ARMResponse is: " + namespace.name);
          }
          else {
            console.log("NOOOO namespace for ArmResponse");
          }
          return {
            isBuiltIn: true,
            name: "ArmResponse",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "Operation":
          return {
            isBuiltIn: true,
            name: "Operation",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "OperationListResult":
          return {
            isBuiltIn: true,
            name: "OperationListResult",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "ArmResource":
          return {
            isBuiltIn: true,
            name: "Resource",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "TrackedResource":
          console.log("***[ding][ding][ding] ");
          var namespace = model.namespace;
          if (namespace) {
            console.log("and the namespace for TrackedRespource is: " + namespace.name);
          }
          else {
            console.log("NOOOO namespace for TrackedResource");
          } return {
            isBuiltIn: true,
            name: "TrackedResource",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "ProxyResource":
          return {
            isBuiltIn: true,
            name: "Resource",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "Resource":
          return {
            isBuiltIn: true,
            name: "Resource",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "SystemData":
          return {
            isBuiltIn: true,
            name: "SystemData",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "TrackedResourceBase":
          return {
            isBuiltIn: true,
            name: "TrackedResource",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "ExtensionResource":
          return {
            isBuiltIn: true,
            name: "ExtensionResource",
            nameSpace: "Microsoft.Adl.RPaaS"
          };
        case "Page": {
          const returnValue: TypeReference = {
            isBuiltIn: true,
            name: "Pageable",
            nameSpace: "Microsoft.Adl.RPaaS",
            typeParameters: []
          }
          let innerType = model.templateArguments ? getCSharpType(model.templateArguments![0]) : undefined;
          if (innerType) {
            returnValue.typeParameters!.push(innerType);
          }
          return returnValue;
        }
        case "Pageable": {
          const returnValue: TypeReference = {
            isBuiltIn: true,
            name: "Pageable",
            nameSpace: "Microsoft.Adl.RPaaS",
            typeParameters: []
          }
          let innerType = model.templateArguments ? getCSharpType(model.templateArguments![0]) : undefined;;
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
      var resourcePath = genPath + "/" + resource.name + "ControllerBase.cs";
      console.log("Writing resource controller for " + resource.name)
      await program.host.writeFile(path.resolve(resourcePath),
        await sqrl.renderFile(path.resolve(path.join(rootPath, "templates/resourceControllerBase.sq")), resource));
    }

    async function generateModel(model: any) {
      var modelPath = genPath + "/models/" + model.name + ".cs";
      await program.host.writeFile(path.resolve(modelPath), await sqrl.renderFile(path.resolve(path.join(rootPath, "templates/model.sq")), model));
    }

    async function generateEnum(model: any) {
      var modelPath = genPath + "/models/" + model.name + ".cs";
      var templateFile = path.resolve(path.join(rootPath, model.isClosed ? "templates/closedEnum.sq" : "templates/openEnum.sq"));
      await program.host.writeFile(path.resolve(modelPath), await sqrl.renderFile(templateFile, model));
    }

    async function generateSingleDirectory(basePath: string, outPath: string) {
      console.log("+++++++")
      console.log("Generating single file templates");
      console.log("  basePath: " + basePath);
      console.log("  outPath: " + outPath);


      const singleTemplatePath = path.join(basePath, "templates", "single");
      await (await fs.readdir(singleTemplatePath)).forEach(async file => {
        const templatePath = path.resolve(path.join(singleTemplatePath, file));
        await generateSingleFile(templatePath, outPath);
      });

      console.log("++++++");
      async function generateSingleFile(templatePath: string, outPath: string) {
        const templateFile = path.basename(templatePath);
        const baseName = templateFile.substring(0, templateFile.lastIndexOf("."));
        const outFile = path.join(outPath, baseName + ".cs");
        console.log("    -- " + templateFile + " => " + outFile);
        await program.host.writeFile(path.resolve(outFile), await sqrl.renderFile(templatePath, outputModel))
      }
    }

    async function createDirIfNotExists(targetPath: string) {
      if (!(await fs.stat(targetPath).catch(err => {
        return false;
      }))) {
        await fs.mkdir(targetPath);
      }
    }

    async function ensureCleanDirectory(targetPath: string) {
      if ((await fs.stat(targetPath).catch(err => {
        return false;
      }))) {
        await fs.rmdir(targetPath, { recursive: true });
      }

      await fs.mkdir(targetPath);
    }

    async function copyModelFiles(sourcePath: string, targetPath: string) {
      await createDirIfNotExists(targetPath);
      (await fs.readdir(sourcePath)).forEach(async file => {
        var sourceFile = path.resolve(sourcePath + path.sep + file);
        var targetFile = path.resolve(targetPath + path.sep + file);
        if ((await fs.lstat(sourceFile)).isDirectory()) {
          await createDirIfNotExists(targetFile);
          await copyModelFiles(sourceFile, targetFile);
        }
        else {
          await fs.copyFile(sourceFile, targetFile)
        }
      });
    }

    const service = outputModel.serviceName;

    sqrl.filters.define("decl", op => op.parameters.map((p: any) => p.type + " " + p.name).join(', '));
    sqrl.filters.define("call", op => op.parameters.map((p: any) => p.name).join(', '));
    sqrl.filters.define("typeParamList", op => op.typeParameters.map((p: TypeReference) => p.name).join(', '));
    sqrl.filters.define("callByValue", op => op.parameters.map((p: ValueParameter) => p.type === "string" ? '"' + p.value + '"' : p.value).join(', '));
    sqrl.filters.define("initialCaps", op => transformCSharpIdentifier(op));
    const operationsPath = path.resolve(path.join(genPath, "operations"));
    const routesPath = path.resolve(path.join(genPath, service + "ServiceRoutes.cs"));
    const templatePath = path.join(rootPath, "templates");
    const modelsPath = path.join(genPath, "models");
    await ensureCleanDirectory(genPath);
    await createDirIfNotExists(operationsPath);
    await copyModelFiles(path.join(rootPath, "clientlib"), modelsPath);
    await program.host.writeFile(routesPath, await sqrl.renderFile(path.join(templatePath, "serviceRoutingConstants.sq"), outputModel));
    await generateSingleDirectory(rootPath, operationsPath);
    outputModel.resources.forEach((resource: Resource) => generateResource(resource));
    outputModel.models.forEach(model => {
      console.log("Rendering model " + model.nameSpace + "." + model.name);
      generateModel(model);
    });

    outputModel.enumerations?.forEach(enumeration => {
      console.log("Rendering enum " + enumeration.name);
      generateEnum(enumeration);
    });
  }
}
