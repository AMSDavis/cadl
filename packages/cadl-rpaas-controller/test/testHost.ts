import { Diagnostic, joinPaths, resolvePath } from "@cadl-lang/compiler";
import { createTestHost } from "@cadl-lang/compiler/dist/test/test-host.js";
import { readdir } from "fs/promises";
import { fileURLToPath } from "url";
import { libDef } from "../src/lib.js";
export async function createRPaaSTestHost() {
  const host = await createTestHost();
  const root = resolvePath(fileURLToPath(import.meta.url), "../../../");

  async function addRealDirectory(vFSPath: string, realPath: string) {
    (await readdir(realPath, { withFileTypes: true })).forEach(async (dirEnt) => {
      const newRealPath = resolvePath(realPath, dirEnt.name);
      const newVFSPath = joinPaths(vFSPath, dirEnt.name);
      if (dirEnt.isDirectory()) {
        await addRealDirectory(newVFSPath, newRealPath);
      } else {
        await host.addRealCadlFile(newVFSPath, newRealPath);
      }
    });
  }

  await addRealDirectory(
    "./node_modules/@azure-tools/cadl-rpaas-controller/clientlib",
    resolvePath(root, "clientlib")
  );

  await addRealDirectory(
    "./node_modules/@azure-tools/cadl-rpaas-controller/templates",
    resolvePath(root, "templates")
  );
  // load the controller code
  await host.addRealCadlFile(
    "./node_modules/@azure-tools/cadl-rpaas-controller/package.json",
    resolvePath(root, "package.json")
  );

  await host.addRealJsFile(
    "./node_modules/@azure-tools/cadl-rpaas-controller/dist/src/generate.js",
    resolvePath(root, "dist/src/generate.js")
  );

  await host.addRealJsFile(
    "./node_modules/@azure-tools/cadl-rpaas-controller/dist/src/lib.js",
    resolvePath(root, "dist/src/lib.js")
  );

  await host.addRealCadlFile(
    "./node_modules/@azure-tools/cadl-rpaas/package.json",
    resolvePath(root, "../cadl-rpaas/package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/@azure-tools/cadl-rpaas/lib/arm.cadl",
    resolvePath(root, "../cadl-rpaas/lib/arm.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/@azure-tools/cadl-rpaas/dist/src/arm.js",
    resolvePath(root, "../cadl-rpaas/dist/src/arm.js")
  );
  // load rest
  await host.addRealCadlFile(
    "./node_modules/@cadl-lang/rest/package.json",
    resolvePath(root, "../../core/packages/rest/package.json")
  );
  await host.addRealCadlFile(
    "./node_modules/@cadl-lang/rest/lib/rest.cadl",
    resolvePath(root, "../../core/packages/rest/lib/rest.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/@cadl-lang/rest/lib/http.cadl",
    resolvePath(root, "../../core/packages/rest/lib/http.cadl")
  );
  await host.addRealCadlFile(
    "./node_modules/@cadl-lang/rest/lib/resource.cadl",
    resolvePath(root, "../../core/packages/rest/lib/resource.cadl")
  );
  await host.addRealJsFile(
    "./node_modules/@cadl-lang/rest/dist/src/rest.js",
    resolvePath(root, "../../core/packages/rest/dist/src/rest.js")
  );
  await host.addRealJsFile(
    "./node_modules/@cadl-lang/rest/dist/src/route.js",
    resolvePath(root, "../../core/packages/rest/dist/src/route.js")
  );
  await host.addRealJsFile(
    "./node_modules/@cadl-lang/rest/dist/src/http.js",
    resolvePath(root, "../../core/packages/rest/dist/src/http.js")
  );
  await host.addRealJsFile(
    "./node_modules/@cadl-lang/rest/dist/src/resource.js",
    resolvePath(root, "../../core/packages/rest/dist/src/resource.js")
  );

  // load openapi
  await host.addRealCadlFile(
    "./node_modules/@cadl-lang/openapi/package.json",
    resolvePath(root, "../../core/packages/openapi/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/@cadl-lang/openapi/dist/src/index.js",
    resolvePath(root, "../../core/packages/openapi/dist/src/index.js")
  );

  // load openapi
  await host.addRealCadlFile(
    "./node_modules/@azure-tools/cadl-autorest/package.json",
    resolvePath(root, "../cadl-autorest/package.json")
  );
  await host.addRealJsFile(
    "./node_modules/@azure-tools/cadl-autorest/dist/src/openapi.js",
    resolvePath(root, "../cadl-autorest/dist/src/openapi.js")
  );

  return host;
}

export async function CheckDiagnostics(code: string) {
  const host = await createRPaaSTestHost();
  const outPath = resolvePath("/openapi.json");
  host.addCadlFile(
    "./main.cadl",
    `import "@cadl-lang/rest"; import "@cadl-lang/openapi";import "@azure-tools/cadl-autorest"; import "@azure-tools/cadl-rpaas"; import "@azure-tools/cadl-rpaas-controller";${code}`
  );
  const result = await host.diagnose("./main.cadl", {
    noEmit: false,
    swaggerOutputFile: outPath,
    emitters: ["@azure-tools/cadl-autorest", "@azure-tools/cadl-rpaas-controller"],
  });
  return result;
}

export function getDiagnostic(code: keyof typeof libDef.diagnostics, diagnostics: Diagnostic[]) {
  return diagnostics.filter((diag) => diag.code === `${libDef.name}/${code}`);
}
