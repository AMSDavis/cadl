import { AutorestTestLibrary } from "@azure-tools/cadl-autorest/testing";
import { AzureCoreTestLibrary } from "@azure-tools/cadl-azure-core/testing";
import { AzureResourceManagerTestLibrary } from "@azure-tools/cadl-azure-resource-manager/testing";
import { createTestHost, createTestWrapper } from "@cadl-lang/compiler/testing";
import { OpenAPITestLibrary } from "@cadl-lang/openapi/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { ProviderHubControllerTestLibrary } from "../src/testing/index.js";

export async function createProviderHubControllerTestHost() {
  return createTestHost({
    libraries: [
      RestTestLibrary,
      OpenAPITestLibrary,
      AutorestTestLibrary,
      ProviderHubControllerTestLibrary,
      AzureCoreTestLibrary,
      AzureResourceManagerTestLibrary,
    ],
  });
}

export async function createRPaasControllerTestRunner() {
  const host = await createProviderHubControllerTestHost();
  return createTestWrapper(
    host,
    (code) =>
      `import "${RestTestLibrary.name}"; import "@cadl-lang/openapi";import "${AutorestTestLibrary.name}"; import "${ProviderHubControllerTestLibrary.name}"; import "${AzureCoreTestLibrary.name}"; import "${AzureResourceManagerTestLibrary.name}"; ${code}`,
    {
      emitters: [AutorestTestLibrary.name, ProviderHubControllerTestLibrary.name],
    }
  );
}
