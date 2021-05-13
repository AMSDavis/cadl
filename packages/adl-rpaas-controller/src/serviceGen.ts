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
import * as fs from "fs"
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
    parameters?: methodParameter[],
  }

  interface methodParameter {
    name: string,
    type: string,
    location?: string,
    description?: string
  }

  interface Model {
    serviceName: string,
    description?: string,
    name: string,
    nameSpace: string,
    isDerivedType: boolean,
    isImplementer: boolean,
    baseClass?: TypeReference,
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

  interface ValidationAttribute {
    name: string,
    parameters: ValueParameter[]
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

    function copyModelFiles(sourcePath: string, targetPath: string) {
      console.log("Copying (" + sourcePath + ", " + targetPath + ")");
      if (!fs.existsSync(targetPath)) 
      {
         fs.mkdirSync(targetPath);
      }
     
      fs.readdirSync(sourcePath).forEach( file => {
        var sourceFile = sourcePath + "/" + file;
        var targetFile = targetPath + "/" + file;
        if (fs.lstatSync(sourceFile).isDirectory())
        {
            
            console.log ("Creating directory " + targetFile);
            if (!fs.existsSync(targetPath)) 
            {
               fs.mkdirSync(targetPath);
            }

            copyModelFiles(sourceFile, targetFile);
        }
        else
        {
            console.log("copying " + sourceFile + " to " + targetFile);
            fs.copyFileSync(sourcePath + "/" + file, targetPath + "/" + file)
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
