import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { getPageable, getRef } from "../src/openapi.js";
import { createAutorestTestRunner, openApiFor } from "./test-host.js";

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

  describe("@example", () => {
    it("applies @example on operation", async () => {
      const diagnostics = await runner.diagnose(
        `
        model A {
          @example("./someExample.json", "Some example")
          name: string;
        }
        `
      );

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @example decorator to ModelProperty",
      });
    });

    it("adds an example to an operation", async () => {
      const openapi = await openApiFor(
        `
        model Pet {
          name: string;
        }

        @get
        @operationId("Pets_Get")
        @example("./getPet.json", "Get a pet")
        op read(): Pet;
        `
      );

      deepStrictEqual(openapi.paths["/"].get["x-ms-examples"], {
        "Get a pet": {
          $ref: "./getPet.json",
        },
      });
    });

    it("adds multiple examples to an operation", async () => {
      const openapi = await openApiFor(
        `
        model Pet {
          name: string;
        }

        @get
        @operationId("Pets_Get")
        @example("./getPet.json", "Get a pet")
        @example("./getAnotherPet.json", "Get another pet")
        op read(): Pet;
        `
      );

      deepStrictEqual(openapi.paths["/"].get["x-ms-examples"], {
        "Get a pet": {
          $ref: "./getPet.json",
        },
        "Get another pet": {
          $ref: "./getAnotherPet.json",
        },
      });
    });

    it("duplicate @example pathOrUri on operation", async () => {
      const runner = await createAutorestTestRunner();
      const diagnostics = await runner.diagnose(
        `
        model Pet {
          name: string;
        }

        @get
        @operationId("Pets_Get")
        @example("./getPet.json", "Get a pet")
        @example("./getPet.json", "Get another pet")
        op read(): Pet;
        `
      );

      expectDiagnostics(diagnostics, {
        code: "@azure-tools/cadl-autorest/duplicate-example",
        message: "Duplicate @example declarations on operation",
      });
    });

    it("duplicate @example title on operation", async () => {
      const runner = await createAutorestTestRunner();
      const diagnostics = await runner.diagnose(
        `
        model Pet {
          name: string;
        }

        @get
        @operationId("Pets_Get")
        @example("./getPet.json", "Get a pet")
        @example("./getAnotherPet.json", "Get a pet")
        op read(): Pet;
        `
      );

      expectDiagnostics(diagnostics, {
        code: "@azure-tools/cadl-autorest/duplicate-example",
        message: "Duplicate @example declarations on operation",
      });
    });
  });
});
