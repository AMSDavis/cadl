import { Diagnostic, resolvePath } from "@cadl-lang/compiler";
import { createTestHost } from "@cadl-lang/compiler/dist/test/test-host.js";
import { fileURLToPath } from "url";
import { libDef } from "../src/lib.js";

export async function createArmTestHost() {
  const host = await createTestHost();
  const root = resolvePath(fileURLToPath(import.meta.url), "../../../");

  // load rpaas
  await host.addRealCadlFile(
    "./node_modules/cadl-rpaas/package.json",
    resolvePath(root, "package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/cadl-rpaas/lib/arm.cadl",
    resolvePath(root, "lib/arm.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/cadl-rpaas/dist/src/arm.js",
    resolvePath(root, "dist/src/arm.js")
  );
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
    "./node_modules/rest/lib/http.cadl",
    resolvePath(root, "../../core/packages/rest/lib/http.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/rest/lib/resource.cadl",
    resolvePath(root, "../../core/packages/rest/lib/resource.cadl")
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
  const host = await createArmTestHost();
  const outPath = resolvePath("/openapi.json");
  host.addCadlFile(
    "./main.cadl",
    `import "rest"; import "cadl-autorest"; import "cadl-rpaas";${code}`
  );
  await host.compile("./main.cadl", {
    noEmit: false,
    swaggerOutputFile: outPath,
    emitters: ["cadl-autorest"],
  });
  return JSON.parse(host.fs.get(outPath)!);
}

export async function CheckFor(code: string) {
  const host = await createArmTestHost();
  const outPath = resolvePath("/openapi.json");
  host.addCadlFile(
    "./main.cadl",
    `import "rest"; import "cadl-autorest"; import "cadl-rpaas";${code}`
  );
  const result = await host.diagnose("./main.cadl", {
    noEmit: false,
    swaggerOutputFile: outPath,
    emitters: ["cadl-autorest"],
  });
  return result;
}

export function getDiagnostic(code: keyof typeof libDef.diagnostics, diagnostics: Diagnostic[]) {
  return diagnostics.filter((diag) => diag.code === `${libDef.name}/${code}`);
}
