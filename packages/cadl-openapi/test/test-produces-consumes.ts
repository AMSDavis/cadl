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
    const result = await openApiForProducesConsumes([
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
    const result = await openApiForProducesConsumes([
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
  it("produces individual produces/consumes if differences in methods", async () => {
    const result = await openApiForProducesConsumes([
      {
        path: "/in",
        namespace: "input",
        type: "consumes",
        modelDef: `
        model simpleParam {
          @header "content-type": "application/json";
          name: string;
        }
        `,
        modelName: "simpleParam",
      },
      {
        path: "/out",
        namespace: "output",
        type: "produces",
        modelDef: `
        model simpleOutput {
          @header "content-type": "text/json";
          name: string;
        }
        `,
        modelName: "simpleOutput",
      },
    ]);

    strictEqual(result.globalConsumes[0], "application/json");
    strictEqual(result.operations.get("/in")?.produces, undefined);
    strictEqual(result.operations.get("/in")?.consumes, undefined);
    strictEqual(result.operations.get("/out")!.produces![0], "text/json");
    strictEqual(result.operations.get("/out")?.consumes, undefined);
  });
});

async function openApiForProducesConsumes(
  configuration: ProducesConsumesOperation[]
): Promise<ProducesConsumes> {
  const apiDoc: string[] = createAdlFromConfig(configuration);

  let input = apiDoc.join("\n");
  let openApi = await openApiFor(input);
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

function createAdlFromConfig(configuration: ProducesConsumesOperation[]): string[] {
  const apiDoc: string[] = [];
  configuration.forEach((config) => {
    let opString =
      config.type === "consumes"
        ? `@_delete op remove(@body payload : ${config.modelName}) : NoContentResponse;`
        : `@get op read() : ${config.modelName};`;
    let doc = `
    ${config.modelDef}
    @resource("${config.path}")
    namespace ${config.namespace} {
      ${opString}
    }
  `;
    apiDoc.push(doc);
  });

  return apiDoc;
}
