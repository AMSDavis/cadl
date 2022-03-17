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
      
      using Azure.ResourceManager;
      using Cadl.Http;
      using Cadl.Rest;

      @doc("Foo is life")
      model Foo is TrackedResource<Foo$Properties> {
        @key("fooName")
        @doc("foo name")
        @segment("Foo")
        name: string;
      }

      interface FooStore mixes ResourceCreate<Foo>, ResourceDelete<Foo> {}

      @doc("The status of the current operation.")
      @knownValues(ProvisioningStateKV)
      model ProvisioningState is string {}
      enum ProvisioningStateKV {
        Succeeded, Failed, Canceled, Provisioning, Updating, Deleting, Accepted
      }
      
      @doc("The properties of foo")
      model Foo$Properties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
      }
      
    `);
    expectDiagnostics(result, [
      { code: "@azure-tools/cadl-providerhub-controller/invalid-identifier" },
    ]);
  });

  it("Detects invalid identifiers in enum names", async () => {
    const result = await runner.diagnose(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
      
      using Azure.ResourceManager;
      using Cadl.Http;
      using Cadl.Rest;

      @doc("Foo is the word")
      model Foo is TrackedResource<FooProperties> {
        @key("fooName")
        @doc("foo name")
        @segment("Foo")
        name: string;
      }

      interface FooStore mixes ResourceCreate<Foo>, ResourceDelete<Foo> {}

      @doc("The status of the current operation.")
      @knownValues(ProvisioningStateKV)
      model ProvisioningState is string {}
      enum ProvisioningStateKV {
        Succeeded, Failed, Canceled, Provisioning, Updating, Deleting, Accepted
      }

      @doc("Invalid enum.")
      enum Invalid$Enum {one, two}

      @doc("The properties of foo")
      model FooProperties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;

        @doc("Invalid enum prop")
        invalidEnum: Invalid$Enum;
      }
      
    `);
    expectDiagnostics(result, {
      code: "@azure-tools/cadl-providerhub-controller/invalid-identifier",
    });
  });

  it("Detects invalid identifiers in property names", async () => {
    const result = await runner.diagnose(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
      
      using Azure.ResourceManager;
      using Cadl.Http;
      using Cadl.Rest;

      @doc("Foo is the resource")
      model Foo is TrackedResource<FooProperties> {
        @key("fooName")
        @doc("foo name")
        @segment("Foo")
        name: string;
      }

      interface FooStore mixes ResourceCreate<Foo>, ResourceDelete<Foo> {}

      @doc("The status of the current operation.")
      @knownValues(ProvisioningStateKV)
      model ProvisioningState is string {}
      enum ProvisioningStateKV {
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
    expectDiagnostics(result, {
      code: "@azure-tools/cadl-providerhub-controller/invalid-identifier",
    });
  });

  it("Detects invalid identifiers in enum values", async () => {
    const result = await runner.diagnose(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
      
      using Azure.ResourceManager;
      using Cadl.Http;
      using Cadl.Rest;

      @doc("Foo is the name of this resource")
      model Foo is TrackedResource<FooProperties> {
        @key("fooName")
        @doc("foo name")
        @segment("Foo")
        name: string;
      }

      interface FooStore mixes ResourceCreate<Foo>, ResourceDelete<Foo> {}

      @doc("The status of the current operation.")
      @knownValues(ProvisioningStateKV)
      model ProvisioningState is string {}
      enum ProvisioningStateKV {
        Succeeded, Failed, Canceled, Provisioning, "Updating, Updated", Deleting, Accepted
      }
      
      @doc("The properties of a foo resource.")
      model FooProperties {
        @doc("The status of the last operation.")
        provisioningState?: ProvisioningState;
      }
      
    `);
    expectDiagnostics(result, {
      code: "@azure-tools/cadl-providerhub-controller/invalid-identifier",
    });
  });
});
