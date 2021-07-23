import * as sqrl from "squirrelly";
import * as fs from "fs";
var args = process.argv.slice(2);
// node adl-gen.js <data-file> <outdir>
console.log("using args: (" + args[0] + ", " + args[1] + ")");
var inputJson = JSON.parse(fs.readFileSync(args[0]));
var service = inputJson.serviceName;

sqrl.filters.define("decl", (op) => op.parameters.map((p) => p.type + " " + p.name).join(", "));
sqrl.filters.define("call", (op) => op.parameters.map((p) => p.name).join(", "));
sqrl.filters.define("typeParamList", (op) => op.typeParameters.map((p) => p.name).join(", "));
sqrl.filters.define("callByValue", (op) =>
  op.parameters.map((p) => (p.type === "string" ? '"' + p.value + '"' : p.value)).join(", ")
);
var path = args[1];

async function generateResource(resource) {
  var resourcePath = path + "/" + resource.name + "ControllerBase.cs";
  fs.writeFileSync(
    resourcePath,
    await sqrl.renderFile("templates/resourceControllerBase.sq", resource),
    { flags: "w+" }
  );
}

async function generateModel(model) {
  var modelPath = path + "/models/" + model.name + ".cs";
  fs.writeFileSync(modelPath, await sqrl.renderFile("templates/model.sq", model), { flags: "w+" });
}

async function generateEnum(model) {
  var modelPath = path + "/models/" + model.name + ".cs";
  var templateFile = model.isClosed ? "templates/closedEnum.sq" : "templates/openEnum.sq";
  fs.writeFileSync(modelPath, await sqrl.renderFile(templateFile, model), { flags: "w+" });
}

function copyModelFiles(sourcePath, targetPath) {
  console.log("Copying (" + sourcePath + ", " + targetPath + ")");
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath);
  }

  fs.readdirSync(sourcePath).forEach((file) => {
    var sourceFile = sourcePath + "/" + file;
    var targetFile = targetPath + "/" + file;
    if (fs.lstatSync(sourceFile).isDirectory()) {
      console.log("Creating directory " + targetFile);
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
      }

      copyModelFiles(sourceFile, targetFile);
    } else {
      console.log("copying " + sourceFile + " to " + targetFile);
      fs.copyFileSync(sourcePath + "/" + file, targetPath + "/" + file);
    }
  });
}

copyModelFiles("./clientlib", path + "/models");
var routesPath = path + "/" + service + "ServiceRoutes.cs";
var operationsPath = path + "/OperationControllerBase.cs";
console.log("Writing service routes to: " + routesPath);
fs.writeFileSync(
  routesPath,
  await sqrl.renderFile("templates/serviceRoutingConstants.sq", inputJson),
  { flags: "w+" }
);
console.log("Writing operations controller to: " + operationsPath);
fs.writeFileSync(
  operationsPath,
  await sqrl.renderFile("templates/operationControllerBase.sq", inputJson),
  { flags: "w+" }
);
inputJson.resources.forEach((resource) => generateResource(resource));
console.log("Writing models");
var models = inputJson.models;
for (var model in models) {
  console.log("Rendering model " + model);
  console.log("using data " + models[model]);
  generateModel(models[model]);
}
var enums = inputJson.enumerations;
for (var model in enums) {
  console.log("Rendering enum " + model);
  console.log("using data " + enums[model]);
  generateEnum(enums[model]);
}
console.log("Completed");
