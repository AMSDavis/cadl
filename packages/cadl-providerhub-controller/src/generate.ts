import {
  ArmLifecycleOperationKind,
  ArmOperationKind,
  ArmResourceOperation,
  getArmResource,
  getArmResources,
} from "@azure-tools/cadl-azure-resource-manager";
import {
  ArrayType,
  BooleanLiteralType,
  CompilerHost,
  EnumType,
  getBaseFileName,
  getDirectoryPath,
  getDoc,
  getFormat,
  getFriendlyName,
  getIntrinsicModelName,
  getKnownValues,
  getMaxLength,
  getMinLength,
  getPattern,
  getServiceNamespace,
  getServiceNamespaceString,
  getServiceVersion,
  isIntrinsic,
  joinPaths,
  ModelSpreadPropertyNode,
  ModelType,
  ModelTypeProperty,
  Node,
  NoTarget,
  NumericLiteralType,
  OperationType,
  Program,
  resolvePath,
  StringLiteralType,
  TupleType,
  Type,
  UnionType,
} from "@cadl-lang/compiler";
import { getSegment, http, HttpOperationParameter, OperationDetails } from "@cadl-lang/rest";
import Handlebars from "handlebars";
import { fileURLToPath } from "url";
import { reportDiagnostic } from "./lib.js";
const { isPathParam, isQueryParam } = http;

export async function $onEmit(program: Program) {
  const rootPath = resolvePath(getDirectoryPath(fileURLToPath(import.meta.url)), "..");
  const serviceCodePath =
    program.compilerOptions.miscOptions?.serviceCodePath || program.compilerOptions.outputPath;
  const options: ServiceGenerationOptions = {
    controllerOutputPath: serviceCodePath
      ? joinPaths(serviceCodePath, "generated")
      : joinPaths(resolvePath("."), "cadl-output", "generated"),
    controllerModulePath: rootPath,
    controllerHost: program.compilerOptions.miscOptions?.controllerHost || "providerhub",
    operationPollingLocation:
      program.compilerOptions.miscOptions?.operationPollingLocation || "tenant",
    registrationOutputPath: program.getOption("registrationOutputPath"),
  };

  const generator = CreateServiceCodeGenerator(program, options);
  await generator.generateServiceCode(program.host);
}

export interface ServiceGenerationOptions {
  controllerOutputPath: string;
  controllerModulePath: string;
  controllerHost: "liftr" | "providerhub";
  operationPollingLocation: "tenant" | "subscription";
  registrationOutputPath?: string;
}

