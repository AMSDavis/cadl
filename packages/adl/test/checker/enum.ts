import { ok, strictEqual } from "assert";
import { EnumMemberType, EnumType, ModelType } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("enums", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can be valueless", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      @test enum E {
        A, B, C
      }
      `
    );

    const { E } = (await testHost.compile("./")) as {
      E: EnumType;
    };

    ok(E);
    ok(!E.members[0].value);
    ok(!E.members[1].value);
    ok(!E.members[2].value);
  });

  it("can have values", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      @test enum E {
        @test("A") A: "a";
        @test("B") B: "b";
        @test("C") C: "c";
      }
      `
    );

    const { E, A, B, C } = (await testHost.compile("./")) as {
      E: EnumType;
      A: EnumMemberType;
      B: EnumMemberType;
      C: EnumMemberType;
    };

    ok(E);
    strictEqual(A.value, "a");
    strictEqual(B.value, "b");
    strictEqual(C.value, "c");
  });

  it("can be a model property", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace Foo;
      enum E { A, B, C }
      @test model Foo {
        prop: E;
      }
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: ModelType;
    };

    ok(Foo);
    strictEqual(Foo.properties.get("prop")!.type.kind, "Enum");
  });
});
