import { strictEqual } from "assert";
import { CheckFor, getDiagnostic } from "./testHost.js";

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
    strictEqual(getDiagnostic("model-requires-documentation", [...result]).length, 2);
    strictEqual(getDiagnostic("operation-requires-documentation", [...result]).length, 1);
  });

  it("inline model", async () => {
    const result = await CheckFor(`
      @doc("Foo ")
      model Foo {
        x:string
      }
      model FooParameter {
        @doc("parameter")
        @body
        name: string
      }
      @resource("/")
      namespace root {
        @doc("read foo")
        op read(...FooParameter): OkResponse<{ ... Foo}>;
      }
    `);
    const inlineModelErrors = getDiagnostic("no-inline-model", [...result]);
    strictEqual(inlineModelErrors.length, 1);
  });
});
