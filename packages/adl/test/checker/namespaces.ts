import { strictEqual, ok } from "assert";
import { ModelType, NamespaceType, Type } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("namespaces with blocks", () => {
  const blues = new WeakSet();
  function blue(_: any, target: Type) {
    blues.add(target);
  }

  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
    testHost.addJsFile("blue.js", { blue });
  });

  it("can be decorated", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      @blue @test namespace Z.Q;
      @blue @test namespace N { }
      @blue @test namespace X.Y { }
      `
    );
    const { N, Y, Q } = (await testHost.compile("./")) as {
      N: NamespaceType;
      Y: NamespaceType;
      Q: NamespaceType;
    };

    ok(blues.has(N), "N is blue");
    ok(blues.has(Y), "Y is blue");
    ok(blues.has(Q), "Q is blue");
  });

  it("merges like namespaces", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      @test
      namespace N { @test model X { x: string } }
      namespace N { @test model Y { y: string } }
      namespace N { @test model Z { ... X, ... Y } }
      `
    );
    const { N, X, Y, Z } = (await testHost.compile("./")) as {
      N: NamespaceType;
      X: ModelType;
      Y: ModelType;
      Z: ModelType;
    };
    strictEqual(X.namespace, N);
    strictEqual(Y.namespace, N);
    strictEqual(Z.namespace, N);
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges like namespaces across files", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      @test
      namespace N { @test model X { x: string } }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      namespace N { @test model Y { y: int32 } }
      `
    );
    testHost.addAdlFile(
      "c.adl",
      `
      namespace N { @test model Z { ... X, ... Y } }
      `
    );
    const { N, X, Y, Z } = (await testHost.compile("./")) as {
      N: NamespaceType;
      X: ModelType;
      Y: ModelType;
      Z: ModelType;
    };
    strictEqual(X.namespace, N, "X namespace");
    strictEqual(Y.namespace, N, "Y namespace");
    strictEqual(Z.namespace, N, "Z namespace");
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges sub-namespaces across files", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N { namespace M { model X { x: string } } }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      namespace N { namespace M { model Y { y: int32 } } }
      `
    );
    testHost.addAdlFile(
      "c.adl",
      `
      namespace N { @test model Z { ... M.X, ... M.Y } }
      `
    );

    const { Z } = (await testHost.compile("./")) as {
      Z: ModelType;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("can see things in outer scope same file", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      model A { }
      namespace N { model B extends A { } }
      `
    );
    await testHost.compile("./");
  });

  it("can see things in outer scope cross file", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      model A { }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      model B extends A { }
      `
    );
    testHost.addAdlFile(
      "c.adl",
      `
      model C { }
      namespace foo {
        op foo(a: A, b: B): C;
      }
      `
    );
    await testHost.compile("./");
  })
});

describe("blockless namespaces", () => {
  const blues = new WeakSet();
  function blue(_: any, target: Type) {
    blues.add(target);
  }

  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
    testHost.addJsFile("blue.js", { blue });
  });

  it("merges properly with other namespaces", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N;
      model X { x: int32 }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      namespace N;
      model Y { y: int32 }
      `
    );
    testHost.addAdlFile(
      "c.adl",
      `
      @test model Z { ... N.X, ... N.Y }
      `
    );
    const { Z } = (await testHost.compile("./")) as {
      Z: ModelType;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("does lookup correctly", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace Repro;
      model Yo {
      }
      model Hey {
        wat: Yo;
      }
      `
    );
    try {
      await testHost.compile("./");
    } catch (e) {
      console.log(e.diagnostics);
      throw e;
    }
  });

  it("does lookup correctly with nested namespaces", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace Repro;
      model Yo {
      }
      model Hey {
        wat: Yo;
      }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      namespace Repro.Uhoh;
      model SayYo {
        yo: Hey;
        wat: Yo;
      }
      `
    );
    try {
      await testHost.compile("./");
    } catch (e) {
      console.log(e.diagnostics);
      throw e;
    }
  });

  it("binds correctly", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N.M;
      model A { }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      model X { a: N.M.A }
      `
    );
    try {
      await testHost.compile("/");
    } catch (e) {
      console.log(e.diagnostics);
      throw e;
    }
  });

  it("works with blockful namespaces", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      @test
      namespace N;

      @test
      namespace M {
        model A { }
      }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      model X { a: N.M.A }
      `
    );
    const { N, M } = (await testHost.compile("/")) as {
      N: NamespaceType;
      M: NamespaceType;
    };

    ok(M.namespace);
    strictEqual(M.namespace, N);
  });

  it("works with nested blockless and blockfull namespaces", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      @test
      namespace N.M;

      @test
      namespace O {
        model A { }
      }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      model X { a: N.M.O.A }
      `
    );
    const { M, O } = (await testHost.compile("/")) as {
      M: NamespaceType;
      O: NamespaceType;
    };

    ok(M.namespace);
    ok(O.namespace);
    strictEqual(O.namespace, M);
  });
});
