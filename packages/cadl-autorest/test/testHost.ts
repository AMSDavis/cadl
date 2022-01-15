import { resolvePath } from "@cadl-lang/compiler";
import { createTestHost } from "@cadl-lang/compiler/dist/test/test-host.js";
import { fileURLToPath } from "url";

export async function createOpenAPITestHost() {
  const host = await createTestHost();
  const root = resolvePath(fileURLToPath(import.meta.url), "../../../");

  // load rest
  await host.addRealCadlFile(
    "./node_modules/rest/package.json",
    resolvePath(root, "../../core/packages/rest/package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/rest.cadl",
    resolvePath(root, "../../core/packages/rest/lib/rest.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/resource.cadl",
    resolvePath(root, "../../core/packages/rest/lib/resource.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/http.cadl",
    resolvePath(root, "../../core/packages/rest/lib/http.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/rest.js",
    resolvePath(root, "../../core/packages/rest/dist/src/rest.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/route.js",
    resolvePath(root, "../../core/packages/rest/dist/src/route.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/http.js",
    resolvePath(root, "../../core/packages/rest/dist/src/http.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/src/resource.js",
    resolvePath(root, "../../core/packages/rest/dist/src/resource.js")
  );

  // load openapi
  await host.addRealCadlFile(
    "./node_modules/cadl-autorest/package.json",
    resolvePath(root, "../cadl-autorest/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/cadl-autorest/dist/src/openapi.js",
    resolvePath(root, "../cadl-autorest/dist/src/openapi.js")
  );

  return host;
}

export async function openApiFor(code: string) {
  const host = await createOpenAPITestHost();
  const outPath = resolvePath("/openapi.json");
  host.addCadlFile("./main.cadl", `import "rest"; import "cadl-autorest";using Cadl.Http;${code}`);
  await host.compile("./main.cadl", { noEmit: false, swaggerOutputFile: outPath });
  return JSON.parse(host.fs.get(outPath)!);
}
