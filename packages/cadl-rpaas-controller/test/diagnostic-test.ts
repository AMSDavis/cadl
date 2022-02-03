import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { createRPaasControllerTestRunner } from "./test-host.js";

describe("Test identifier validation in service code emitter", async () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createRPaasControllerTestRunner();
  });
  it("Detects invalid identifiers in model names", async () => {
    const result = await runner.diagnose(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
      
      using Azure.ARM;
      using Cadl.Http;

      @doc("Foo is life")
      @armResource({
        path: "Foo",
        collectionName: "FooStore",
        parameterType: FooParameter,
        standardOperations: ["create","delete"]
      })
      model Foo is TrackedResource<Foo$Properties> { };
      
      @doc("Path parameter for foo")
      model FooParameter {
        @doc("foo name")
        @path name: string
      }

      @doc("The status of the current operation.")
      enum ProvisioningState {
        Succeeded, Failed, Canceled, Provisioning, Updating, Deleting, Accepted
      }
      
      @doc("The properties of foo")
      model Foo$Properties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
      }
      
    `);
    expectDiagnostics(result, [
      { code: "@azure-tools/cadl-rpaas-controller/invalid-identifier" },
      { code: "@azure-tools/cadl-rpaas-controller/invalid-identifier" },
    ]);
  });

  it("Detects invalid identifiers in enum names", async () => {
    const result = await runner.diagnose(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
      
      using Azure.ARM;
      using Cadl.Http;

      @doc("Foo is the word")
      @armResource({
        path: "Foo",
        collectionName: "FooStore",
        parameterType: FooParameter,
        standardOperations: ["create","delete"]
      })
      model Foo is TrackedResource<FooProperties> { };
      
      @doc("Path parameter for foo")
      model FooParameter {
        @doc("foo name")
        @path name: string
      }

      @doc("The status of the current operation.")
      enum Provisioning$State {
        Succeeded, Failed, Canceled, Provisioning, Updating, Deleting, Accepted
      }

      @doc("The properties of foo")
      model FooProperties {
        @doc("The status of the last operation.")
        provisioningState?: Provisioning$State;
      }
      
    `);
    expectDiagnostics(result, { code: "@azure-tools/cadl-rpaas-controller/invalid-identifier" });
  });

  it("Detects invalid identifiers in property names", async () => {
    const result = await runner.diagnose(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
      
      using Azure.ARM;
      using Cadl.Http;

      @doc("Foo is the resource")
      @armResource({
        path: "Foo",
        collectionName: "FooStore",
        parameterType: FooParameter,
        standardOperations: ["create","delete"]
      })
      model Foo is TrackedResource<FooProperties> { };
      
      @doc("Path parameter for foo")
      model FooParameter {
        @doc("foo name")
        @path name: string
      }

      @doc("The status of the current operation.")
      enum ProvisioningState {
        Succeeded, Failed, Canceled, Provisioning, Updating, Deleting, Accepted
      }
      
      @doc("The properties of foo")
      model FooProperties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
        @doc("Another proeprty")
        other$Property: string;
      }
      
    `);
    expectDiagnostics(result, { code: "@azure-tools/cadl-rpaas-controller/invalid-identifier" });
  });

  it("Detects invalid identifiers in enum values", async () => {
    const result = await runner.diagnose(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
      
      using Azure.ARM;
      using Cadl.Http;

      @doc("Foo is the name of this resource")
      @armResource({
        path: "Foo",
        collectionName: "FooStore",
        parameterType: FooParameter,
        standardOperations: ["create","delete"]
      })
      model Foo is TrackedResource<FooProperties> { };
      
      @doc("Path parameter for foo")
      model FooParameter {
        @doc("foo name")
        @path name: string
      }

      @doc("The status of the current operation.")
      enum ProvisioningState {
        Succeeded, Failed, Canceled, Provisioning, "Updating, Updated", Deleting, Accepted
      }
      
      @doc("The properties of a foo resource.")
      model FooProperties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
      }
      
    `);
    expectDiagnostics(result, { code: "@azure-tools/cadl-rpaas-controller/invalid-identifier" });
  });
});
