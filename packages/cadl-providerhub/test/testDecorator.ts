import { strictEqual } from "assert";
import { checkFor, getDiagnostic } from "./test-host.js";

describe("test linter rules in decorator", () => {
  it("operation name check", async () => {
    const result = await checkFor(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
      
      using Azure.ARM;
      using Cadl.Http;

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
        name: string
      }
      @doc("The status of the current operation.")
      @knownValues(ProvisioningStateKV)
      model ProvisioningState is string {}
      enum ProvisioningStateKV {
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

  it("resource not extends ProxyResourceBase, TrackedResourceBase", async () => {
    const result = await checkFor(`
      @armNamespace
      @serviceTitle("Microsoft.PetStore")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.PetStore;
      
      using Azure.ARM;
      using Cadl.Http;

      @doc("Pet ")
      @armResource({
        path: "Pet",
        collectionName: "PetStore",
        parameterType: PetParameter,
        standardOperations: ["create","delete"]
      })
      model Pet {
        ...TrackedResourceBase
        properties: PetProperties
      };
      
      model PetParameter {
        @doc("pet name")
        name: string
      }
      @doc("The status of the current operation.")
      @knownValues(ProvisioningStateKV)
      model ProvisioningState is string {}
      enum ProvisioningStateKV {
        Succeeded, Failed, Canceled, Provisioning, Updating, Deleting, Accepted
      } 
      model PetProperties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
      }
    `);
    const errors = getDiagnostic("resource-extends-base-models", [...result]);
    strictEqual(errors.length, 1);
  });
});
