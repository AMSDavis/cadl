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
  UnionType
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
  HttpVerb,
  isBody,
  _checkIfServiceNamespace
} from "@azure-tools/adl-rest";
import * as path from "path";
import * as sqrl from "squirrelly"
import * as fs from "fs/promises"
import { FileSystemError } from "vscode";
export async function onBuild(program: Program) {
  const options : ServiceGenerationOptions = {
    controllerOutputPath : program.compilerOptions.serviceCodePath || path.resolve("./output")
  };

  const generator = CreateServiceCodeGenerator(program, options);
  await generator.generateServiceCode();
}

export interface ServiceGenerationOptions {
  controllerOutputPath: string;
}

export function CreateServiceCodeGenerator(program: Program, options: ServiceGenerationOptions) {

  interface Resource {
    name: string,
    nameSpace: string,
    serviceName: string,
    serializedName: string,
    nameParameter: string,
    hasSubscriptionList: boolean,
    hasResourceGroupList: boolean,
    itemPath: string,
    operations?: Map<string, Operation>
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
    typeParameters?: TypeReference[]
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
    models: Map<string, Model>,
    enumerations: Map<string, Enumeration>
  };

  const outputModel: serviceModel = {
    nameSpace: "",
    serviceName: "",
    resources: [],
    models: new Map<string, Model>(),
    enumerations: new Map<string, Enumeration>()
  }

  return {generateServiceCode};
  

  async function generateServiceCode() {

    const genPath = options.controllerOutputPath;

    async function populateModels(namespace: NamespaceType) {
      namespace.models.forEach(async model => {
        outputModel.models.set(model.name, await convertModel(model, program.globalNamespace.name.sv));
      })
    } 

    async function convertModel(model: ModelType, serviceName : string) : Promise<Model> {
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
          description: getDoc(program, model)
        }

        return outModel;
    }

    function getPropertyDecl(property: ModelTypeProperty) : Property
    {
        const outPropertyType = getCSharpType(property.type);
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
        let format = getFormat(program, property.type)
        if (format) {
          output.concat(getPatternAttribute(format));
        }

        let minLength = getMinLength(program, property.type);
        let maxLength = getMaxLength(program, property.type);
        if (minLength || maxLength) {
          output.concat(getLengthAttribute(minLength, maxLength));
        }

        return output;
    }
    
    function getCSharpTypeDecl(adlType: Type) : TypeDeclaration {

    }

    function createInlineEnum(adlType: Type, value: string) : TypeReference {

    }
    
    function getCSharpType(adlType: Type) : TypeReference | undefined {
        switch (adlType.kind) {
          case "String":
            return createInlineEnum(adlType, adlType.value);
          case "Boolean":
            return { name: "bool", nameSpace: "System"};
          case "Model":
            // Is the type templated with only one type?
            if (adlType.baseModels.length === 1 && !(adlType.properties)) {
              return getCSharpType(adlType.baseModels[0]);
            }

            switch (adlType.name) {
              case "byte":
                return { name: "byte[]", nameSpace: "System" };
              case "int32":
                return {name: "int", nameSpace: "System"};
              case "int64":
                return {name: "int", nameSpace: "System"};
              case "float64":
                return {name: "double", nameSpace: "System"};
              case "float32":
                return {name: "float", nameSpace: "System"};
              case "string":
                return {name: "string", nameSpace: "System"};
              case "boolean":
                return {name: "bool", nameSpace: "System"};
              case "plainDate":
                return {name: "DateTime", nameSpace: "System"};
              case "zonedDateTime":
                return {name: "DateTime", nameSpace: "System"};
              case "plainTime":
                return {name: "DateTime", nameSpace: "System"};
              case "Map":
                // We assert on valType because Map types always have a type
                const valType = adlType.properties.get("v");
                return {
                  name: "IDictionary",
                  nameSpace: "System.Collections",
                  typeParameters: [{name: "string", nameSpace: "System"}, getCSharpType(valType!.type)!]
                };
              default:
            // Recursively call this function to find the underlying OpenAPI type
                if (adlType.assignmentType) {
                  const assignedType = getCSharpType(adlType.assignmentType);
                  return assignedType ?? undefined;
                }
                break;
        }
      // fallthrough
      default:
        return undefined;
      }
    }

    

    async function generateResource(resource: Resource) {
      var resourcePath = genPath + "/" + resource.name + "ControllerBase.cs";
      await program.host.writeFile(path.resolve(resourcePath), 
        await sqrl.renderFile(path.resolve("templates/resourceControllerBase.sq"), resource));
    }

    async function generateModel(model: Model) {
      var modelPath = genPath + "/models/" + model.name + ".cs";
      await program.host.writeFile(path.resolve(modelPath), await sqrl.renderFile(path.resolve("templates/model.sq"), model));
    }

    async function generateEnum(model: Enumeration) {
      var modelPath = genPath + "/models/" + model.name + ".cs";
      var templateFile = path.resolve(model.isClosed? "templates/closedEnum.sq" : "templates/openEnum.sq");
      await program.host.writeFile(path.resolve(modelPath), await sqrl.renderFile(templateFile, model));
    }

    async function copyModelFiles(sourcePath: string, targetPath: string) {
      console.log("Copying (" + sourcePath + ", " + targetPath + ")");
      if (!(await fs.stat(targetPath))) 
      {
         await fs.mkdir(targetPath);
      }
     
      (await fs.readdir(sourcePath)).forEach( async file =>  {
        var sourceFile = path.resolve(sourcePath + "/" + file);
        var targetFile = path.resolve(targetPath + "/" + file);
        if ((await fs.lstat(sourceFile)).isDirectory())
        {
            
            console.log ("Creating directory " + targetFile);
            if (!(await fs.stat(targetFile))) 
            {
               await fs.mkdir(targetFile);
            }

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

    copyModelFiles("./clientlib", path + "/models");
    var routesPath = path.resolve(genPath + "/" + service + "ServiceRoutes.cs");
    var operationsPath = path.resolve(genPath + "/OperationControllerBase.cs");
    console.log("Writing service routes to: " + routesPath);
    await program.host.writeFile(routesPath, await sqrl.renderFile("templates/serviceRoutingConstants.sq", outputModel));
    console.log("Writing operations controller to: " + operationsPath);
    await program.host.writeFile(operationsPath, await sqrl.renderFile("templates/operationControllerBase.sq", outputModel));
    outputModel.resources.forEach( resource => generateResource(resource));
    console.log("Writing models")
    outputModel.models.forEach(model => {
        console.log("Rendering model " + model.name);
        console.log("using data " + JSON.stringify(model));
        generateModel(model);
    });
    
    outputModel.enumerations.forEach(model => {
      console.log("Rendering enum " + model.name);
      console.log("using data " + JSON.stringify(model));
      generateEnum(model);
    });
    console.log("Completed")
  }
}
