import { deepStrictEqual, ok, strictEqual } from "assert";
import { oapiForModel, openApiFor } from "./test-host.js";

describe("autorest: definitions", () => {
  it("defines models", async () => {
    const res = await oapiForModel(
      "Foo",
      `model Foo {
        x: int32;
      };`
    );

    ok(res.isRef);
    deepStrictEqual(res.defs.Foo, {
      type: "object",
      properties: {
        x: { type: "integer", format: "int32" },
      },
      required: ["x"],
    });
  });

  it("doesn't define anonymous or unconnected models", async () => {
    const res = await oapiForModel(
      "{ ... Foo }",
      `model Foo {
        x: int32;
      };`
    );

    ok(!res.isRef);
    strictEqual(Object.keys(res.defs).length, 0);
    deepStrictEqual(res.useSchema, {
      type: "object",
      properties: {
        x: { type: "integer", format: "int32" },
      },
      required: ["x"],
      "x-cadl-name": "(anonymous model)",
    });
  });

  it("defines templated models", async () => {
    const res = await oapiForModel(
      "Foo<int32>",
      `model Foo<T> {
        x: T;
      };`
    );

    ok(res.isRef);
    ok(res.defs.Foo_int32, "expected definition named Foo_int32");
    deepStrictEqual(res.defs.Foo_int32, {
      type: "object",
      properties: {
        x: { type: "integer", format: "int32" },
      },
      required: ["x"],
    });
  });

  it("defines templated models when template param is in a namespace", async () => {
    const res = await oapiForModel(
      "Foo<Test.M>",
      `
      namespace Test {
        model M {}
      }
      model Foo<T> {
        x: T;
      };`
    );

    ok(res.isRef);
    ok(res.defs["Foo_Test.M"], "expected definition named Foo_Test.M");
    deepStrictEqual(res.defs["Foo_Test.M"], {
      type: "object",
      properties: {
        x: { $ref: "#/definitions/Test.M" },
      },
      required: ["x"],
    });
  });

  it("defines models extended from models", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo {
        y: int32;
      };
      model Bar extends Foo {}`
    );

    ok(res.isRef);
    ok(res.defs.Foo, "expected definition named Foo");
    ok(res.defs.Bar, "expected definition named Bar");
    deepStrictEqual(res.defs.Bar, {
      type: "object",
      properties: {},
      allOf: [{ $ref: "#/definitions/Foo" }],
    });

    deepStrictEqual(res.defs.Foo, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("emits models extended from models when parent is emitted", async () => {
    const res = await openApiFor(
      `
      model Parent {
        x?: int32;
      };
      model Child extends Parent {
        y?: int32;
      }
      namespace Test {
        @route("/") op test(): Parent;
      }
      `
    );
    deepStrictEqual(res.definitions.Parent, {
      type: "object",
      properties: { x: { type: "integer", format: "int32" } },
    });
    deepStrictEqual(res.definitions.Child, {
      type: "object",
      allOf: [{ $ref: "#/definitions/Parent" }],
      properties: { y: { type: "integer", format: "int32" } },
    });
  });

  it("defines models with properties extended from models", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo {
        y: int32;
      };
      model Bar extends Foo {
        x: int32;
      }`
    );

    ok(res.isRef);
    ok(res.defs.Foo, "expected definition named Foo");
    ok(res.defs.Bar, "expected definition named Bar");
    deepStrictEqual(res.defs.Bar, {
      type: "object",
      properties: { x: { type: "integer", format: "int32" } },
      allOf: [{ $ref: "#/definitions/Foo" }],
      required: ["x"],
    });

    deepStrictEqual(res.defs.Foo, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("defines models extended from templated models", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo<T> {
        y: T;
      };
      model Bar extends Foo<int32> {}`
    );

    ok(res.isRef);
    ok(res.defs["Foo_int32"] === undefined, "no definition named Foo_int32");
    ok(res.defs.Bar, "expected definition named Bar");
    deepStrictEqual(res.defs.Bar, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("defines models with properties extended from templated models", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo<T> {
        y: T;
      };
      model Bar extends Foo<int32> {
        x: int32
      }`
    );

    ok(res.isRef);
    ok(res.defs.Foo_int32, "expected definition named Foo_int32");
    ok(res.defs.Bar, "expected definition named Bar");
    deepStrictEqual(res.defs.Bar, {
      type: "object",
      properties: { x: { type: "integer", format: "int32" } },
      allOf: [{ $ref: "#/definitions/Foo_int32" }],
      required: ["x"],
    });

    deepStrictEqual(res.defs.Foo_int32, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("defines templated models with properties extended from templated models", async () => {
    const res = await oapiForModel(
      "Bar<int32>",
      `
      model Foo<T> {
        y: T;
      };
      model Bar<T> extends Foo<T> {
        x: T
      }`
    );

    ok(res.isRef);
    ok(res.defs.Foo_int32, "expected definition named Foo_int32");
    ok(res.defs.Bar_int32, "expected definition named Bar_int32");
    deepStrictEqual(res.defs.Bar_int32, {
      type: "object",
      properties: { x: { type: "integer", format: "int32" } },
      allOf: [{ $ref: "#/definitions/Foo_int32" }],
      required: ["x"],
    });

    deepStrictEqual(res.defs.Foo_int32, {
      type: "object",
      properties: { y: { type: "integer", format: "int32" } },
      required: ["y"],
    });
  });

  it("excludes response models with only headers", async () => {
    const res = await oapiForModel(
      "Foo",
      `
      model Foo { @statusCode code: 200, @header x: string};`
    );

    ok(!res.isRef);
    deepStrictEqual(res.defs, {});
    deepStrictEqual(res.response, {
      description: "Ok",
      headers: { x: { type: "string" } },
    });
  });

  it("defines models with no properties extended", async () => {
    const res = await oapiForModel(
      "Bar",
      `
      model Foo { x?: string};
      model Bar extends Foo {};`
    );

    ok(res.isRef);
    ok(res.defs.Foo, "expected definition named Foo");
    ok(res.defs.Bar, "expected definition named Bar");
    deepStrictEqual(res.defs.Bar, {
      type: "object",
      properties: {},
      allOf: [{ $ref: "#/definitions/Foo" }],
    });

    deepStrictEqual(res.defs.Foo, {
      type: "object",
      properties: { x: { type: "string" } },
    });
  });

  it("defines models with no properties extended twice", async () => {
    const res = await oapiForModel(
      "Baz",
      `
      model Foo { x: int32 };
      model Bar extends Foo {};
      model Baz extends Bar {};`
    );

    ok(res.isRef);
    ok(res.defs.Foo, "expected definition named Foo");
    ok(res.defs.Bar, "expected definition named Bar");
    ok(res.defs.Baz, "expected definition named Baz");
    deepStrictEqual(res.defs.Baz, {
      type: "object",
      properties: {},
      allOf: [{ $ref: "#/definitions/Bar" }],
    });

    deepStrictEqual(res.defs.Bar, {
      type: "object",
      properties: {},
      allOf: [{ $ref: "#/definitions/Foo" }],
    });

    deepStrictEqual(res.defs.Foo, {
      type: "object",
      properties: {
        x: {
          format: "int32",
          type: "integer",
        },
      },
      required: ["x"],
    });
  });

  it("defines models with default properties", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model Pet {
        someString?: string = "withDefault"
      }
      `
    );

    ok(res.isRef);
    ok(res.defs.Pet, "expected definition named Pet");
    deepStrictEqual(res.defs.Pet.properties.someString.default, "withDefault");
  });

  describe("nullable", () => {
    it("defines nullable properties", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      model Pet {
        name: string | null;
      };
      `
      );
      ok(res.isRef);
      deepStrictEqual(res.defs.Pet, {
        type: "object",
        properties: {
          name: {
            type: "string",
            "x-nullable": true,
            "x-cadl-name": "Cadl.string | Cadl.null",
          },
        },
        required: ["name"],
      });
    });

    it("defines nullable array", async () => {
      const res = await oapiForModel(
        "Pet",
        `
      model Pet {
        name: int32[] | null;
      };
      `
      );
      ok(res.isRef);
      deepStrictEqual(res.defs.Pet, {
        type: "object",
        properties: {
          name: {
            type: "array",
            items: {
              type: "integer",
              format: "int32",
            },
            "x-nullable": true,
            "x-cadl-name": "Cadl.int32[] | Cadl.null",
          },
        },
        required: ["name"],
      });
    });
  });
});

