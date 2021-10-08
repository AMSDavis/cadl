import { createTestHost } from "@cadl-lang/compiler/dist/test/test-host.js";
import { resolve } from "path";
import { fileURLToPath } from "url";

export async function createArmTestHost() {
  const host = await createTestHost();
  const root = resolve(fileURLToPath(import.meta.url), "../../../");

  // load rpaas
  await host.addRealCadlFile(
    "./node_modules/cadl-rpaas/package.json",
    resolve(root, "package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/cadl-rpaas/lib/arm.cadl",
    resolve(root, "lib/arm.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/cadl-rpaas/dist/src/arm.js",
    resolve(root, "dist/src/arm.js")
  );

  // load rest
  await host.addRealCadlFile(
    "./node_modules/rest/package.json",
    resolve(root, "../rest/package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/rest.cadl",
    resolve(root, "../rest/lib/rest.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/rest/dist/rest.js",
    resolve(root, "../rest/dist/rest.js")
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
  const host = await createArmTestHost();
  const outPath = resolve("/openapi.json");
  host.addCadlFile(
    "./main.cadl",
    `import "rest"; import "cadl-autorest"; import "cadl-rpaas";${code}`
  );
  await host.compile("./main.cadl", { noEmit: false, swaggerOutputFile: outPath });
  return JSON.parse(host.fs.get(outPath)!);
}
