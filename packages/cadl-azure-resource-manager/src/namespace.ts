import { addSecurityDefinition, addSecurityRequirement } from "@azure-tools/cadl-autorest";
import {
  getServiceHost,
  NamespaceType,
  Program,
  setServiceHost,
  setServiceNamespace,
  Type,
} from "@cadl-lang/compiler";
import { $consumes, $produces } from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";

const armNamespacesKey = Symbol();

// NOTE: This can be considered the entrypoint for marking a service definition as
// an ARM service so that we might enable ARM-specific Swagger emit behavior.

export function $armNamespace(program: Program, entity: Type, armNamespace?: string) {
  if (entity.kind !== "Namespace") {
    reportDiagnostic(program, {
      code: "decorator-wrong-type",
      messageId: "armNamespace",
      target: entity,
    });
    return;
  }

  // armNamespace will set the service namespace if it's not done already
  setServiceNamespace(program, entity);

  if (!getServiceHost(program)) {
    setServiceHost(program, "management.azure.com");
  }

  // 'namespace' is optional, use the actual namespace string if omitted
  const cadlNamespace = program.checker!.getNamespaceString(entity);
  if (!armNamespace) {
    armNamespace = cadlNamespace;
  }

  program.stateMap(armNamespacesKey).set(entity, armNamespace);

  // Add the /operations endpoint for the ARM namespace
  program.evalCadlScript(`
    using Azure.ARM;
    using Azure.ResourceManager;
    using Cadl.Http;
    namespace ${cadlNamespace} {
      @tag("Operations")
      @route("/providers/${armNamespace}/operations")
      namespace Operations {
        @doc("List the operations for ${armNamespace}")
        @pageable @get op List(...ApiVersionParameter): ArmResponse<OperationListResult> | ErrorResponse;
      }
    }`);

  // ARM services need to have "application/json" set on produces/consumes
  $produces(program, entity, "application/json");
  $consumes(program, entity, "application/json");

  // Set default security definitions
  addSecurityRequirement(program, entity, "azure_auth", ["user_impersonation"]);
  addSecurityDefinition(program, entity, "azure_auth", {
    type: "oauth2",
    authorizationUrl: "https://login.microsoftonline.com/common/oauth2/authorize",
    flow: "implicit",
    description: "Azure Active Directory OAuth2 Flow.",
    scopes: {
      user_impersonation: "impersonate your user account",
    },
  });
}

export function getArmNamespace(program: Program, namespace: NamespaceType): string | undefined {
  let currentNamespace: NamespaceType | undefined = namespace;
  let armNamespace: string | undefined;
  while (currentNamespace) {
    armNamespace = program.stateMap(armNamespacesKey).get(currentNamespace);
    if (armNamespace) {
      return armNamespace;
    }

    currentNamespace = currentNamespace.namespace;
  }

  return undefined;
}
