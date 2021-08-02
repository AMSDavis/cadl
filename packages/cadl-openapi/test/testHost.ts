import { createTestHost } from "@azure-tools/cadl/dist/test/test-host.js";
import { resolve } from "path";
import { fileURLToPath } from "url";

export async function createOpenAPITestHost() {
  const host = await createTestHost();
  const root = resolve(fileURLToPath(import.meta.url), "../../../");

  // load rest
  await host.addRealCadlFile(
    "./node_modules/cadl-rest/package.json",
    resolve(root, "../cadl-rest/package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/cadl-rest/lib/rest.cadl",
    resolve(root, "../cadl-rest/lib/rest.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/cadl-rest/dist/rest.js",
    resolve(root, "../cadl-rest/dist/rest.js")
  );

  // load openapi
  await host.addRealCadlFile(
    "./node_modules/cadl-openapi/package.json",
    resolve(root, "../cadl-openapi/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/cadl-openapi/dist/src/openapi.js",
    resolve(root, "../cadl-openapi/dist/src/openapi.js")
  );

  return host;
}

export async function openApiFor(code: string) {
  const host = await createOpenAPITestHost();
  const outPath = resolve("/openapi.json");
  host.addCadlFile("./main.cadl", `import "cadl-rest"; import "cadl-openapi";${code}`);
  await host.compile("./main.cadl", { noEmit: false, swaggerOutputFile: outPath });
  return JSON.parse(host.fs.get(outPath)!);
}
