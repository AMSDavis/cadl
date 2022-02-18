import { resolvePath } from "@cadl-lang/compiler";
import { createTestHost, createTestWrapper } from "@cadl-lang/compiler/testing";
import { OpenAPITestLibrary } from "@cadl-lang/openapi/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { AutorestTestLibrary } from "../src/testing/index.js";

export async function createAutorestTestHost() {
  return createTestHost({
    libraries: [RestTestLibrary, OpenAPITestLibrary, AutorestTestLibrary],
  });
}

export async function createAutorestTestRunner() {
  const host = await createAutorestTestHost();
  return createTestWrapper(
    host,
    (code) =>
      `import "${RestTestLibrary.name}"; import "${OpenAPITestLibrary.name}"; import "${AutorestTestLibrary.name}"; using Cadl.Http;${code}`,
    {
      emitters: [AutorestTestLibrary.name],
    }
  );
}

export async function openApiFor(code: string) {
  const outPath = resolvePath("/openapi.json");
  const runner = await createAutorestTestRunner();
  await runner.compile(code, {
    noEmit: false,
    swaggerOutputFile: outPath,
  });
  return JSON.parse(runner.fs.get(outPath)!);
}

export async function oapiForModel(name: string, modelDef: string) {
  const oapi = await openApiFor(`
    ${modelDef};
    @route("/")
    namespace root {
      op read(): ${name};
    }
  `);

  const response = oapi.paths["/"].get.responses[200];
  const useSchema = response?.schema;

  return {
    isRef: !!useSchema?.$ref,
    useSchema,
    defs: oapi.definitions,
    response: response,
  };
}
