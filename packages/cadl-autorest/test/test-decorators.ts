import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { strictEqual } from "assert";
import { getPageable, getRef } from "../src/openapi.js";
import { createAutorestTestRunner } from "./test-host.js";

describe("cadl: autorest - decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createAutorestTestRunner();
  });

  describe("@pageable", () => {
    it("emit diagnostic if use on non operation", async () => {
      const diagnostics = await runner.diagnose(`
        @pageable("foo")
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @pageable decorator to Model",
      });
    });

    it("emit diagnostic if nextLinkName is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @pageable(123)
        op foo(): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'number' is not assignable to parameter of type 'string'",
      });
    });

    it("set the pageable next link name on operation", async () => {
      const { foo } = await runner.compile(`
        @test @pageable("customNextLink")
        op foo(): string;
      `);

      strictEqual(getPageable(runner.program, foo), "customNextLink");
    });

    it("default next link name to 'nextLink'", async () => {
      const { foo } = await runner.compile(`
        @test @pageable
        op foo(): string;
      `);

      strictEqual(getPageable(runner.program, foo), "nextLink");
    });
  });

  describe("@useRef", () => {
    it("emit diagnostic if use on non model or property", async () => {
      const diagnostics = await runner.diagnose(`
        @useRef("foo")
        op foo(): string;
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @useRef decorator to Operation",
      });
    });

    it("emit diagnostic if ref is not a string", async () => {
      const diagnostics = await runner.diagnose(`
        @useRef(123)
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'number' is not assignable to parameter of type 'string'",
      });
    });

    it("emit diagnostic if ref is not passed", async () => {
      const diagnostics = await runner.diagnose(`
        @useRef
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '' of type 'undefined' is not assignable to parameter of type 'string'",
      });
    });

    it("set external reference", async () => {
      const { Foo } = await runner.compile(`
        @test @useRef("../common.json#/definitions/Foo")
        model Foo {}
      `);

      strictEqual(getRef(runner.program, Foo), "../common.json#/definitions/Foo");
    });
  });
});