export function CreateServiceCodeGenerator(program: Program, options: ServiceGenerationOptions) {
  const rootPath = options.controllerModulePath;
  const serviceRootNamespace = getServiceNamespace(program);
  const serviceNamespaceName = getServiceNamespaceString(program);
  if (!serviceNamespaceName) {
    return {
      generateServiceCode(): Promise<void> {
        return Promise.resolve();
      },
    };
  }
  const serviceName: string = getServiceName(serviceNamespaceName);
  const serviceNamespace = "Microsoft." + serviceName;
  const modelNamespace = serviceNamespace + ".Models";
  const PutName = "createOrUpdate",
    PatchName = "update",
    DeleteName = "delete",
    GetName = "read";

  const csharpTypeCache = new Map<Type, TypeReference>();
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
    resourceTypeName: string;
    operations?: Operation[];
    specificationArmNamespace: string;
    specificationModelName: string;
    specificationListModelName: string;
  }

  interface Operation extends TraceableEntity {
    name: string;
    kind: ArmOperationKind;
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

  function getServiceName(serviceNamespace: string): string {
    const dotPos = serviceNamespace.indexOf(".");
    return serviceNamespace.substring(dotPos + 1);
  }

  async function generateServiceCode(host: CompilerHost) {
    const genPath = options.controllerOutputPath;
    const registrationOutputPath = options.registrationOutputPath;

    // maps resource model name to arm Namespace
    const resourceNamespaceTable = new Map<string, string>();

    function transformPathParameter(
      parameter: HttpOperationParameter,
      cadlType: Type
    ): MethodParameter {
      return {
        name: parameter.name,
        type: "string",
        description: getDoc(program, parameter.param),
        sourceNode: cadlType.node,
      };
    }

    const modelsToGenerate = new Map<string, ModelType>();
    const resources = new Map<string, Resource>();

    function populateResources() {
      function getStandardOperation(
        operation: ArmResourceOperation,
        modelName: string,
        sourceType: ModelType
      ): Operation | undefined {
        const pathParams = operation.operationDetails.parameters.parameters
          .filter((p) => p.type === "path")
          .map((p) => transformPathParameter(p, sourceType));

        const operationName = transformCSharpIdentifier(operation.name);
        switch (operation.kind) {
          case GetName:
            return {
              name: operationName,
              kind: operation.kind,
              parameters: pathParams,
              returnType: modelName,
              verb: "GET",
              sourceNode: sourceType.node,
            };
          case PutName:
            return {
              name: operationName,
              kind: operation.kind,
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
              name: operationName,
              kind: operation.kind,
              parameters: pathParams,
              returnType: "void",
              verb: "Delete",
              sourceNode: sourceType.node,
            };
          case PatchName:
            return {
              name: operationName,
              kind: operation.kind,
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

      const visitedTypes = new Set<Type>();
      const visitedOperations = new Map<string, OperationType>();

      function visitOperation(
        operation: ArmResourceOperation,
        operationDetails: OperationDetails,
        resource?: Resource
      ) {
        const operationType = operation.operation;
        const operationKey: string = operationDetails.groupName + "." + operationType.name;
        let bodyProp: MethodParameter | undefined = undefined;
        if (!visitedOperations.has(operationKey)) {
          visitedOperations.set(operationKey, operationType);
          const returnType = extractResponseType(operationType);
          if (returnType) {
            visitType(returnType);
          }
          const parameters: MethodParameter[] = [];

          operationDetails.parameters.parameters.forEach((httpParam) => {
            const prop = httpParam.param;
            const propType = getCSharpType(prop.type);
            if (prop.name === "api-version" && propType?.name === "string") {
              // skip standard api-version parameter
            } else if (propType) {
              visitType(prop.type);
              const propLoc: string = isQueryParam(program, prop)
                ? "Query"
                : isPathParam(program, prop)
                ? "Path"
                : "????";
              const paramDescription = getDoc(program, prop);
              ensureCSharpIdentifier(prop, prop.name);
              parameters.push({
                name: prop.name,
                type: propType.name,
                description: paramDescription,
                location: propLoc,
                sourceNode: prop.node,
                default: prop.default && formatDefaultValue(prop.type, prop.default),
              });
            }
          });

          if (operationDetails.parameters.body) {
            const bodyParam = operationDetails.parameters.body;
            const bodyType = getCSharpType(bodyParam.type);
            const paramDescription = getDoc(program, bodyParam);
            visitType(bodyParam.type);
            ensureCSharpIdentifier(bodyParam, bodyParam.name);
            if (bodyType) {
              bodyProp = {
                name: bodyParam.name,
                type: bodyType.name,
                description: paramDescription,
                location: "Body",
                sourceNode: bodyParam.node,
              };

              parameters.push(bodyProp);
            }
          }

          ensureCSharpIdentifier(operationType, operationType.name);
          const outOperation: Operation = {
            name: transformCSharpIdentifier(operationType.name),
            kind: operation.kind,
            returnType: returnType?.name ?? "void",
            parameters: parameters,
            subPath: getSegment(program, operation.operation) ?? operationDetails.pathFragment,
            verb: operationDetails.verb,
            sourceNode: operationType.node,
          };
          if (bodyProp !== undefined) {
            outOperation.requestParameter = bodyProp;
          }
          // use the default path for actions
          if (outOperation.kind === "action" && !outOperation.subPath) {
            outOperation.subPath = outOperation.name;
          }

          let exists: boolean = false;
          if (resource) {
            exists = resource.operations?.some((op) => op.name === outOperation.name) ?? false;
          }

          if (resource && !exists) {
            resource!.operations!.push(outOperation);
          }
        }
      }

      function visitModel(model: ModelType) {
        const modelKey: string = getFriendlyName(program, model) || model.name;
        if (!modelsToGenerate.has(modelKey) && !getKnownType(model)) {
          modelsToGenerate.set(modelKey, model);
        }
      }

      function extractResponseType(operation: OperationType): ModelType | undefined {
        const model = operation.returnType;
        const union = model as UnionType;
        if (union) {
          let outModel: ModelType | undefined = undefined;
          union?.options.forEach((option) => {
            const optionModel = option as ModelType;
            if (
              optionModel &&
              optionModel.name === "ArmResponse" &&
              optionModel.templateArguments
            ) {
              const innerModel = optionModel.templateArguments[0] as ModelType;
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

              // A type with a friendly name should be treated as a unique type
              if (getFriendlyName(program, cadlType) || !getKnownType(cadlType)) {
                cadlType.properties.forEach((element) => {
                  visitType(element);
                });
                visitModel(cadlType);
              }
              break;
            default:
              // do nothing
              break;
          }
        }
      }

      for (const resourceDetails of getArmResources(program)) {
        if (!resources.has(resourceDetails.name)) {
          const modelName = resourceDetails.name;
          const listName = `${modelName}ListResult`;
          const matchingNamespace = resourceDetails.armNamespace;
          const cSharpModelName = transformCSharpIdentifier(modelName);
          resourceNamespaceTable.set(modelName, resourceDetails.armNamespace);

          const standardOps: ArmLifecycleOperationKind[] = [
            "read",
            "createOrUpdate",
            "update",
            "delete",
          ];

          const map = new Map<string, Operation>();
          standardOps.forEach((op) => {
            const armOperation = resourceDetails.operations.lifecycle[op];
            if (armOperation) {
              const value = getStandardOperation(
                armOperation,
                cSharpModelName,
                resourceDetails.cadlType
              )!;
              if (value && !map.has(value.name)) {
                map.set(value.name, value);
              }
            }
          });

          const outResource: Resource = {
            hasResourceGroupList:
              resourceDetails.operations.lists["ListByResourceGroup"] !== undefined,
            hasSubscriptionList:
              resourceDetails.operations.lists["ListBySubscription"] !== undefined,
            serviceName: serviceName,
            // TODO: This is currently a problem!  We don't have a canonical path
            itemPath: (resourceDetails.operations.lifecycle.read ||
              resourceDetails.operations.lifecycle.createOrUpdate)!.path,
            name: resourceDetails.name,
            resourceTypeName: resourceDetails.collectionName,
            nameSpace: serviceNamespace,
            nameParameter: resourceDetails.keyName ?? "name",
            serializedName: transformJsonIdentifier(resourceDetails.collectionName),
            operations: [...map.values()],
            specificationArmNamespace: matchingNamespace,
            specificationModelName: transformCSharpIdentifier(modelName),
            specificationListModelName: transformCSharpIdentifier(listName),
            sourceNode: resourceDetails.cadlType.node,
          };

          // Loop through the lifecycle operations again to visit their types
          // now that we have the outResource
          for (const lifecycleOp of Object.values(resourceDetails.operations.lifecycle)) {
            visitOperation(lifecycleOp, lifecycleOp.operationDetails, outResource);
          }

          // Visit all action operations
          for (const actionOpName in resourceDetails.operations.actions) {
            const actionOp = resourceDetails.operations.actions[actionOpName];
            visitOperation(actionOp, actionOp.operationDetails, outResource);
          }

          // NOTE: We explicitly skip visiting list operations because the
          // MetaRP will be providing the behavior for listing all resource
          // types.

          resources.set(modelName, outResource);
          outputModel.resources.push(outResource);
        }
      }
    }

    function populateModels() {
      const models = new Map<string, Model>();
      function populateModel(cadlType: Type) {
        const model = cadlType as ModelType;
        if (model && model.name && model.name.length > 0) {
          const friendlyName = getFriendlyName(program, model);
          const typeRef = getCSharpType(model);
          reportInfo(`*** ${model.name} => ${typeRef?.name}`, model.node);
          if (typeRef) {
            const outModel: Model = {
              name: friendlyName ?? typeRef?.name ?? model.name,
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

            // The model type may need to derive from another type if:
            // - It explicitly has a base model type
            // - It is an instantiation of a templated type without a friendly name
            //   (the friendly name is used to rename the type without derivation)
            if (
              model.baseModel ||
              (!friendlyName && model.templateArguments && model.templateArguments.length > 0)
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
                  const modelType = templateBase as ModelType;
                  const converted = getCSharpType(modelType);
                  if (converted) {
                    baseType.push(converted);
                  }
                }
              }
              outModel.baseClass = baseType.length > 0 ? baseType[0] : undefined;
            }
            if (model.properties && model.properties.size > 0) {
              // Filter out unwanted properties from the resource model type:
              // - name: Use the name property defined in the base ArmResource type instead
              // - systemData
              [...model.properties.values()]
                ?.filter(
                  (prop) =>
                    prop.name !== "systemData" &&
                    !(prop.name === "name" && getArmResource(program, model))
                )
                ?.forEach((val) => {
                  const decl = getPropertyDecl(val, model, {
                    includeSpreadProperties: friendlyName !== undefined,
                  });
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

    getArmResources(program).forEach((resource) => {
      function reportResourceInfo(message: string) {
        reportInfo(message, resource.cadlType.node);
      }
      const resourceMeta = getArmResource(program, resource.cadlType)!;
      reportResourceInfo("ARM RESOURCE DETAILS");
      reportResourceInfo("--------------------");
      reportResourceInfo("armNamespace: " + resourceMeta.armNamespace);
      reportResourceInfo("resourceModelName: " + resourceMeta.name);
      reportResourceInfo("resourceKind: " + resourceMeta.kind);
      reportResourceInfo("collectionName: " + resourceMeta.collectionName);
      reportResourceInfo("operations: " + resourceMeta.operations);
      reportResourceInfo("resourceNameParam: " + resourceMeta.keyName);
      // reportResourceInfo("parentResourceType: " + resourceMeta.parentResourceType?.kind);
      const cType = getCSharpType(resource.cadlType);
      reportResourceInfo(`-- ${resourceMeta.name} => ${cType?.nameSpace}.${cType?.name}`);
      reportResourceInfo("--------------------");
    });
    populateResources();
    reportVerboseInfo(JSON.stringify(outputModel.resources, replacer));
    populateModels();

    function getPropertyDecl(
      property: ModelTypeProperty,
      parent?: ModelType,
      options?: { includeSpreadProperties?: boolean }
    ): Property | undefined {
      const spreadNode = property.node as ModelSpreadPropertyNode;
      if (
        !options?.includeSpreadProperties &&
        spreadNode &&
        property.sourceProperty === undefined
      ) {
        const parentNode = spreadNode.parent;
        if (parentNode) {
          const parentType = program.checker!.getTypeForNode(parentNode);
          const parentModel = parentType as ModelType;
          // remove special case when we refactor library type changes to models
          if (parentModel !== parent && property.name !== "properties") {
            return undefined;
          }
        }
      }
      const outPropertyType = getCSharpType(property.type)!;
      ensureCSharpIdentifier(property, property.name);
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

    function getFormatAttribute(parameter: string): ValidationAttribute {
      return {
        name: "Format",
        parameters: [
          {
            value: parameter,
            type: "string",
          },
        ],
      };
    }

    function isValidCSharpIdentifier(identifier: string): boolean {
      return identifier.match(/^[A-Za-z_][\w-]+$/) !== null;
    }

    function ensureCSharpIdentifier(target: Type, name: string): void {
      let location = "";
      switch (target.kind) {
        case "Enum":
          location = `enum ${target.name}`;
          break;
        case "EnumMember":
          location = `enum ${target.enum.name}`;
          break;
        case "Interface":
          location = `interface ${target.name}`;
          break;
        case "Model":
          location = `model ${target.name}`;
          break;
        case "ModelProperty": {
          const model = program.checker?.getTypeForNode(target.node.parent!) as ModelType;
          if (!model) {
            reportDiagnostic(program, {
              code: "missing-type-parent",
              format: { type: "ModelProperty", name: target.name },
              target: target,
            });
          }
          location = `property '${target.name}' in model ${model?.name}`;
          if (model?.node?.parent && !model.name) {
            const operationModel = program.checker?.getTypeForNode(
              model!.node.parent
            ) as OperationType;
            if (operationModel) {
              const parent = operationModel.interface
                ? `interface ${operationModel.interface.name}`
                : `namespace ${operationModel.namespace?.name}`;
              location = `parameter '${target.name}' in operation ${operationModel?.name} in ${parent}`;
            }
          }
          break;
        }
        case "Namespace":
          location = `namespace ${target.name}`;
          break;
        case "Operation": {
          const parent = target.interface
            ? `interface ${target.interface.name}`
            : `namespace ${target.namespace?.name}`;
          location = `operation ${target.name} in ${parent}`;
          break;
        }
        case "Union":
          location = `union ${target.name}`;
          break;
        case "UnionVariant": {
          if (target.node !== undefined) {
            const parent = program.checker?.getTypeForNode(target.node.parent!) as UnionType;
            location = `variant ${String(target.name)} in union ${parent?.name}`;
          }
          break;
        }
      }

      if (!isValidCSharpIdentifier(name)) {
        reportDiagnostic(program, {
          code: "invalid-identifier",
          format: { identifier: name, location: location },
          target: target.node ?? NoTarget,
        });
      }
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

    function createInlineEnum(cadlType: EnumType, name?: string): TypeReference {
      name ??= cadlType.name;
      ensureCSharpIdentifier(cadlType, name);
      const outEnum: Enumeration = {
        isClosed: false,
        name: transformCSharpIdentifier(name),
        serviceName: serviceName,
        values: [],
        sourceNode: cadlType.node,
      };
      cadlType.members.forEach((option) => {
        ensureCSharpIdentifier(option, option.name);
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

        const format = getFormat(program, localType);
        if (format) {
          output.push(getFormatAttribute(format));
        }

        const pattern = getPattern(program, localType);
        if (pattern) {
          output.push(getPatternAttribute(pattern));
        }

        const minLength = getMinLength(program, localType);
        const maxLength = getMaxLength(program, localType);
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
      const cached = csharpTypeCache.get(cadlType);
      if (cached) {
        return cached;
      }

      const type = getCSharpTypeInternal(cadlType);
      if (type) {
        csharpTypeCache.set(cadlType, type);
      }
      return type;
    }
    function getCSharpTypeInternal(cadlType: Type): TypeReference | undefined {
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
          const friendlyName = getFriendlyName(program, cadlType);

          // Is the type templated with only one type?
          if (
            !friendlyName &&
            cadlType.baseModel &&
            (!cadlType.properties || cadlType.properties.size === 0)
          ) {
            const outRef = getCSharpType(cadlType.baseModel);
            if (isSealedBaseModel(outRef)) {
              return outRef;
            }
          }

          const cadlIntrinsicType = getCSharpTypeForCadlIntrinsicModels(cadlType);

          if (cadlIntrinsicType !== undefined) {
            // Check if there is known value and then return an enum instead.
            const values = getKnownValues(program, cadlType);
            if (values) {
              return createInlineEnum(values, cadlType.name);
            }
            return cadlIntrinsicType;
          }
          const known = getKnownType(cadlType);
          if (cadlType.name === undefined || cadlType.name === "") {
            return undefined;
          }
          if (known) {
            return known;
          }
          const modelName = friendlyName ?? cadlType.name;
          ensureCSharpIdentifier(cadlType, modelName);
          return {
            name: transformCSharpIdentifier(modelName),
            nameSpace: modelNamespace,
            isBuiltIn: false,
          };
        case "Intrinsic":
          return undefined;
        case "TemplateParameter":
          return undefined;
        default:
          return undefined;
      }
    }

    function getCSharpTypeForCadlIntrinsicModels(cadlType: ModelType) {
      if (!isIntrinsic(program, cadlType)) {
        return undefined;
      }
      const name = getIntrinsicModelName(program, cadlType);
      switch (name) {
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
          return undefined;
      }
    }

    function getKnownType(model: ModelType): TypeReference | undefined {
      switch (model.name) {
        case "ErrorResponse":
          return {
            isBuiltIn: true,
            name: "Resource",
            nameSpace: "Microsoft.Cadl.ProviderHub",
          };
        case "ArmResponse":
          return {
            isBuiltIn: true,
            name: "ArmResponse",
            nameSpace: "Microsoft.Cadl.ProviderHub",
          };
        case "ArmDeleteAcceptedResponse":
        case "ArmDeletedNoContentResponse":
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
            nameSpace: "Microsoft.Cadl.ProviderHub",
          };
        case "OperationListResult":
          return {
            isBuiltIn: true,
            name: "OperationListResult",
            nameSpace: "Microsoft.Cadl.ProviderHub",
          };
        case "ArmResource":
          return {
            isBuiltIn: true,
            name: "Resource",
            nameSpace: "Microsoft.Cadl.ProviderHub",
          };
        case "TrackedResourceBase":
        case "TrackedResource": {
          const baseResource: TypeReference = {
            isBuiltIn: true,
            name: "TrackedResource",
            nameSpace: "Microsoft.Cadl.ProviderHub",
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
            nameSpace: "Microsoft.Cadl.ProviderHub",
          };
        case "SystemData":
          return {
            isBuiltIn: true,
            name: "SystemData",
            nameSpace: "Microsoft.Cadl.ProviderHub",
          };
        case "ExtensionResourceBase":
        case "ExtensionResource":
          return {
            isBuiltIn: true,
            name: "ProxyResource",
            nameSpace: "Microsoft.Cadl.ProviderHub",
          };
        case "Pageable":
        case "Page": {
          const returnValue: TypeReference = {
            isBuiltIn: true,
            name: "Pageable",
            nameSpace: "Microsoft.Cadl.ProviderHub",
            typeParameters: [],
          };
          const innerType = model.templateArguments
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
        await compileHandlebarsTemplate(
          resolvePath(joinPaths(templatePath, "resourceControllerBase.sq")),
          resource
        )
      );
      await program.host.writeFile(
        resolvePath(resourceControllerPath),
        await compileHandlebarsTemplate(
          resolvePath(joinPaths(templatePath, "resourceController.sq")),
          resource
        )
      );
      if (registrationOutputPath) {
        await generateRegistration(resource);
      }
    }

    async function generateResourceProviderReg(serviceModel: ServiceModel) {
      const outputPath = registrationOutputPath + `/${serviceModel.nameSpace}.json`;
      const regTemplate = resolvePath(joinPaths(templatePath, "resourceProviderRegistration.sq"));
      await program.host.writeFile(
        outputPath,
        await compileHandlebarsTemplate(regTemplate, { serviceName: serviceModel.serviceName })
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
          delete: [
            "ResourceDeletionValidate",
            "ResourceDeletionBegin",
            "ResourceDeletionCompleted",
          ],
          get: ["ResourceReadValidate"],
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
        await compileHandlebarsTemplate(
          resolvePath(joinPaths(templatePath, "resourceRegistration.sq")),
          {
            apiVersion: getServiceVersion(program),
            extensions: Array.from(extensions.values()),
          }
        )
      );
    }

    async function generateModel(model: any) {
      const modelPath = joinPaths(genPath, "models", model.name + ".cs");
      const modelTemplate = resolvePath(joinPaths(templatePath, "model.sq"));
      await program.host.writeFile(
        resolvePath(modelPath),
        await compileHandlebarsTemplate(modelTemplate, model)
      );
    }

    async function generateEnum(model: any) {
      const modelPath = genPath + "/models/" + model.name + ".cs";
      const templateFile = resolvePath(
        joinPaths(templatePath, model.isClosed ? "closedEnum.sq" : "openEnum.sq")
      );
      await program.host.writeFile(
        resolvePath(modelPath),
        await compileHandlebarsTemplate(templateFile, model)
      );
    }

    async function generateSingleDirectory(basePath: string, outPath: string) {
      reportProgress("+++++++");
      reportProgress("Generating single file templates");
      reportProgress("  basePath: " + basePath);
      reportProgress("  outPath: " + outPath);

      const singleTemplatePath = joinPaths(templatePath, "single");

      const files = await host.readDir(singleTemplatePath);
      for (const file of files) {
        const templatePath = resolvePath(joinPaths(singleTemplatePath, file));
        await generateSingleFile(templatePath, outPath).catch((err) =>
          reportDiagnostic(program, {
            code: "creating-file",
            format: { filename: file, error: err },
            target: NoTarget,
          })
        );
      }

      reportProgress("++++++");
      async function generateSingleFile(templatePath: string, outPath: string) {
        const templateFile = getBaseFileName(templatePath);
        const baseName = templateFile.substring(0, templateFile.lastIndexOf("."));
        const outFile = joinPaths(outPath, baseName + ".cs");
        reportProgress(`    -- ${templateFile} => ${outFile}`);
        const content = await compileHandlebarsTemplate(templatePath, outputModel);
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
        await program.host.mkdirp(targetPath);
      }
    }

    async function ensureCleanDirectory(targetPath: string) {
      try {
        await program.host.stat(targetPath);
        await host.removeDir(targetPath, { recursive: true });
      } catch {}

      await host.mkdirp(targetPath);
    }

    const service = outputModel.serviceName;
    const templates = new Map<string, any>();
    Handlebars.registerPartial(
      "renderComment",
      '{{#each (split description "\n") as |line|}}/// {{trim line}}\n{{/each}}'
    );
    const compileHandlebarsTemplate = async (fileName: string, data: any) => {
      let templateDelegate = templates.get(fileName);
      if (!templateDelegate) {
        const generationViewTemplate = (await program.host.readFile(fileName)).text;
        templateDelegate = Handlebars.compile<any>(generationViewTemplate, {
          noEscape: true,
        });
        templates.set(fileName, templateDelegate);
      }
      return templateDelegate(data, { helpers: commonHelper });
    };
    const commonHelper = {
      decl: (op: any) =>
        op.parameters
          .map((p: any) => p.type + " " + p.name + (p.default ? ` = ${p.default}` : ""))
          .join(", "),
      call: (op: any) => op.parameters.map((p: any) => p.name).join(", "),
      bodyParameter: (op: any) => op.parameters[op.parameters.length - 1].name,
      typeParamList: (op: any) => op.typeParameters.map((p: TypeReference) => p.name).join(", "),
      callByValue: (op: any) =>
        op.parameters
          .map((p: ValueParameter) => (p.type === "string" ? `@"${p.value}"` : p.value))
          .join(", "),
      initialCaps: (str: string) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "",
      isDefined: (value: any) => value !== undefined,
      eq: (a: string | number, b: string | number) => a === b,
      eqi: (a: string, b: string) => a.toLowerCase() === b.toLowerCase(),
      ne: (a: string | number, b: string | number) => a !== b,
      or: (a: boolean, b: boolean) => a || b,
      notCustomOp: (op: any) => op.kind !== "action",
      getOperationAction: (operation: Operation) => {
        const subPath = operation.subPath || "";
        const actionName = subPath.length ? subPath[0].toUpperCase() + subPath.substring(1) : "";
        const mapping = {
          get: "Read",
          put: "Create",
          delete: "Delete",
          patch: "Patch",
          post: actionName,
        } as any;
        return operation.kind === "action" ? actionName : mapping[operation.verb.toLowerCase()];
      },
      join: (arr: string[], separator: string) => arr.join(separator),
      split: (str: string, separator: string) => (str ? str.split(separator) : ""),
      trim: (str: string) => (str ? str.trim() : ""),
    };
    const operationsPath = genPath;
    const routesPath = resolvePath(joinPaths(genPath, service + "ServiceRoutes.cs"));
    const templatePath = resolvePath(
      joinPaths(rootPath, "..", "templates", options.controllerHost)
    );
    const modelsPath = joinPaths(genPath, "models");
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
        await compileHandlebarsTemplate(
          joinPaths(templatePath, "serviceRoutingConstants.sq"),
          outputModel
        )
      );
      await generateSingleDirectory(rootPath, operationsPath).catch((err) =>
        reportDiagnostic(program, {
          code: "creating-dir",
          format: { error: err },
          target: NoTarget,
        })
      );
      if (registrationOutputPath) {
        if (resolvePath(registrationOutputPath) !== resolvePath(genPath)) {
          await ensureCleanDirectory(registrationOutputPath).catch((err) =>
            reportDiagnostic(program, {
              code: "cleaning-dir",
              format: { error: err },
              target: NoTarget,
            })
          );
          await createDirIfNotExists(
            joinPaths(registrationOutputPath, outputModel.nameSpace)
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
      for (const resource of outputModel.resources) {
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
        );
      }
      for (const model of outputModel.models) {
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
      }

      for (const enumeration of outputModel.enumerations ?? []) {
        reportInfo(`Rendering enum ${enumeration.name}`, enumeration.sourceNode);
        await generateEnum(enumeration);
      }
    }
  }
}
