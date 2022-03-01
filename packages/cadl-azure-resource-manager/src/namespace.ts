import { addSecurityDefinition, addSecurityRequirement } from "@azure-tools/cadl-autorest";
import {
  DecoratorContext,
  getServiceHost,
  ModelType,
  NamespaceType,
  OperationType,
  Program,
  setServiceHost,
  setServiceNamespace,
  StringLiteralType,
  Type,
  validateDecoratorParamType,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";
import { $consumes, $produces } from "@cadl-lang/rest";
import { reportDiagnostic } from "./lib.js";

const armNamespacesKey = Symbol();

export function $armNamespace(context: DecoratorContext, entity: Type, armNamespace?: string) {
  const { program } = context;
  if (!validateDecoratorTarget(program, entity, "@armNamespace", "Namespace")) {
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

  // ARM services need to have "application/json" set on produces/consumes
  $produces(context, entity, "application/json");
  $consumes(context, entity, "application/json");

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

export function getArmNamespace(
  program: Program,
  entity: NamespaceType | ModelType
): string | undefined {
  let currentNamespace: NamespaceType | undefined =
    entity.kind === "Namespace" ? entity : entity.namespace;

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

/**
 * This decorator dynamcally assigns the serviceNamespace from the containing
 * namespace to the string literal value of the path parameter to which this
 * decorator is applied.  Its purpose is to dynamically insert the provider
 * namespace (e.g. 'Microsoft.CodeSigning') into the path parameter list.
 */
export function $assignProviderNameValue(
  context: DecoratorContext,
  target: Type,
  resourceType: Type
) {
  const { program } = context;

  // If the resource type is a template parameter, this must be a templated type
  if (resourceType.kind === "TemplateParameter") {
    return;
  }

  if (
    !validateDecoratorTarget(program, target, "@assignProviderNameValue", "ModelProperty") ||
    !validateDecoratorParamType(program, target, target.type, "String") ||
    !validateDecoratorParamType(program, target, resourceType, "Model")
  ) {
    return;
  }

  const armNamespace = getArmNamespace(program, resourceType as ModelType);
  if (armNamespace) {
    (target.type as StringLiteralType).value = armNamespace;
  }
}

export function $armUpdateProviderNamespace(context: DecoratorContext, entity: Type) {
  const { program } = context;

  if (!validateDecoratorTarget(program, entity, "@armUpdateProviderNamespace", "Operation")) {
    return;
  }

  const operation = entity as OperationType;
  const opInterface = operation.interface;
  if (opInterface && opInterface.namespace) {
    const armNamespace = getArmNamespace(program, opInterface.namespace);
    if (armNamespace) {
      // Set the namespace constant on the 'provider' parameter
      const providerParam = operation.parameters.properties.get("provider");
      if (providerParam) {
        if (providerParam.type.kind !== "String") {
          reportDiagnostic(program, {
            code: "decorator-param-wrong-type",
            messageId: "armUpdateProviderNamespace",
            target: providerParam,
          });
          return;
        }

        providerParam.type.value = armNamespace;
      }
    }
  }
}