describe("autorest: primitives", () => {
  const cases = [
    ["int8", { type: "integer", format: "int8" }],
    ["int16", { type: "integer", format: "int16" }],
    ["int32", { type: "integer", format: "int32" }],
    ["int64", { type: "integer", format: "int64" }],
    ["safeint", { type: "integer", format: "int64" }],
    ["uint8", { type: "integer", format: "uint8" }],
    ["uint16", { type: "integer", format: "uint16" }],
    ["uint32", { type: "integer", format: "uint32" }],
    ["uint64", { type: "integer", format: "uint64" }],
    ["float32", { type: "number", format: "float" }],
    ["float64", { type: "number", format: "double" }],
    ["string", { type: "string" }],
    ["boolean", { type: "boolean" }],
    ["plainDate", { type: "string", format: "date" }],
    ["zonedDateTime", { type: "string", format: "date-time" }],
    ["plainTime", { type: "string", format: "time" }],
    ["duration", { type: "string", format: "duration" }],
    ["bytes", { type: "string", format: "byte" }],
  ];

  for (const test of cases) {
    it("knows schema for " + test[0], async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { name: ${test[0]} };
        `
      );

      const schema = res.defs.Pet.properties.name;
      deepStrictEqual(schema, test[1]);
    });
  }
});

describe("autorest: literals", () => {
  const cases = [
    ["1", { type: "number", enum: [1] }],
    ['"hello"', { type: "string", enum: ["hello"] }],
    ["false", { type: "boolean", enum: [false] }],
    ["true", { type: "boolean", enum: [true] }],
  ];

  for (const test of cases) {
    it("knows schema for " + test[0], async () => {
      const res = await oapiForModel(
        "Pet",
        `
        model Pet { name: ${test[0]} };
        `
      );

      const schema = res.defs.Pet.properties.name;
      deepStrictEqual(schema, test[1]);
    });
  }
});

describe("autorest: operations", () => {
  it("define operations with param with defaults", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get()
        op read(@query queryWithDefault?: string = "defaultValue"): string;
      }
      `
    );

    deepStrictEqual(res.paths["/"].get.parameters[0].default, "defaultValue");
  });

  it("define operations with param with decorators", async () => {
    const res = await openApiFor(
      `
      @route("/thing")
      namespace root {
        @get
        @route("{name}")
        op getThing(
          @pattern("^[a-zA-Z0-9-]{3,24}$")
          @format("UUID")
          @path name: string,

          @minValue(1)
          @maxValue(10)
          @query count: int32
        ): string;
      }
      `
    );

    const getThing = res.paths["/thing/{name}"].get;
    ok(getThing);
    ok(getThing.parameters[0].pattern);
    strictEqual(getThing.parameters[0].pattern, "^[a-zA-Z0-9-]{3,24}$");
    strictEqual(getThing.parameters[0].format, "UUID");

    ok(getThing.parameters[1].minimum);
    ok(getThing.parameters[1].maximum);
    strictEqual(getThing.parameters[1].minimum, 1);
    strictEqual(getThing.parameters[1].maximum, 10);
  });
});

