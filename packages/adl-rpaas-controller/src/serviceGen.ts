import {
  getDoc,
  getFormat,
  getMaxLength,
  getMinLength,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Program,
  StringLiteralType,
  Type,
  UnionType
} from "@azure-tools/adl";
import {
  getResources,
  getServiceNamespaceString,
  _checkIfServiceNamespace
} from "@azure-tools/adl-rest";

import {ArmResourceInfo, getArmNamespace, getArmResources, getArmResourceInfo, ParameterInfo} from "@azure-tools/adl-rpaas";

import {
  fileURLToPath
} from "url"
import * as path from "path";
import * as sqrl from "squirrelly"
import * as fs from "fs/promises"
import { Console } from "console";
import { stringify } from "querystring";


export async function onBuild(program: Program) {
  // hack
  const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  console.log("rootpath: " + rootPath);
  const options : ServiceGenerationOptions = {
    controllerOutputPath : program.compilerOptions.serviceCodePath || path.join(path.resolve("."), "output"),
    controllerModulePath: rootPath
  };

  //console.log("building using the new thing.")
  
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
  const ListName = "list", PutName = "create", PatchName = "update", DeleteName = "delete", GetName ="read";
  
  interface Resource {
    name: string,
    nameSpace: string,
    serviceName: string,
    serializedName: string,
    nameParameter: string,
    hasSubscriptionList: boolean,
    hasResourceGroupList: boolean,
    itemPath: string,
    operations?: any
  }

  interface Operation {
    returnType: string,
    parameters?: MethodParameter[],
  }

  interface MethodParameter {
    name: string,
    type: string,
    location?: string,
    description?: string
  }

  interface Model  extends TypeDeclaration{
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
    implements?: TypeReference[]
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
    models: any,
    enumerations: any
  };

  const outputModel: serviceModel = {
    nameSpace: serviceNamespace,
    serviceName: serviceName,
    resources: [],
    models: {},
    enumerations: {}
  }

  let GenerationCounter: number = 1;
  

  return {generateServiceCode};
  
  function getServiceName( serviceNamespace: string) : string {
    //console.log("^^^ Service Name: " + serviceNamespace);
    const dotPos = serviceNamespace.indexOf('.');
    return serviceNamespace.substring(dotPos+1);
  }
  async function generateServiceCode() {

    const genPath = options.controllerOutputPath;
    // maps resource model name to arm Namespace
    const resourceNamespaceTable = new Map<string, string>();

    function transformPathParameter(parameter : ParameterInfo) : MethodParameter {
      return {
        name: parameter.name,
        type: "string",
        description: "",
        location: "path"
      };
    }


    function populateResources() {
      const armResources = getArmResources();
      const resourceModels= new Map<string, string>();
      function getOperation( opName: string, resourceInfo: ArmResourceInfo, modelName: string) : [string, Operation] | undefined {
        //console.log("GETTINGOPERATION: " + opName);
        const pathParams = resourceInfo.resourcePath?.parameters.map( p => transformPathParameter(p));
        pathParams!.push(transformPathParameter(resourceInfo.resourceNameParam!))
            switch(opName) {
              case GetName:
                //console.log("FOUND GET");
                return ["Get", {
                 parameters: pathParams,
                 returnType: modelName
                }];
              case PutName:
                //console.log("FOUND PUT");
                return ["CreateOrUpdate", {
                 parameters: [...pathParams!, {name: "body", location: "body", description: "The resource data.",type: modelName}],
                 returnType: modelName
                }];
              case DeleteName:
                //console.log("FOUND DELETE");
                return ["Delete", {
                 parameters: pathParams,
                 returnType: "void"
                }];
              case PatchName:
                //console.log("FOUND UPDATE");
                return ["Update", {
                 parameters: [...pathParams!, {name: "body", location: "body", description: "The resource patch data.", type: "ResourceUpdate"}],
                 returnType: modelName
                }];
              default:
                //console.log("WHOOPS");
                return ["List", {
                 parameters: pathParams,
                 returnType: modelName
                }];
                break;
            }
      }

      outputModel.resources = armResources.filter( res => {
         let resourceInfo = getArmResourceInfo(res);
         const returnValue =  !resourceModels.has(resourceInfo.resourceModelName);
         resourceModels.set(resourceInfo.resourceModelName, resourceInfo.resourceModelName);
         return returnValue;
      }).map(adlResource => {
        let resourceInfo = getArmResourceInfo(adlResource);
          const cSharpModelName = transformCSharpIdentifier(resourceInfo.resourceModelName);
          //console.log("OPERATIONS: "+ resourceInfo.standardOperations);
          const cSharpListModelName = transformCSharpIdentifier(resourceInfo.resourceListModelName);
          resourceNamespaceTable.set(resourceInfo.resourceModelName, resourceInfo.armNamespace);
          var map: any = {} ;
          resourceInfo.standardOperations
            .filter(o => o == PutName || o == PatchName || o == DeleteName)
            .forEach(op =>  {
              let [name, value] = (getOperation(op, resourceInfo, cSharpModelName)!);
              //console.log("Calling map.set("+ name + ", " + value + ")");
              map[name] = value;
            });
          return {
            hasResourceGroupList: resourceInfo.standardOperations.includes(ListName),
            hasSubscriptionList: resourceInfo.standardOperations.includes(ListName),
            serviceName: serviceName,
            itemPath: resourceInfo.resourcePath!.path + "/{" + resourceInfo.resourceNameParam!.name + "}",
            name: resourceInfo.resourceModelName,
            nameSpace: serviceNamespace,
            nameParameter: resourceInfo.resourceNameParam?.name ?? "name",
            serializedName: transformJsonIdentifier(resourceInfo.collectionName),
            operations: map
          };
      });
    }
    

    function populateModels() {
      const armResources = getArmResources();
      const models = new Map<string, Model>();
      function populateModel( adlType: Type) {
        let model = adlType as ModelType;
        console.log("Processing type: " + safeStringify(adlType.kind))
        if (model) {
          console .log("FOUND MODEL: " + model.name);
          const typeRef = getCSharpType(model);
          //const info = getArmResourceInfo(model);
          const outModel : Model = {
            name: typeRef?.name ?? model.name,
            nameSpace: typeRef?.nameSpace ?? modelNamespace,
            properties: [],
            description: getDoc(model),
            serviceName: serviceName,
            typeParameters: model.templateArguments? model.templateArguments!.map(arg => getCSharpType(arg)!) : [],
            isDerivedType: false,
            isImplementer: false,
            isBuiltIn: typeRef?.isBuiltIn ?? false
          };
          if (model.baseModels && model.baseModels.length > 0) {
            outModel.isDerivedType = true;
            let baseType: TypeReference[] = [];
            model.baseModels.forEach(model => {
              const converted = getCSharpType(model);
              if (converted) {
                baseType.push(converted)
              }
            })
            outModel.baseClass = baseType.length > 0 ? baseType[0] : undefined;
          }
          if (model.properties && model.properties.size > 0)
          {
            [...model.properties.values()]?.forEach(val => {
              populateModel(val.type);
              outModel.properties.push(getPropertyDecl(val));
            });
          }
          if (!outModel.isBuiltIn) {
            models.set(outModel.name, outModel);
          }
          if (model.baseModels && model.baseModels.length > 0) {
            model.baseModels?.forEach(base => {
              populateModel(base)
            });
          }
          if (model.templateArguments && model.templateArguments.length > 0) {
            outModel.isDerivedType = true;
            model.templateArguments?.forEach(temp => populateModel(temp));
          }
        }
      }

      armResources.forEach( r => {
        let rModel = r as ModelType;
        console.log("Processign model " + r.kind + ", " + rModel?.name )
        if (!models.has(rModel.name))
        {
          populateModel(r);
        }
      });

      models.forEach(model => {outputModel.models[model.name] = model;})
      console.log("MODELS");
      console.log("------");
      console.log(JSON.stringify(models, replacer));

      console.log("ENUMS");
      console.log("-----");
      console.log(JSON.stringify(outputModel.enumerations, replacer));
    }

    
    function processNamespace(adlType: Type) {
      //console.log("processing type: " + adlType.kind);
      if (adlType.kind == "Namespace")
      {
        //console.log("found namespace");
        //console.log("armNamespace: " + getArmNamespace(adlType as NamespaceType))
        let current: NamespaceType | undefined = adlType as NamespaceType;
        while(current) {
          //console.log("namespace is " + current.name);
          current.models.forEach(model => getCSharpType(model));
          current.operations.forEach(op => processOperation(op))
          current = current.namespace;
        }
      }
    }

    function processOperation(op: OperationType) {
      //console.log ("processing operation: " + op.name);
        if (op.parameters) {
          let model = op.parameters!;
          //console.log("parameters found with structure: " + model.))
          //console.log("found parameters of kind: (" +model.kind + ", " + model.assignmentType + ", " + model.baseModels + ", " + model.templateArguments + ", " + model.properties + ")")  
          getCSharpType(model);
        }

        if (op.returnType) {
          //console.log("found return type of kind: " + op.returnType!.kind)
          let union : UnionType = op.returnType as any as UnionType
           if (union) {
            //union!.instantiationParameters?.forEach(p => getCSharpType(p))
            union.options.forEach( o =>  {
              getCSharpType(o);
              //console.log("Found union option " + o.kind)
              if (o.kind === "Model")
              {
                 let oModel = o as ModelType;
                 oModel.templateArguments?.forEach( t => getCSharpType(t));
                 oModel.baseModels?.forEach(b => getCSharpType(b));
              }
            });
          }
          else {
            getCSharpType(op.returnType);
          }
        }
    }
    
    function safeStringify( circ : any) : string {
      let cache : any[] = [];
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
      if(value instanceof Map) {
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
    async function convertModel(model: ModelType) : Promise<Model> {
        const modelType = getCSharpTypeDecl(model);
        const outModel: Model = {
          serviceName: serviceName,
          nameSpace: modelType.nameSpace,
          isDerivedType: modelType.isDerivedType,
          isImplementer: modelType.isImplementer,
          baseClass: modelType.baseClass,
          implements: modelType.implements,
          name: modelType.name,
          typeParameters: modelType.typeParameters,
          properties: [...model.properties.values()].map(prop => getPropertyDecl(prop)),
          description: getDoc(model),
          isBuiltIn: modelType.isBuiltIn
        }

        return outModel;
    }

    function getPropertyDecl(property: ModelTypeProperty) : Property
    {
        const outPropertyType = getCSharpType(property.type)!;
        const outProperty : Property = {
          name: transformCSharpIdentifier(property.name),
          type: outPropertyType,
          validations: getPropertyValidators(property)
        }

        return outProperty;
    }

    function transformCSharpIdentifier(identifier: string) : string {
       return identifier[0].toLocaleUpperCase() + identifier.substring(1);
    }

    function transformJsonIdentifier(identifier: string) : string {
       return identifier[0].toLocaleLowerCase() + identifier.substring(1);
    }

    function getPatternAttribute(parameter: string) : ValidationAttribute {
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

    function getLengthAttribute(minLength?: number, maxLength?: number) : ValidationAttribute {
      var output: ValidationAttribute = {
        name: "Length",
        parameters: []
      };

      if (minLength) {
        output.parameters?.concat({type: "int", value: minLength});
      }

      if (maxLength) {
        output.parameters?.concat({type: "int", value: maxLength});
      }

      return output;
    }

    function getPropertyValidators(property: ModelTypeProperty) : ValidationAttribute[]{
        
        const output : ValidationAttribute[] = [];
        let format = getFormat(property.type)
        if (format) {
          output.concat(getPatternAttribute(format));
        }

        let minLength = getMinLength(property.type);
        let maxLength = getMaxLength(property.type);
        if (minLength || maxLength) {
          output.concat(getLengthAttribute(minLength, maxLength));
        }

        return output;
    }
    
    function getCSharpTypeDecl(adlType: Type) : TypeDeclaration {
        let typeRef = getCSharpType(adlType)!;
        let typeDecl: TypeDeclaration = {
          isDerivedType: false, // fix this
          isImplementer: false,
          name: typeRef.name,
          nameSpace: typeRef.nameSpace,
          typeParameters: typeRef.typeParameters,
          isBuiltIn: typeRef?.isBuiltIn ?? false
        };

        return typeDecl;
    }

    function getInlineEnumName( adlType: Type): string {
        return "ServiceChoice" + (GenerationCounter++);
    }

    function createInlineEnum(adlType: UnionType) : TypeReference {
        const outEnum: Enumeration = {
            isClosed: false,
            name: "Enumeration" + GenerationCounter++,
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
        })
        outputModel.enumerations[outEnum.name] = outEnum;
        const outType: TypeReference = {
           name: outEnum.name,
           nameSpace: "Microsoft.Service.Models",
           isBuiltIn: false
        }

        return outType;
    }
    
    function getCSharpType(adlType: Type) : TypeReference | undefined {
        //console.log("Calling getCSharpType for type: " + adlType?.kind)
        switch (adlType.kind) {
          case "String":
            return {name: "string", nameSpace: "System", isBuiltIn: true};
          case "Boolean":
            return { name: "bool", nameSpace: "System", isBuiltIn: true};
          case "Union":
            return createInlineEnum(adlType);
          case "Array":
            var arrType = getCSharpType(adlType.elementType);
            if (arrType) {
              return {name: arrType.name + "[]", nameSpace: arrType.nameSpace, isBuiltIn : arrType.isBuiltIn};
            }
            return undefined;
          case "Model":
            // Is the type templated with only one type?
            if (adlType.baseModels.length === 1 && !(adlType.properties)) {
              return getCSharpType(adlType.baseModels[0]);
            }

            switch (adlType.name) {
              case "byte":
                return { name: "byte[]", nameSpace: "System", isBuiltIn: true };
              case "int32":
                return {name: "int", nameSpace: "System", isBuiltIn: true};
              case "int64":
                return {name: "int", nameSpace: "System", isBuiltIn: true};
              case "float64":
                return {name: "double", nameSpace: "System", isBuiltIn: true};
              case "float32":
                return {name: "float", nameSpace: "System", isBuiltIn: true};
              case "string":
                return {name: "string", nameSpace: "System", isBuiltIn: true};
              case "boolean":
                return {name: "bool", nameSpace: "System", isBuiltIn: true};
              case "plainDate":
                return {name: "DateTime", nameSpace: "System", isBuiltIn: true};
              case "zonedDateTime":
                return {name: "DateTime", nameSpace: "System", isBuiltIn: true};
              case "plainTime":
                return {name: "DateTime", nameSpace: "System", isBuiltIn: true};
              case "Map":
                // We assert on valType because Map types always have a type
                const valType = adlType.properties.get("v");
                return {
                  name: "IDictionary",
                  nameSpace: "System.Collections",
                  isBuiltIn: true,
                  typeParameters: [{name: "string", nameSpace: "System", isBuiltIn: true}, getCSharpType(valType!.type)!]
                };
              default:
                if (adlType.assignmentType) {
                  const assignedType = getCSharpType(adlType.assignmentType);
                  return assignedType ?? undefined;
                }
                return {name: adlType.name, nameSpace: modelNamespace, isBuiltIn: false, typeParameters: adlType.templateArguments? [...adlType.templateArguments!.map( arg => getCSharpType(arg)!)] : undefined};
                break;
        }
      // fallthrough
      default:
        return undefined;
      }
    }

    

    async function generateResource(resource: any) {
      var resourcePath = genPath + "/" + resource.name + "ControllerBase.cs";
      await program.host.writeFile(path.resolve(resourcePath), 
        await sqrl.renderFile(path.resolve(path.join(rootPath, "templates/resourceControllerBase.sq")), resource));
    }

    async function generateModel(model: any) {
      var modelPath = genPath + "/models/" + model.name + ".cs";
      await program.host.writeFile(path.resolve(modelPath), await sqrl.renderFile(path.resolve(path.join(rootPath, "templates/model.sq")), model));
    }

    async function generateEnum(model: any) {
      var modelPath = genPath + "/models/" + model.name + ".cs";
      var templateFile = path.resolve(path.join(rootPath, model.isClosed? "templates/closedEnum.sq" : "templates/openEnum.sq"));
      await program.host.writeFile(path.resolve(modelPath), await sqrl.renderFile(templateFile, model));
    }

    async function createDirIfNotExists( targetPath: string) {
        if (!(await fs.stat(targetPath).catch(err => {
            return false;}))) 
          {
         await fs.mkdir(targetPath);
          }
    }

    async function copyModelFiles(sourcePath: string, targetPath: string) {
      console.log("Copying (" + sourcePath + ", " + targetPath + ")");
      await createDirIfNotExists(targetPath);
      (await fs.readdir(sourcePath)).forEach( async file =>  {
        var sourceFile = path.resolve(sourcePath + "/" + file);
        var targetFile = path.resolve(targetPath + "/" + file);
        if ((await fs.lstat(sourceFile)).isDirectory())
        {
            
            console.log ("Creating directory " + targetFile);
            await createDirIfNotExists(targetFile);

            await copyModelFiles(sourceFile, targetFile);
        }
        else
        {
            console.log("copying " + sourceFile + " to " + targetFile);
            await fs.copyFile(sourceFile, targetFile)
        }
     });
   }


    const service = outputModel.serviceName
    
    sqrl.filters.define("decl", op => op.parameters.map( (p: any) => p.type + " " + p.name).join(', '));
    sqrl.filters.define("call", op => op.parameters.map( (p: any) => p.name).join(', '));
    sqrl.filters.define("typeParamList", op => op.typeParameters.map( (p: TypeReference) => p.name).join(', '));
    sqrl.filters.define("callByValue", op => op.parameters.map( (p: ValueParameter) => p.type === "string"?  '"' + p.value + '"': p.value ).join(', '));

    await createDirIfNotExists(genPath);
    await copyModelFiles(path.join(rootPath, "clientlib"), path.join(genPath, "models"));
    var routesPath = path.resolve(path.join(genPath, service + "ServiceRoutes.cs"));
    var operationsPath = path.resolve(path.join(genPath, "OperationControllerBase.cs"));
    console.log("Writing service routes to: " + routesPath);
    let myOutputModel = JSON.parse((await fs.readFile(path.join(rootPath, "input", "fluidrelay.json"), 'utf-8')));
    await program.host.writeFile(routesPath, await sqrl.renderFile(path.join(rootPath, "templates", "serviceRoutingConstants.sq"), outputModel));
    console.log("Writing operations controller to: " + operationsPath);
    await program.host.writeFile(operationsPath, await sqrl.renderFile(path.join(rootPath, "templates", "operationControllerBase.sq"), outputModel));
    outputModel.resources.forEach( (resource: any) => generateResource(resource));
    console.log("Writing models")
    var models = myOutputModel.models;
    for(var model in models) {   
        console.log("Rendering model " + model);
        //console.log("using data " + safeStringify(models[model]));
        generateModel(models[model]);
    }
    
    var enums = myOutputModel.enumerations;
    for(var model  in enums) { 
      console.log("Rendering enum " + model);
      generateEnum(enums[model]);
    }
    
    console.log("Completed")
  }
}
