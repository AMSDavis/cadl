import { AutorestTestLibrary } from "@azure-tools/cadl-autorest/testing";
import { AzureCoreTestLibrary } from "@azure-tools/cadl-azure-core/testing";
import { ProviderHubTestLibrary } from "@azure-tools/cadl-providerhub/testing";
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
      ProviderHubTestLibrary,
      ProviderHubControllerTestLibrary,
      AzureCoreTestLibrary,
    ],
  });
}

export async function createRPaasControllerTestRunner() {
  const host = await createProviderHubControllerTestHost();
  return createTestWrapper(
    host,
    (code) =>
      `import "${RestTestLibrary.name}"; import "@cadl-lang/openapi";import "${AutorestTestLibrary.name}"; import "${ProviderHubTestLibrary.name}"; import "${ProviderHubControllerTestLibrary.name}"; import "${AzureCoreTestLibrary.name}"; ${code}`,
    {
      emitters: [AutorestTestLibrary.name, ProviderHubControllerTestLibrary.name],
    }
  );
}
