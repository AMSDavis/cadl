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
    validations: ValidationAttribute[]
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

  interface serviceModel {
    nameSpace: string,
    serviceName: string,
    resources: Resource[],
    models: Model[],
    enumerations: Enumeration[]
  };

  const outputModel: serviceModel = {
    nameSpace: serviceNamespace,
    serviceName: serviceName,
    resources: [],
    models: [],
    enumerations: []
  }

  let GenerationCounter: number = 1;


  return { generateServiceCode };

  function getServiceName(serviceNamespace: string): string {
    //console.log("^^^ Service Name: " + serviceNamespace);
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
              returnType: modelName
            };
          case PutName:
            return {
              name: "CreateOrUpdate",
              parameters: [...pathParams!, { name: "body", location: "body", description: "The resource data.", type: modelName }],
              returnType: modelName
            };
          case DeleteName:
            return {
              name: "Delete",
              parameters: pathParams,
              returnType: "void"
            };
          case PatchName:
            return {
              name: "Update",
              parameters: [...pathParams!, { name: "body", location: "body", description: "The resource patch data.", type: "ResourceUpdate" }],
              returnType: modelName
            };
          default:
            return {
              name: "List",
              parameters: pathParams,
              returnType: modelName
            };
            break;
        }
      }

      function GetAdditionalOperations() {
        const modelNameSpaces: NamespaceType[] = getResources().map(res => res as NamespaceType);
        const visitedNamespaces = new Map<string, NamespaceType>();
        const visitedOperations = new Map<string, OperationType>();
        const outOperations = new Map<string, Operation[]>();
        function visitModel(model: ModelType, namespaceKey: string) {
          const modelKey: string = model.name;
          if (!modelsToGenerate.has(modelKey) && !getKnownType(model)) {
            modelsToGenerate.set(modelKey, model);
            console.log("added model " + modelKey);
          }
        }

        function extractResponseType(model: Type): ModelType | undefined {

          var union = model as UnionType;
          if (union) {
            console.log("*** Operation return type is union? " + union !== undefined)
            let outModel: ModelType | undefined = undefined;
            union?.options.forEach(option => {
              console.log("Found union type option: " + option.kind);
              let optionModel = option as ModelType;
              console.log("Found union type option with name: " + optionModel?.name + " and arg count: " + optionModel?.templateArguments?.length);
              if (optionModel && optionModel.name === "ArmResponse" && optionModel.templateArguments) {
                let innerModel = optionModel.templateArguments[0] as ModelType;
                console.log("Found inner model: " + innerModel?.name);
                if (innerModel) {
                  outModel = innerModel;
                }
              }
            });

            return outModel;
          }
          var simpleModel = model as ModelType;
          if (simpleModel !== undefined) {
            if (simpleModel.assignmentType) {
              console.log("rerun for assignment type");
              return extractResponseType(simpleModel.assignmentType!);
            }
            console.log("returning simple model with name: " + simpleModel.name + ", " + simpleModel.kind);
            console.log("template node: " + simpleModel.templateNode?.kind + ", baseModels: " + simpleModel.baseModels.map(m => m.name) + ", args: " + simpleModel.templateArguments?.map(t => t.kind))

          }

          return simpleModel;
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

                  if (adlType.assignmentType) {
                    visitType(adlType.assignmentType);
                  }
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
            let httpOperation = getHttpOperation(operation);
            if (!visitedOperations.has(operationKey)) {
              visitedOperations.set(operationKey, operation);
              let returnType = extractResponseType(operation.returnType);
              if (returnType) {
                visitType(returnType);
              }
              let parameters: MethodParameter[] = [];

              if (operation.parameters) {
                operation.parameters.properties.forEach(prop => {
                  var propType = getCSharpType(prop.type, prop.name);
                  if (prop.name === "api-version" && propType?.name === "string") {
                    console.log("** STANDARD API-VERSION PARAMETER **")
                  }
                  else if (propType) {
                    visitType(prop.type);
                    let propLoc: string = isQueryParam(prop) ? "Query" : isPathParam(prop) ? "Path" : isBody(prop) ? "Body" : "????";
                    console.log("PARAM " + prop.name + " : " + propType?.nameSpace + "." + propType?.name + "( in " + propLoc + ")");
                    parameters.push({
                      name: prop.name,
                      type: propType.name,
                      location: propLoc
                    })
                  }
                })
              }
              if (isResource(operation)) {
                console.log("Operation is a resource: " + basePathForResource(operation))
              }

              var route = httpOperation?.route;
              console.log("Verb: " + route?.verb);
              if (route?.subPath) {
                console.log("using subpath: " + route?.subPath);
              }

              getPathParamName(operation)
              console.log("== END OPERATION " + operation.name + " ==");
              console.log();
              const outOperation = {
                name: transformCSharpIdentifier(operation.name),
                returnType: returnType?.name ?? "void",
                parameters: parameters,
              };
              localOperations.push(outOperation);

              let exists: boolean = false;
              if (resource) {

                exists = resource.operations?.some(op => op.name === outOperation.name) ?? false
                console.log("Looking for place for operation " + outOperation.name + " in resource " + resource.name + "found? " + exists)
              }

              if (resource && !exists) {
                resource!.operations!.push(outOperation);
              }
            }
          }
        }
        function visitNamespace(visited: NamespaceType, parent?: string) {
          let key: string = visited.name;
          console.log("visiting namespace " + key);
          if (isResource(visited)) {
            console.log("namespace is a resource: " + basePathForResource(visited))
          }

          let resource: Resource | undefined = undefined;
          if (armResourceLookup.has(key)) {
            resource = armResourceLookup.get(key)!;
          }

          if (!visitedNamespaces.has(key)) {
            visitedNamespaces.set(key, visited);
            let armSpace = getArmNamespace(visited);
            if (armSpace) {
              console.log("**** This is an arm namespace with name: " + armSpace + " ****");
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
              if (!map.has(value.name)) {
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
            specificationModelName: modelName,
            specificationListModelName: listName
          };
          console.log("******************* processed resource: " + outResource.name);
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
        console.log("Processing type: " + safeStringify(adlType.kind))
        if (model) {
          console.log("FOUND MODEL: " + model.name);
          const typeRef = getCSharpType(model);
          if (typeRef) {
            const outModel: Model = {
              name: typeRef?.name ?? model.name,
              nameSpace: typeRef?.nameSpace ?? modelNamespace,
              properties: [],
              description: getDoc(model),
              serviceName: serviceName,
              typeParameters: model.templateArguments ? model.templateArguments!.map(arg => getCSharpType(arg, model.name)!) : [],
              isDerivedType: false,
              isImplementer: false,
              isBuiltIn: typeRef?.isBuiltIn ?? false,
              validations: getValidations(adlType)
            };
            if (model.assignmentType || (model.baseModels && model.baseModels.length > 0) || (model.templateArguments && model.templateArguments.length > 0)) {
              outModel.isDerivedType = true;
              const baseType: TypeReference[] = [];
              const assignModel = model.assignmentType as ModelType;
              if (assignModel) {
                var assignRef = getCSharpType(assignModel, model.name);
                if (assignRef) {
                  baseType.push(assignRef);
                }
              }
              model.baseModels.forEach(model => {
                let hint = undefined;
                if (model.assignmentType) {
                  hint = model.name;
                  model = model.assignmentType as ModelType;
                }
                const converted = getCSharpType(model, hint);
                if (converted) {
                  baseType.push(converted)
                }
              });
              if (model.templateNode) {
                const templateBase = program.checker!.getTypeForNode(model.templateNode);
                if (templateBase) {
                  let modelType = templateBase as ModelType;
                  let hint = undefined;
                  if (modelType && modelType.assignmentType) {
                    hint = modelType.name;
                    modelType = modelType.assignmentType as ModelType;
                  }
                  const converted = getCSharpType(modelType, hint);
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
        console.log("Processing model " + r.kind + ", " + r.name)
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

    function safeStringify(circ: any): string {
      let cache: any[] = [];
      const outValue = JSON.stringify(circ, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          // Duplicate reference found, discard key
          if (cache.includes(value)) return;

          // Store value in our collection
          cache.push(value);
        }
        return value;
      });
      cache = [];
      return outValue;
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
    //const globalNamespace = program.checker!.getTypeForNode(program.globalNamespace);
    //processType(globalNamespace);
    //getResources()!.forEach(adlType => processNamespace(adlType));
    getArmResources().forEach(adlType => {
      console.log("ARM TYPE: kind:" + adlType.kind + ", name: " + (adlType as ModelType)?.name);
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
      console.log("--------------------");
      const cType = getCSharpType(adlType);
      console.log("ARM TYPE: csharp value: " + cType?.nameSpace + "." + cType?.name);

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
            console.log("^^^ excluding property " + property.name + ": " + parentModel.name + " <> " + parent?.name);
            return undefined;
          }
        }
      }
      const outPropertyType = getCSharpType(property.type, property.name)!;
      const outProperty: Property = {
        name: transformCSharpIdentifier(property.name),
        type: outPropertyType,
        validations: getValidations(property)
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

        let format = getFormat(localType);
        if (format) {
          output.push(getPatternAttribute(format));
        }

        let minLength = getMinLength(localType);
        let maxLength = getMaxLength(localType);
        if (minLength || maxLength) {
          console.log("Minlength: " + minLength + ", MaxLength: " + maxLength);
          output.push(getLengthAttribute(minLength, maxLength));
        }

        visited.set(localType, output);
        return output;
      }

      console.log("Calling getValidations on type with kind" + adlType.kind);
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
          if (adlType.assignmentType) {
            getValidations(adlType.assignmentType).forEach(i => outValidations.push(i));
          }
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

    function getCSharpType(adlType: Type, nameHint?: string): TypeReference | undefined {
      //console.log("Calling getCSharpType for type: " + adlType?.kind)
      switch (adlType.kind) {
        case "String":
          return { name: "string", nameSpace: "System", isBuiltIn: true };
        case "Boolean":
          return { name: "bool", nameSpace: "System", isBuiltIn: true };
        case "Union":
          return createInlineEnum(adlType, nameHint ? transformCSharpIdentifier(nameHint) : undefined);
        case "Array":
          var arrType = getCSharpType(adlType.elementType, nameHint);
          if (arrType) {
            return { name: arrType.name + "[]", nameSpace: arrType.nameSpace, isBuiltIn: arrType.isBuiltIn };
          }
          return undefined;
        case "Tuple":
          console.log("~~~~~~~~~ Found tuple type ~~~~~~~~~")
          const params: TypeReference[] = [];
          adlType.values.forEach(val => {
            const ref = getCSharpType(val, nameHint);
            if (ref) {
              console.log(ref);
              params.push(ref);
            }
          });
          console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
          return {
            isBuiltIn: false,
            name: "Tuple",
            nameSpace: "System.Collections.Generic",
            typeParameters: params
          };
        case "Model":
          if (isVerboseLogging()) {
            console.log("ADL TYPE NAME: " + adlType.name);
            console.log("ADL TYPE ATKIND: " + adlType.assignmentType?.kind);
            console.log("ADL TYPE BASEMODELELNGTH: " + adlType.baseModels?.length);
            console.log("ADL TYPE IPLENGTH: " + adlType.instantiationParameters?.length);
            console.log("ADL TYPE TALENGTH: " + adlType.templateArguments?.length);
            console.log("ADL TYPE PROPSIZE: " + adlType.properties?.size);
          }
          // Is the type templated with only one type?
          if (adlType.baseModels.length === 1 && !(adlType.properties)) {
            return getCSharpType(adlType.baseModels[0], nameHint);
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
                typeParameters: [{ name: "string", nameSpace: "System", isBuiltIn: true }, getCSharpType(valType!.type, nameHint)!]
              };
            default:
              var known = getKnownType(adlType);
              if (adlType.name === undefined || adlType.name === "") {
                console.log("====== FOUND BLANK ADL TYPE ======");
                console.log("name: " + adlType.name);
                console.log("assignment: " + adlType.assignmentType?.kind);
                console.log("node kind: " + adlType.node?.kind);
                console.log("node pos: " + adlType.node?.pos);
                console.log("node end: " + adlType.node?.end);
                console.log("==================================");
                return undefined;
              }
              if (adlType.name?.indexOf("ListResult") > 0) {
                console.log("====== FOUND List TYPE ======");
                console.log("name: " + adlType.name);
                console.log("assignment: " + adlType.assignmentType?.kind);
                console.log("base models: " + JSON.stringify(adlType.baseModels.map(type => type?.name)));
                console.log("template arguments: " + JSON.stringify(adlType.templateArguments?.map(type => "(" + type?.kind + ", " + (type as ModelType)?.name + ")")));
                console.log("assignmentType: " + adlType.assignmentType?.kind + ", " + (adlType.assignmentType as ModelType)?.name);
                console.log("==================================");
              }
              if (known) {
                return known;
              }
              if (adlType.assignmentType) {
                console.log("found assigned type for " + adlType.namespace + "." + adlType.name);
                var checkAssignment = getCSharpType(adlType.assignmentType, adlType.name);
                if (checkAssignment) {
                  return checkAssignment;
                }
              }
              console.log("Processing model " + adlType.name);
              if (adlType.templateNode) {
                console.log("Found templated type ");
                const tempType = program.checker!.getTypeForNode(adlType.templateNode);
                console.log("Template type kind: " + adlType.kind);
                var cSharpType = getCSharpType(tempType);
                console.log("cSharp template type: " + JSON.stringify(cSharpType));
              }
              if (adlType.templateArguments) { console.log("with type arguments: " + adlType.templateArguments.forEach(arg => (arg as ModelType)?.name + " ")); }
              if (adlType.baseModels) { console.log("and base type: " + adlType.baseModels.forEach(arg => (arg as ModelType)?.name + " ")); }
              return {
                name: adlType.name,
                nameSpace: modelNamespace,
                isBuiltIn: false,
                //typeParameters: adlType.templateArguments ? [...adlType.templateArguments!.map(arg => getCSharpType(arg)!)] : undefined
              };
              break;
          }
        case "Intrinsic":
          console.log("found intrinsic type: " + adlType.name);
          return undefined;
        case "TemplateParameter":
          console.log("found template parameter");
          return undefined;
        case "String":
          console.log("found string type: " + adlType.value);
          return undefined;
        // fallthrough
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
          return {
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
          console.log("Found known type 'Page'");
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
          console.log("Found known type 'Pageable'");
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
          //if (model.assignmentType) {
          //return getKnownType(model.assignmentType as ModelType);
          //}

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

    async function createDirIfNotExists(targetPath: string) {
      if (!(await fs.stat(targetPath).catch(err => {
        return false;
      }))) {
        await fs.mkdir(targetPath);
      }
    }

    async function copyModelFiles(sourcePath: string, targetPath: string) {
      console.log("Copying (" + sourcePath + ", " + targetPath + ")");
      await createDirIfNotExists(targetPath);
      (await fs.readdir(sourcePath)).forEach(async file => {
        var sourceFile = path.resolve(sourcePath + "/" + file);
        var targetFile = path.resolve(targetPath + "/" + file);
        if ((await fs.lstat(sourceFile)).isDirectory()) {

          console.log("Creating directory " + targetFile);
          await createDirIfNotExists(targetFile);

          await copyModelFiles(sourceFile, targetFile);
        }
        else {
          console.log("copying " + sourceFile + " to " + targetFile);
          await fs.copyFile(sourceFile, targetFile)
        }
      });
    }


    const service = outputModel.serviceName

    sqrl.filters.define("decl", op => op.parameters.map((p: any) => p.type + " " + p.name).join(', '));
    sqrl.filters.define("call", op => op.parameters.map((p: any) => p.name).join(', '));
    sqrl.filters.define("typeParamList", op => op.typeParameters.map((p: TypeReference) => p.name).join(', '));
    sqrl.filters.define("callByValue", op => op.parameters.map((p: ValueParameter) => p.type === "string" ? '"' + p.value + '"' : p.value).join(', '));

    await createDirIfNotExists(genPath);
    await copyModelFiles(path.join(rootPath, "clientlib"), path.join(genPath, "models"));
    var routesPath = path.resolve(path.join(genPath, service + "ServiceRoutes.cs"));
    var operationsPath = path.resolve(path.join(genPath, "OperationControllerBase.cs"));
    console.log("Writing service routes to: " + routesPath);
    let myOutputModel = JSON.parse((await fs.readFile(path.join(rootPath, "input", "fluidrelay.json"), 'utf-8')));
    await program.host.writeFile(routesPath, await sqrl.renderFile(path.join(rootPath, "templates", "serviceRoutingConstants.sq"), outputModel));
    console.log("Writing operations controller to: " + operationsPath);
    await program.host.writeFile(operationsPath, await sqrl.renderFile(path.join(rootPath, "templates", "operationControllerBase.sq"), outputModel));
    outputModel.resources.forEach((resource: Resource) => generateResource(resource));
    console.log("Writing models")
    var models = myOutputModel.models;
    for (var model in models) {
      console.log("Rendering model " + model);
      //console.log("using data " + safeStringify(models[model]));
      generateModel(models[model]);
    }

    var enums = myOutputModel.enumerations;
    for (var model in enums) {
      console.log("Rendering enum " + model);
      generateEnum(enums[model]);
    }

    console.log("Completed")
  }
}
function isVerboseLogging(): boolean {
  return false;
}

