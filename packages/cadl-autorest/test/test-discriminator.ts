import { ModelType, ModelTypeProperty } from "@cadl-lang/compiler";
import { deepStrictEqual, match, ok, strictEqual } from "assert";
import { createOpenAPITestHost, openApiFor } from "./testHost.js";

describe("autorest: discriminated unions", () => {
  it("defines unions with discriminators", async () => {
    const openApi = await openApiFor(`
      @discriminator("kind")
      model Pet { }
      model Cat extends Pet {
        kind: "cat";
        meow: int32;
      }
      model Dog extends Pet {
        kind: "dog";
        bark: string;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.definitions.Pet, "expected definition named Pet");
    ok(openApi.definitions.Cat, "expected definition named Cat");
    ok(openApi.definitions.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].schema, {
      $ref: "#/definitions/Pet",
    });
    deepStrictEqual(openApi.definitions.Pet, {
      type: "object",
      properties: { kind: { type: "string" } },
      required: ["kind"],
      discriminator: "kind",
    });
    deepStrictEqual(openApi.definitions.Cat.allOf, [{ $ref: "#/definitions/Pet" }]);
    deepStrictEqual(openApi.definitions.Dog.allOf, [{ $ref: "#/definitions/Pet" }]);
  });

  it("defines discriminated unions with non-empty base type", async () => {
    const openApi = await openApiFor(`
      @discriminator("kind")
      model Pet {
        name: string;
        weight?: float32;
      }
      model Cat extends Pet {
        kind: "cat";
        meow: int32;
      }
      model Dog extends Pet {
        kind: "dog";
        bark: string;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.definitions.Pet, "expected definition named Pet");
    ok(openApi.definitions.Cat, "expected definition named Cat");
    ok(openApi.definitions.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].schema, {
      $ref: "#/definitions/Pet",
    });
    deepStrictEqual(openApi.definitions.Pet, {
      type: "object",
      properties: {
        kind: { type: "string" },
        name: { type: "string" },
        weight: { type: "number", format: "float" },
      },
      required: ["kind", "name"],
      discriminator: "kind",
    });
    deepStrictEqual(openApi.definitions.Cat.allOf, [{ $ref: "#/definitions/Pet" }]);
    deepStrictEqual(openApi.definitions.Dog.allOf, [{ $ref: "#/definitions/Pet" }]);
  });

  it("defines discriminated unions with discriminator property in base type", async () => {
    const openApi = await openApiFor(`
      @discriminator("kind")
      model Pet {
        kind: "cat" | "dog";
        name: string;
      }
      #suppress "@azure-tools/cadl-autorest/discriminator-value" "need to do this"
      model Cat extends Pet {
        meow: int32;
      }
      #suppress "@azure-tools/cadl-autorest/discriminator-value" "need to do this"
      model Dog extends Pet {
        bark: string;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.definitions.Pet, "expected definition named Pet");
    ok(openApi.definitions.Cat, "expected definition named Cat");
    ok(openApi.definitions.Dog, "expected definition named Dog");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].schema, {
      $ref: "#/definitions/Pet",
    });
    deepStrictEqual(openApi.definitions.Pet, {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["cat", "dog"], "x-cadl-name": "cat | dog" },
        name: { type: "string" },
      },
      required: ["kind", "name"],
      discriminator: "kind",
    });
    deepStrictEqual(openApi.definitions.Cat.allOf, [{ $ref: "#/definitions/Pet" }]);
    deepStrictEqual(openApi.definitions.Dog.allOf, [{ $ref: "#/definitions/Pet" }]);
  });

  it("defines discriminated unions with more than one level of inheritance", async () => {
    const openApi = await openApiFor(`
      @discriminator("kind")
      model Pet {
        name: string;
        weight?: float32;
      }
      model Cat extends Pet {
        kind: "cat";
        meow: int32;
      }
      model Dog extends Pet {
        kind: "dog";
        bark: string;
      }
      model Beagle extends Dog {
        purebred: boolean;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.definitions.Pet, "expected definition named Pet");
    ok(openApi.definitions.Cat, "expected definition named Cat");
    ok(openApi.definitions.Dog, "expected definition named Dog");
    // Child models are not pushed out to the emitter if they are not actually referenced in the API.
    // This is orthogonal to support for discriminators so I'm leaving it alone.
    // ok(openApi.definitions.Beagle, "expected definition named Beagle");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].schema, {
      $ref: "#/definitions/Pet",
    });
    deepStrictEqual(openApi.definitions.Pet, {
      type: "object",
      properties: {
        kind: { type: "string" },
        name: { type: "string" },
        weight: { type: "number", format: "float" },
      },
      required: ["kind", "name"],
      discriminator: "kind",
    });
    deepStrictEqual(openApi.definitions.Cat.allOf, [{ $ref: "#/definitions/Pet" }]);
    deepStrictEqual(openApi.definitions.Dog.allOf, [{ $ref: "#/definitions/Pet" }]);
  });

  it("defines nested discriminated unions", async () => {
    const openApi = await openApiFor(`
      @discriminator("kind")
      model Pet {
        name: string;
        weight?: float32;
      }
      model Cat extends Pet {
        kind: "cat";
        meow: int32;
      }
      @discriminator("breed")
      model Dog extends Pet {
        kind: "dog";
        bark: string;
      }
      #suppress "@cadl-lang/openapi3/discriminator-value" "kind defined in parent"
      model Beagle extends Dog {
        breed: "beagle";
      }
      #suppress "@cadl-lang/openapi3/discriminator-value" "kind defined in parent"
      model Poodle extends Dog {
        breed: "poodle";
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.definitions.Pet, "expected definition named Pet");
    ok(openApi.definitions.Cat, "expected definition named Cat");
    ok(openApi.definitions.Dog, "expected definition named Dog");
    ok(openApi.definitions.Beagle, "expected definition named Beagle");
    ok(openApi.definitions.Poodle, "expected definition named Poodle");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].schema, {
      $ref: "#/definitions/Pet",
    });
    deepStrictEqual(openApi.definitions.Pet, {
      type: "object",
      properties: {
        kind: { type: "string" },
        name: { type: "string" },
        weight: { type: "number", format: "float" },
      },
      required: ["kind", "name"],
      discriminator: "kind",
    });
    deepStrictEqual(openApi.definitions.Dog, {
      type: "object",
      properties: {
        breed: { type: "string" },
        kind: { type: "string" },
        bark: { type: "string" },
      },
      required: ["breed", "kind", "bark"],
      allOf: [{ $ref: "#/definitions/Pet" }],
      discriminator: "breed",
      "x-ms-discriminator-value": "dog",
    });
    deepStrictEqual(openApi.definitions.Beagle.allOf, [{ $ref: "#/definitions/Dog" }]);
    deepStrictEqual(openApi.definitions.Poodle.allOf, [{ $ref: "#/definitions/Dog" }]);
  });

  it("adds x-ms-discriminator-value extensions when appropriate", async () => {
    const openApi = await openApiFor(`
      @discriminator("kind")
      model Pet { }
      model Cat extends Pet {
        kind: "cat" | "feline";
        meow: int32;
      }
      model Dog extends Pet {
        kind: "dog";
        bark: string;
      }
      #suppress "@azure-tools/cadl-autorest/discriminator-value" "need to do this"
      model Lizard extends Pet {
        kind: string;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `);
    ok(openApi.definitions.Pet, "expected definition named Pet");
    ok(openApi.definitions.Cat, "expected definition named Cat");
    ok(openApi.definitions.Dog, "expected definition named Dog");
    ok(openApi.definitions.Lizard, "expected definition named Lizard");
    deepStrictEqual(openApi.paths["/"].get.responses["200"].schema, {
      $ref: "#/definitions/Pet",
    });
    deepStrictEqual(openApi.definitions.Pet, {
      type: "object",
      properties: { kind: { type: "string" } },
      required: ["kind"],
      discriminator: "kind",
    });
    strictEqual(openApi.definitions.Dog["x-ms-discriminator-value"], "dog");
    strictEqual(openApi.definitions.Cat["x-ms-discriminator-value"], undefined); // can't do multiple values
    strictEqual(openApi.definitions.Lizard["x-ms-discriminator-value"], undefined);
  });

  it("issues diagnostics for errors in a discriminated union", async () => {
    let testHost = await createOpenAPITestHost();
    testHost.addCadlFile(
      "main.cadl",
      `
      import "rest";
      import "cadl-autorest";
      using Cadl.Http;

      @discriminator("kind")
      model Pet {
        name: string;
        weight?: float32;
      }
      model Cat extends Pet {
        kind: "cat";
        meow: int32;
      }
      model Dog extends Pet {
        petType: "dog";
        bark: string;
      }
      model Pig extends Pet {
        kind: int32;
        oink: float32;
      }
      model Tiger extends Pet {
        kind?: "tiger";
        claws: float32;
      }
      model Lizard extends Pet {
        kind: string;
        tail: float64;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `
    );
    const diagnostics = await testHost.diagnose("./");
    strictEqual(diagnostics.length, 6);
    strictEqual((diagnostics[0].target as ModelType).name, "Dog");
    match(diagnostics[0].message, /not defined in a variant of a discriminated union/);
    strictEqual((diagnostics[1].target as ModelTypeProperty).name, "kind"); // Pig.kind
    match(diagnostics[1].message, /must be type 'string'/);
    strictEqual((diagnostics[2].target as ModelTypeProperty).name, "kind"); // Tiger.kind
    match(diagnostics[2].message, /must be a required property/);
    strictEqual((diagnostics[3].target as ModelType).name, "Dog");
    match(diagnostics[3].message, /define the discriminator property with a string literal value/);
    match(diagnostics[4].message, /define the discriminator property with a string literal value/); // Pig.kind
    match(diagnostics[5].message, /define the discriminator property with a string literal value/); // Lizard.kind
  });

  it("issues diagnostics for duplicate discriminator values", async () => {
    let testHost = await createOpenAPITestHost();
    testHost.addCadlFile(
      "main.cadl",
      `
      import "rest";
      import "cadl-autorest";
      using Cadl.Http;

      @discriminator("kind")
      model Pet {
      }
      model Cat extends Pet {
        kind: "cat" | "feline" | "housepet";
        meow: int32;
      }
      model Dog extends Pet {
        kind: "dog" | "housepet";
        bark: string;
      }
      model Beagle extends Pet {
        kind: "dog";
        bark: string;
      }

      @route("/")
      namespace root {
        op read(): { @body body: Pet };
      }
      `
    );
    const diagnostics = await testHost.diagnose("./");
    strictEqual(diagnostics.length, 2);
    match(diagnostics[0].message, /"housepet" defined in two different variants: Cat and Dog/);
    match(diagnostics[1].message, /"dog" defined in two different variants: Dog and Beagle/);
  });
});
