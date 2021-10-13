import { strictEqual } from "assert";
import { CheckFor, getDiagnostic } from "./testHost.js";

describe("check rules", () => {
  it("operation name check", async () => {
    const result = await CheckFor(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
      
      using Azure.ARM;

      @doc("Foo ")
      @armListBy(FooParameter,"List_ByFoo")
      @armResource({
        path: "Foo",
        collectionName: "FooStore",
        parameterType: FooParameter,
        standardOperations: ["create","delete"]
      })
      model Foo extends TrackedResource<FooProperties> { };
      
      model FooParameter {
        @doc("foo name")
        @body
        name: string
      }
      @doc("The status of the current operation.")
      enum ProvisioningState {
        Succeeded, Failed, Canceled, Provisioning, Updating, Deleting, Accepted
      } 
      model FooProperties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
      }
      
    `);
    let violations = getDiagnostic("no-underscore-in-operation-name", [...result]);
    strictEqual(violations.length, 1);
    violations = getDiagnostic("no-repeated-resource-in-operation", [...result]);
    strictEqual(violations.length, 1);
  });
});
