import { createTestHost } from "@azure-tools/adl/dist/test/test-host.js";
import { resolve } from "path";
import { fileURLToPath } from "url";

export async function createArmTestHost() {
  const host = await createTestHost();
  const root = resolve(fileURLToPath(import.meta.url), "../../../");

  // load rpaas
  await host.addRealAdlFile("./node_modules/adl-rpaas/package.json", resolve(root, "package.json"));
  await host.addRealAdlFile("./node_modules/adl-rpaas/lib/arm.adl", resolve(root, "lib/arm.adl"));
  await host.addRealJsFile(
    "./node_modules/adl-rpaas/dist/arm.js",
    resolve(root, "dist/src/arm.js")
  );

  // load rest
  await host.addRealAdlFile(
    "./node_modules/adl-rest/package.json",
    resolve(root, "../adl-rest/package.json")
  );
  await host.addRealAdlFile(
    "./node_modules/adl-rest/lib/rest.adl",
    resolve(root, "../adl-rest/lib/rest.adl")
  );
  await host.addRealJsFile(
    "./node_modules/adl-rest/dist/rest.js",
    resolve(root, "../adl-rest/dist/rest.js")
  );

  // load openapi
  await host.addRealAdlFile(
    "./node_modules/adl-openapi/package.json",
    resolve(root, "../adl-openapi/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/adl-openapi/dist/openapi.js",
    resolve(root, "../adl-openapi/dist/openapi.js")
  );

  return host;
}

export async function openApiFor(code: string) {
  const host = await createArmTestHost();
  const outPath = resolve("/openapi.json");
  host.addAdlFile(
    "./main.adl",
    `import "adl-rest"; import "adl-openapi"; import "adl-rpaas";${code}`
  );
  await host.compile("./main.adl", { noEmit: false, swaggerOutputFile: outPath });
  return JSON.parse(host.fs.get(outPath)!);
}
