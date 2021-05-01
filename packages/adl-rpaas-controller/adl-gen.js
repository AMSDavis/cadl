import * as sqrl from 'squirrelly'
import * as fs from 'fs'
var args = process.argv.slice(2)
// node adl-gen.js <data-file> <outdir>
console.log("using args: (" + args[0] + ", " + args[1] + ")")
//var template = fs.readFileSync(args[0], 'utf8')
//console.log("template: " + template)
var inputJson = JSON.parse(fs.readFileSync(args[0]))
var service = inputJson.serviceName

sqrl.filters.define("decl", op => op.parameters.map( p => p.type + " " + p.name).join(', '));
sqrl.filters.define("call", op => op.parameters.map( p => p.name).join(', '));
var resource = inputJson.resources[0];
var createOp = resource.operations.CreateOrUpdate;
var parmsDecl = createOp.parameters.map( p => p.type + " " + p.name).join(', ');
console.log("Parms")
console.log(parmsDecl)
var path = args[1];

async function generateResource(resource) {
    var resourcePath = path + "/" + resource.name + "ControllerBase.cs";
    fs.writeFileSync(resourcePath, await sqrl.renderFile("templates/resourceControllerBase.sq", resource), {"flags": "w+"});
 }
var routesPath = path + "/" + service + "ServiceRoutes.cs";
var operationsPath = path + "/OperationControllerBase.cs";
console.log("Writing service routes to: " + routesPath);
fs.writeFileSync(routesPath, await sqrl.renderFile("templates/serviceRoutingConstants.sq", inputJson), {"flags": "w+"});
console.log("Writing operations controller to: " + operationsPath);
fs.writeFileSync(operationsPath, await sqrl.renderFile("templates/operationControllerBase.sq", inputJson), {"flags": "w+"});
inputJson.resources.forEach( resource => generateResource(resource));
console.log("Completed")
 