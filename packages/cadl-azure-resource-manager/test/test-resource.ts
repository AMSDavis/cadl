import { ok, strictEqual } from "assert";
import { ArmLifecycleOperationKind, ArmResourceDetails, getArmResources } from "../src/arm.js";
import { checkFor } from "./test-host.js";

function assertLifecycleOperation(
  resource: ArmResourceDetails,
  kind: ArmLifecycleOperationKind,
  operationGroup: string
) {
  ok(resource.operations.lifecycle[kind], `No ${kind} operation`);
  strictEqual(resource.operations.lifecycle[kind]!.kind, kind);
  strictEqual(resource.operations.lifecycle[kind]!.operationGroup, operationGroup);
}

describe("ARM resource model:", () => {
  it("gathers metadata about TrackedResources", async () => {
    const { program, diagnostics } = await checkFor(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2022-03-01-preview")
      namespace Microsoft.Test;

      using Cadl.Rest;
      using Azure.ResourceManager;

      model FooResourceProperties {
        iAmFoo: string;
      }

      model FooResource is TrackedResource<FooResourceProperties> {
        @key("fooName")
        @segment("foos")
        name: string;
      }

      interface Foos mixes ResourceOperations<FooResource, FooResourceProperties> {
      }
    `);

    const resources = getArmResources(program);
    strictEqual(diagnostics.length, 0);
    strictEqual(resources.length, 1);

    const foo = resources[0];
    strictEqual(foo.name, "FooResource");
    strictEqual(foo.kind, "Tracked");
    strictEqual(foo.collectionName, "foos");
    strictEqual(foo.keyName, "fooName");
    strictEqual(foo.armNamespace, "Microsoft.Test");

    // Check operations
    assertLifecycleOperation(foo, "read", "Foos");
    assertLifecycleOperation(foo, "createOrUpdate", "Foos");
    assertLifecycleOperation(foo, "update", "Foos");
    assertLifecycleOperation(foo, "delete", "Foos");
  });
});
