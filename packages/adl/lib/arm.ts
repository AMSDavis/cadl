import { NamespaceStatementNode, ModelStatementNode, ModelType, Type, Statement } from "../compiler/types";
import { Program } from "../compiler/program";
import { parse } from "../compiler/parser.js";
import { resource } from "./rest.js";

function parseStatement<TNode extends Statement>(adlStatement: string): TNode {
  // We're assuming that the parser will throw on bad input,
  // so no error handling is added at this level
  const script = parse(adlStatement);

  if (script.statements.length === 0) {
    throw new Error("No statements found in parsed input.");
  }

  return script.statements[0] as TNode;
}

// TODO: We can't name this ArmTrackedResource because that name
//       is already taken.  Consider having decorators occupy a
//       different namespace than types.
export function TrackedResource(
  program: Program,
  target: Type,
  resourceRoot: string,
  propertyType: Type) {

  const checker = program.checker;
  if (checker === undefined) {
    throw new Error("Program does not have a checker assigned");
  }

  if (target.kind === "Namespace") {
    if (propertyType.kind === "Model") {
      // Create the resource model type and evaluate it
      const resourceModelName = `${target.name}Resource`;
      // TODO: How do I put this in a parent namespace?
      program.evalAdlScript(`
         @extension("x-ms-azure-resource", true) \
         model ${resourceModelName} = ArmTrackedResource<${propertyType.name}>;

         @resource("/subscriptions/{subscriptionId}/providers/${resourceRoot}")
         namespace ${target.name}ListAll {
           @list @get op listAll(@path subscriptionId: string): Page<${resourceModelName}>;
         }

         @resource("/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/${resourceRoot}")
         namespace ${target.name}List {
           @list @get op listByResourceGroup(@path subscriptionId: string, @path resourceGroup: string): Page<${resourceModelName}>;
         }
      `);

      // Create a temporary namespace and parse it so
      // that we can harvest its namespace properties
      const resourceNamespaceNode = parseStatement<NamespaceStatementNode>(
        // TODO: Might need to generate dynamic namespace here!
        `namespace Temp { \
          @get op get(@path subscriptionId: string, @path resourceGroup: string, @path name: string): ArmResponse<${resourceModelName}>; \
          @put op createOrUpdate(@path subscriptionId: string, @path resourceGroup: string, @path name: string, @body resource: ${resourceModelName}) : ArmResponse<${resourceModelName}>; \
          @patch op update(@path subscriptionId: string, @path resourceGroup: string, @path name: string, @body resource: ${resourceModelName}): ArmResponse<${resourceModelName}>; \
          @_delete op delete(@path subscriptionId: string, @path resourceGroup: string, @path name: string): ArmResponse<{}>; \
        }`
      );

      // Add all of the properties from the parsed namespace 
      for (const prop of resourceNamespaceNode.properties) {
        target.properties.set(prop.id.sv, checker.checkNamespaceProperty(prop));
      }

      // Add the @resource decorator
      resource(program, target, `/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/${resourceRoot}/{name}`);
    } else {
      throw new Error("TrackedResource property type must be a model");
    }
  } else {
    throw new Error("TrackedResource decorator can only be applied to namespaces");
  }
}