describe("autorest: request", () => {
  describe("binary request", () => {
    it("bytes request should produce byte format with application/json", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @post op read(@body body: bytes): {};
      }
      `
      );
      const operation = res.paths["/"].post;
      deepStrictEqual(operation.consumes, undefined);
      const requestBody = operation.parameters[0];
      ok(requestBody);
      strictEqual(requestBody.schema.type, "string");
      strictEqual(requestBody.schema.format, "byte");
    });

    it("bytes request should respect @header contentType", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @post op read(@header contentType: "image/png", @body body: bytes): {};
      }
      `
      );

      const operation = res.paths["/"].post;
      deepStrictEqual(operation.consumes, ["image/png"]);
      const requestBody = operation.parameters[0];
      ok(requestBody);
      strictEqual(requestBody.schema.type, "string");
      strictEqual(requestBody.schema.format, "binary");
    });
  });
});

describe("autorest: enums", () => {
  const enumBase = Object.freeze({
    type: "string",
    enum: ["foo", "bar"],
  });
  it("create basic enum without values", async () => {
    const res = await oapiForModel(
      "Foo",
      `
        enum Foo {foo, bar}
      `
    );

    const schema = res.defs.Foo;
    deepStrictEqual(schema, {
      ...enumBase,
      "x-ms-enum": {
        modelAsString: true,
        name: "Foo",
      },
    });
  });

  it("create enum with doc on a member", async () => {
    const res = await oapiForModel(
      "Foo",
      `
        enum Foo {
          @doc("Foo doc")
          foo,
          bar
        }
      `
    );

    const schema = res.defs.Foo;
    deepStrictEqual(schema, {
      ...enumBase,
      "x-ms-enum": {
        modelAsString: true,
        name: "Foo",
        values: [
          {
            description: "Foo doc",
            name: "foo",
            value: "foo",
          },
          {
            name: "bar",
            value: "bar",
          },
        ],
      },
    });
  });

  it("create enum with custom name/value on a member", async () => {
    const res = await oapiForModel(
      "Foo",
      `
        enum Foo {
          FooCustom: "foo",
          bar,
        }
      `
    );

    const schema = res.defs.Foo;
    deepStrictEqual(schema, {
      ...enumBase,
      "x-ms-enum": {
        modelAsString: true,
        name: "Foo",
        values: [
          {
            name: "FooCustom",
            value: "foo",
          },
          {
            name: "bar",
            value: "bar",
          },
        ],
      },
    });
  });
});

