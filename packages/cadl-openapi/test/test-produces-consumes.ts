import { strictEqual } from "assert";
import { openApiFor } from "./testHost.js";

interface ProducesConsumes {
  globalProduces: string[];
  globalConsumes: string[];
  operations: Map<string, OperationResult>;
}

interface ProducesConsumesOperation {
  path: string;
  namespace: string;
  type: "produces" | "consumes";
  modelDef: string;
  modelName: string;
}

interface OperationResult {
  path: string;
  produces?: string[];
  consumes?: string[];
}

describe("openapi: produces/consumes", () => {
  it("produces global produces for simple json", async () => {
    var result = await openApiForProducesConsumes([
      {
        path: "/",
        namespace: "root",
        type: "produces",
        modelDef: `
        model simple {
          name: string;
        }
        `,
        modelName: "simple",
      },
    ]);

    strictEqual(result.globalProduces[0], "application/json");
    strictEqual(result.operations.get("/")?.produces, undefined);
    strictEqual(result.operations.get("/")?.consumes, undefined);
  });
  it("produces global consumes for simple json", async () => {
    var result = await openApiForProducesConsumes([
      {
        path: "/",
        namespace: "root",
        type: "consumes",
        modelDef: `
        model simple {
          name: string;
        }
        `,
        modelName: "simple",
      },
    ]);

    strictEqual(result.globalConsumes[0], "application/json");
    strictEqual(result.operations.get("/")?.produces, undefined);
    strictEqual(result.operations.get("/")?.consumes, undefined);
  });
});

async function openApiForProducesConsumes(
  configuration: ProducesConsumesOperation[]
): Promise<ProducesConsumes> {
  const apiDoc: string[] = [];
  configuration.forEach((config) => {
    let opString =
      config.type === "consumes"
        ? `@_delete op remove(@body payload : ${config.modelName}) : NoContentResponse;`
        : `@get op read() : ${config.modelName};`;
    apiDoc.push(`
    ${config.modelDef}
    @resource("${config.path}")
    namespace ${config.namespace} {
      ${opString}
    }
  `);
  });

  const openApi = await openApiFor(apiDoc.join("\n"));
  const output = {
    globalProduces: openApi.produces as string[],
    globalConsumes: openApi.consumes,
    operations: new Map<string, OperationResult>(),
  };

  configuration.forEach((config) => {
    let opName = config.type === "consumes" ? "delete" : "get";
    let opPath = openApi.paths[config.path];
    output.operations.set(config.path, {
      path: config.path,
      produces: opPath[opName].produces,
      consumes: opPath[opName].consumes,
    });
  });

  return output;
}
