import { AutorestTestLibrary } from "@azure-tools/cadl-autorest/testing";
import { Diagnostic, resolvePath } from "@cadl-lang/compiler";
import { createTestHost, createTestWrapper } from "@cadl-lang/compiler/testing";
import { OpenAPITestLibrary } from "@cadl-lang/openapi/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { libDef } from "../src/lib.js";
import { AzureCoreTestLibrary } from "../src/testing/index.js";

export async function createAzureCoreTestHost() {
  return createTestHost({
    libraries: [RestTestLibrary, OpenAPITestLibrary, AutorestTestLibrary, AzureCoreTestLibrary],
  });
}

export async function createAzureCoreTestRunner() {
  const host = await createAzureCoreTestHost();
  return createTestWrapper(
    host,
    (code) => `import "${RestTestLibrary.name}"; import "${AutorestTestLibrary.name}"; ${code}`,
    {
      emitters: [AutorestTestLibrary.name],
    }
  );
}

export async function openApiFor(code: string) {
  const runner = await createAzureCoreTestHost();
  const outPath = resolvePath("/openapi.json");
  await runner.compile(code, {
    swaggerOutputFile: outPath,
  });
  return JSON.parse(runner.fs.get(outPath)!);
}

export async function checkFor(code: string) {
  const runner = await createAzureCoreTestHost();
  return await runner.diagnose(code);
}

export function getDiagnostic(code: keyof typeof libDef.diagnostics, diagnostics: Diagnostic[]) {
  return diagnostics.filter((diag) => diag.code === `${libDef.name}/${code}`);
}
