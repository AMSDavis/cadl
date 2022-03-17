import { AutorestTestLibrary } from "@azure-tools/cadl-autorest/testing";
import { AzureCoreTestLibrary } from "@azure-tools/cadl-azure-core/testing";
import { Diagnostic, Program, resolvePath } from "@cadl-lang/compiler";
import { createTestHost, createTestWrapper } from "@cadl-lang/compiler/testing";
import { OpenAPITestLibrary } from "@cadl-lang/openapi/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { libDef } from "../src/lib.js";
import { AzureResourceManagerTestLibrary } from "../src/testing/index.js";

export async function createAzureResourceManagerTestHost() {
  return createTestHost({
    libraries: [
      RestTestLibrary,
      OpenAPITestLibrary,
      AutorestTestLibrary,
      AzureCoreTestLibrary,
      AzureResourceManagerTestLibrary,
    ],
  });
}

export async function createAzureResourceManagerTestRunner() {
  const host = await createAzureResourceManagerTestHost();
  return createTestWrapper(
    host,
    (code) =>
      `import "${RestTestLibrary.name}"; import "${AutorestTestLibrary.name}"; import "${AzureCoreTestLibrary.name}"; import "${AzureResourceManagerTestLibrary.name}"; ${code}`,
    {
      emitters: [AutorestTestLibrary.name],
    }
  );
}

export async function openApiFor(code: string) {
  const runner = await createAzureResourceManagerTestRunner();
  const outPath = resolvePath("/openapi.json");
  await runner.compile(code, {
    swaggerOutputFile: outPath,
  });
  return JSON.parse(runner.fs.get(outPath)!);
}

export async function checkFor(
  code: string
): Promise<{ program: Program; diagnostics: readonly Diagnostic[] }> {
  const runner = await createAzureResourceManagerTestRunner();
  const diagnostics = await runner.diagnose(code);
  return { program: runner.program, diagnostics };
}

export function getDiagnostic(code: keyof typeof libDef.diagnostics, diagnostics: Diagnostic[]) {
  return diagnostics.filter((diag) => diag.code === `${libDef.name}/${code}`);
}
