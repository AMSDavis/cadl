import { Diagnostic } from "@cadl-lang/compiler";
import { strictEqual } from "assert";
import { resolve } from "path";
import { Messages } from "../src/checker.js";
import { createOpenAPITestHost } from "./testHost.js";

describe("check rules", () => {
  it("no documentation", async () => {
    const result = await CheckFor(`
      model Foo {
        x:string
      }
      model FooParameter {
        @doc("parameter")
        @path name: string
      }
      @resource("/")
      namespace root {
        op read(...FooParameter): OkResponse<Foo>;
      }
    `);
    strictEqual(getDiagnostic(Messages.ModelDocumentation.code, [...result]).length, 2);
    strictEqual(getDiagnostic(Messages.OperationDocumentation.code, [...result]).length, 1);
  });

  it("inline model", async () => {
    const result = await CheckFor(`
      @doc("Foo ")
      model Foo {
        x:string
      }
      @body
      model FooParameter {
        @doc("parameter")
        name: string
      }
      @resource("/")
      namespace root {
        @doc("read foo")
        op read({...FooParameter}): OkResponse<{ ... Foo}>;
      }
    `);
    const inlineModelErrors = getDiagnostic(Messages.NoInlineModel.code, [...result]);
    strictEqual(inlineModelErrors.length, 2);
  });
});

export async function CheckFor(code: string) {
  const host = await createOpenAPITestHost();
  const outPath = resolve("/openapi.json");
  host.addCadlFile("./main.cadl", `import "rest"; import "cadl-autorest";${code}`);
  const result = await host.diagnose("./main.cadl", {
    noEmit: false,
    swaggerOutputFile: outPath,
    onBuildCheck: true,
  });
  return result;
}

function getDiagnostic(code: string, diagnostics: Diagnostic[]) {
  return diagnostics.filter((diag) => diag.code === code);
}
