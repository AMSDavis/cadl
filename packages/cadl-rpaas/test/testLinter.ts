import { strictEqual } from "assert";
import { CheckFor, getDiagnostic } from "./testHost.js";

describe("test linter rules", () => {
  it("no documentation", async () => {
    const result = await CheckFor(`
      using Cadl.Http;
      model Foo {
        x:string
      }
      @doc(" fooParameter")
      model FooParameter {
        @doc("parameter")
        @path name: string
      }
      @route("/")
      @doc("root")
      namespace root {
        op read(...FooParameter): OkResponse<Foo>;
      }
    `);
    strictEqual(getDiagnostic("model-requires-documentation", [...result]).length, 1);
    strictEqual(getDiagnostic("documentation-different-with-node-name", [...result]).length, 2);
    strictEqual(getDiagnostic("operation-requires-documentation", [...result]).length, 1);
    strictEqual(getDiagnostic("property-requires-documentation", [...result]).length, 1);
  });

  it("inline model in return types", async () => {
    const result = await CheckFor(`
      using Cadl.Http;
      @doc("Foo ")
      model Foo {
        x:string
      }
      model FooParameter {
        @doc("parameter")
        @body
        name: string
      }
      @route("/")
      namespace root {
        @doc("read foo")
        op read(...FooParameter): OkResponse<{ ... Foo}>;
      }
    `);
    const inlineModelErrors = getDiagnostic("no-inline-model", [...result]);
    strictEqual(inlineModelErrors.length, 1);
  });

  it("inline model in model property", async () => {
    const result = await CheckFor(`
      @doc("Foo ")
      model Foo {
        x:string
      }
      model FooParameter {
        @doc("parameter")
        @body
        name: {
          x:string
        }
      }
      @route("/")
      namespace root {
        @doc("read foo")
        op read(...FooParameter): OkResponse<Foo>;
      }
    `);
    const inlineModelErrors = getDiagnostic("no-inline-model", [...result]);
    strictEqual(inlineModelErrors.length, 1);
  });

  it("repeated properties", async () => {
    const result = await CheckFor(`
      @armNamespace
      @serviceTitle("Microsoft.PetStore")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.PetStore;
      
      using Azure.ARM;
      using Cadl.Http;

      @doc("Pet ")
      model Pet extends TrackedResource<PetProperties> { };
      
      model PetProperties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
        @doc("The repeated property.")
        name:string;
      }
    `);
    const errors = getDiagnostic("no-repeated-property-inside-the-properties", [...result]);
    strictEqual(errors.length, 1);
  });

  it("contain disallowed top level properties", async () => {
    const result = await CheckFor(`
      @armNamespace
      @serviceTitle("Microsoft.PetStore")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.PetStore;
      
      using Azure.ARM;
      using Cadl.Http;

      model Pet is TrackedResource<PetProperties> { 
        status: string; // this is not allowed
      };
     
      model PetProperties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
      }
    `);
    const errors = getDiagnostic("resource-top-level-properties", [...result]);
    strictEqual(errors.length, 1);
  });

  it("resource extends ArmResource directly", async () => {
    const result = await CheckFor(`
      @armNamespace
      @serviceTitle("Microsoft.PetStore")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.PetStore;
      
      using Azure.ARM;
      using Cadl.Http;

     // extends ArmResource Directly
      model Pet extends ArmResource {
        properties: PetProperties
      };
      model PetProperties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
      }
    `);
    const errors = getDiagnostic("resource-extends-base-models", [...result]);
    strictEqual(errors.length, 1);
  });
});
