import { createTestHost } from "@cadl-lang/compiler/dist/test/test-host.js";
import { resolve } from "path";
import { fileURLToPath } from "url";

export async function createOpenAPITestHost() {
  const host = await createTestHost();
  const root = resolve(fileURLToPath(import.meta.url), "../../../");

  // load rest
  await host.addRealCadlFile(
    "./node_modules/rest/package.json",
    resolve(root, "../../core/packages/rest/package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/rest.cadl",
    resolve(root, "../../core/packages/rest/lib/rest.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/resource.cadl",
    resolve(root, "../../core/packages/rest/lib/resource.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/http.cadl",
    resolve(root, "../../core/packages/rest/lib/http.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/rest.js",
    resolve(root, "../../core/packages/rest/dist/rest.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/http.js",
    resolve(root, "../../core/packages/rest/dist/http.js")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/resource.js",
    resolve(root, "../../core/packages/rest/dist/resource.js")
  );

  // load openapi
  await host.addRealCadlFile(
    "./node_modules/cadl-autorest/package.json",
    resolve(root, "../cadl-autorest/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/cadl-autorest/dist/src/openapi.js",
    resolve(root, "../cadl-autorest/dist/src/openapi.js")
  );

  return host;
}

export async function openApiFor(code: string) {
  const host = await createOpenAPITestHost();
  const outPath = resolve("/openapi.json");
  host.addCadlFile("./main.cadl", `import "rest"; import "cadl-autorest";using Cadl.Http;${code}`);
  await host.compile("./main.cadl", { noEmit: false, swaggerOutputFile: outPath });
  return JSON.parse(host.fs.get(outPath)!);
}
