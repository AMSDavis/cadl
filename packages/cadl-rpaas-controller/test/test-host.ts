import { AutorestTestLibrary } from "@azure-tools/cadl-autorest/testing";
import { RPaaSTestLibrary } from "@azure-tools/cadl-rpaas/testing";
import { createTestHost, createTestWrapper } from "@cadl-lang/compiler/testing";
import { OpenAPITestLibrary } from "@cadl-lang/openapi/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { RPaaSControllerTestLibrary } from "../src/testing/index.js";

export async function createRPaaSControllerTestHost() {
  return createTestHost({
    libraries: [
      RestTestLibrary,
      OpenAPITestLibrary,
      AutorestTestLibrary,
      RPaaSTestLibrary,
      RPaaSControllerTestLibrary,
    ],
  });
}

export async function createRPaasControllerTestRunner() {
  const host = await createRPaaSControllerTestHost();
  return createTestWrapper(
    host,
    (code) =>
      `import "${RestTestLibrary.name}"; import "@cadl-lang/openapi";import "${AutorestTestLibrary.name}"; import "${RPaaSTestLibrary.name}"; import "${RPaaSControllerTestLibrary.name}";${code}`,
    {
      emitters: [AutorestTestLibrary.name, RPaaSControllerTestLibrary.name],
    }
  );
}