describe("cadl-autorest: extension decorator", () => {
  it("adds an arbitrary extension to a model", async () => {
    const oapi = await openApiFor(
      `
      @extension("x-model-extension", "foobar")
      model Pet {
        name: string;
      }
      @route("/")
      namespace root {
        @get()
        op read(): Pet;
      }
      `
    );
    ok(oapi.definitions.Pet);
    strictEqual(oapi.definitions.Pet["x-model-extension"], "foobar");
  });

  it("adds an arbitrary extension to an operation", async () => {
    const oapi = await openApiFor(
      `
      model Pet {
        name: string;
      }
      @route("/")
      namespace root {
        @get()
        @extension("x-operation-extension", "barbaz")
        op list(): Pet[];
      }
      `
    );
    ok(oapi.paths["/"].get);
    strictEqual(oapi.paths["/"].get["x-operation-extension"], "barbaz");
  });

  it("adds an arbitrary extension to a parameter", async () => {
    const oapi = await openApiFor(
      `
      model Pet {
        name: string;
      }
      model PetId {
        @path
        @extension("x-parameter-extension", "foobaz")
        petId: string;
      }
      @route("/Pets")
      namespace root {
        @get()
        op get(... PetId): Pet;
      }
      `
    );
    ok(oapi.paths["/Pets/{petId}"].get);
    strictEqual(oapi.paths["/Pets/{petId}"].get.parameters[0]["$ref"], "#/parameters/PetId");
    strictEqual(oapi.parameters.PetId.name, "petId");
    strictEqual(oapi.parameters.PetId["x-parameter-extension"], "foobaz");
  });
});
