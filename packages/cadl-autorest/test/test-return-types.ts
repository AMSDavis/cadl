import { expectDiagnostics } from "@cadl-lang/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { createAutorestTestRunner, openApiFor } from "./test-host.js";

describe("cadl-autorest: return types", () => {
  it("defines responses with response headers", async () => {
    const res = await openApiFor(
      `
      model ETagHeader {
        @header eTag: string;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @get()
        op read(): Key & ETagHeader;
      }
      `
    );
    ok(res.paths["/"].get.responses["200"].headers);
    ok(res.paths["/"].get.responses["200"].headers["e-tag"]);
    // Note: schema intersection produces an anonymous model.
    deepStrictEqual(res.paths["/"].get.responses["200"].schema, {
      type: "object",
      properties: {
        key: {
          type: "string",
        },
      },
      required: ["key"],
      "x-cadl-name": "(anonymous model)",
    });
  });

  it("defines responses with status codes", async () => {
    const res = await openApiFor(
      `
      model CreatedResponse {
        @statusCode code: "201";
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): CreatedResponse & Key;
      }
      `
    );
    ok(res.paths["/"].put.responses["201"]);
    // Note: schema intersection produces an anonymous model.
    deepStrictEqual(res.paths["/"].put.responses["201"].schema, {
      type: "object",
      properties: {
        key: {
          type: "string",
        },
      },
      required: ["key"],
      "x-cadl-name": "(anonymous model)",
    });
  });

  it("defines responses with numeric status codes", async () => {
    const res = await openApiFor(
      `
      model CreatedResponse {
        @statusCode code: 201;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): CreatedResponse & Key;
      }
      `
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].schema);
  });

  it("defines responses with headers and status codes", async () => {
    const res = await openApiFor(
      `
      model ETagHeader {
        @header eTag: string;
      }
      model CreatedResponse {
        @statusCode code: "201";
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): { ...CreatedResponse, ...ETagHeader, @body body: Key};
      }
      `
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].headers["e-tag"]);
    deepStrictEqual(res.paths["/"].put.responses["201"].schema, {
      $ref: "#/definitions/Key",
    });
  });

  it("defines responses with headers and status codes in base model", async () => {
    const res = await openApiFor(
      `
      model CreatedResponse {
        @statusCode code: "201";
        @header contentType: "text/html";
        @header location: string;
      }
      model Page {
        content: string;
      }
      model CreatePageResponse extends CreatedResponse {
        @body body: Page;
      }
      @route("/")
      namespace root {
        @put
        op create(): CreatePageResponse;
      }
      `
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].headers["location"]);
    deepStrictEqual(res.paths["/"].put.responses["201"].schema, {
      $ref: "#/definitions/Page",
    });
  });

  it("defines separate responses for each status code defined as a union of values", async () => {
    const res = await openApiFor(
      `
      model CreatedOrUpdatedResponse {
        @statusCode code: "200" | "201";
      }
      model DateHeader {
        @header date: zonedDateTime;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): CreatedOrUpdatedResponse & DateHeader & Key;
      }
      `
    );
    ok(res.paths["/"].put.responses["200"]);
    ok(res.paths["/"].put.responses["201"]);
    // Note: 200 and 201 response should be equal except for description
    deepStrictEqual(
      res.paths["/"].put.responses["200"].headers,
      res.paths["/"].put.responses["201"].headers
    );
    deepStrictEqual(
      res.paths["/"].put.responses["200"].schema,
      res.paths["/"].put.responses["201"].schema
    );
  });

  it("defines separate responses for each status code property in return type", async () => {
    const res = await openApiFor(
      `
      model CreatedOrUpdatedResponse {
        @statusCode ok: "200";
        @statusCode created: "201";
      }
      model DateHeader {
        @header date: zonedDateTime;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): CreatedOrUpdatedResponse & DateHeader & Key;
      }
      `
    );
    ok(res.paths["/"].put.responses["200"]);
    ok(res.paths["/"].put.responses["201"]);
    // Note: 200 and 201 response should be equal except for description
    deepStrictEqual(
      res.paths["/"].put.responses["200"].headers,
      res.paths["/"].put.responses["201"].headers
    );
    deepStrictEqual(
      res.paths["/"].put.responses["200"].schema,
      res.paths["/"].put.responses["201"].schema
    );
  });

  it("defines separate responses for each variant of a union return type", async () => {
    const res = await openApiFor(
      `
      @doc("Error")
      @error
      model Error {
        code: int32;
        message: string;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @get
        op read(): Key | Error;
      }
      `
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.definitions.Key);
    deepStrictEqual(res.paths["/"].get.responses["200"].schema, {
      $ref: "#/definitions/Key",
    });
    ok(res.definitions.Error);
    deepStrictEqual(res.paths["/"].get.responses["default"].schema, {
      $ref: "#/definitions/Error",
    });
  });

  it("defines the response media type from the content-type header if present", async () => {
    const res = await openApiFor(
      `
      @doc("Error")
      @error
      model Error {
        code: int32;
        message: string;
      }
      model TextPlain {
        @header contentType: "text/plain";
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @get
        // Note: & takes precedence over |
        op read(): Key & TextPlain | Error;
      }
      `
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].schema);
    deepStrictEqual(res.paths["/"].get.produces, ["text/plain", "application/json"]);
    ok(res.definitions.Error);
    deepStrictEqual(res.paths["/"].get.responses["default"].schema, {
      $ref: "#/definitions/Error",
    });
  });

  it("defines the multiple response media types for content-type header with union value", async () => {
    const res = await openApiFor(
      `
      model TextMulti {
        @header contentType: "text/plain" | "text/html" | "text/csv";
      }
      @route("/")
      namespace root {
        @get
        op read(): { ...TextMulti, @body body: string };
      }
    `
    );
    ok(res.paths["/"].get.responses["200"]);
    deepStrictEqual(res.paths["/"].get.produces, ["text/plain", "text/html", "text/csv"]);
  });

  it("issues diagnostics when there is differrent body types across content types", async () => {
    const runner = await createAutorestTestRunner();
    const diagnostics = await runner.diagnose(
      `
      model Foo {
        @header contentType: "application/json";
        foo: string;
      }
      model Bar {
        @header contentType: "application/xml";
        code: string;
      }
      op read(): Foo | Bar;
      `
    );
    expectDiagnostics(diagnostics, {
      code: "@azure-tools/cadl-autorest/duplicate-body-types",
      message: "Request has multiple body types",
    });
  });

  it("defines responses with primitive types", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get()
        op read(): string;
      }
      `
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].schema);
    strictEqual(res.paths["/"].get.responses["200"].schema.type, "string");
  });

  it("defines responses with top-level array type", async () => {
    const res = await openApiFor(
      `
      model Foo {
        foo: string;
      }
      @route("/")
      namespace root {
        @get()
        op read(): Foo[];
      }
      `
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].schema);
    ok(res.paths["/"].get.produces === undefined, "operation should have no produces");
    strictEqual(res.paths["/"].get.responses["200"].schema.type, "array");
  });

  it("return type with no properties should be 204 response w/ no content", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get op delete(): {};
      }
      `
    );

    const responses = res.paths["/"].get.responses;
    ok(responses["204"]);
    ok(responses["204"].schema === undefined, "response should have no content");
    ok(responses["200"] === undefined);
  });

  it("return type with only response metadata should be 204 response w/ no content", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get op delete(): {@header date: string};
      }
      `
    );

    const responses = res.paths["/"].get.responses;
    ok(responses["204"]);
    ok(responses["204"].schema === undefined, "response should have no content");
    ok(responses["200"] === undefined);
  });

  it("defaults status code to 204 when implicit body has no content", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @delete
        op delete(): { @header date: string };
      }
      `
    );
    const responses = res.paths["/"].delete.responses;
    ok(responses["200"] === undefined);
    ok(responses["204"]);
    ok(responses["204"].headers["date"]);
    ok(responses["204"].schema === undefined);
  });

  it("defaults status code to default when model has @error decorator", async () => {
    const res = await openApiFor(
      `
      @error
      model Error {
        code: string;
      }

      model Foo {
        foo: string;
      }

      @route("/")
      namespace root {
        @get
        op get(): Foo | Error;
      }
      `
    );
    const responses = res.paths["/"].get.responses;
    ok(responses["200"]);
    deepStrictEqual(responses["200"].schema, {
      $ref: "#/definitions/Foo",
    });
    ok(responses["default"]);
    deepStrictEqual(responses["default"].schema, {
      $ref: "#/definitions/Error",
    });
  });

  it("defaults status code to default when model has @error decorator and explicit body", async () => {
    const res = await openApiFor(
      `
      @error
      model Error {
        @body body: string;
      }

      model Foo {
        foo: string;
      }

      @route("/")
      namespace root {
        @get
        op get(): Foo | Error;
      }
      `
    );
    const responses = res.paths["/"].get.responses;
    ok(responses["200"]);
    deepStrictEqual(responses["200"].schema, {
      $ref: "#/definitions/Foo",
    });
    ok(responses["default"]);
    deepStrictEqual(responses["default"].schema, {
      type: "string",
    });
  });

  it("uses explicit status code when model has @error decorator", async () => {
    const res = await openApiFor(
      `
      @error
      model Error {
        @statusCode _: "400";
        code: string;
      }

      model Foo {
        foo: string;
      }

      @route("/")
      namespace root {
        @get
        op get(): Foo | Error;
      }
      `
    );
    const responses = res.paths["/"].get.responses;
    ok(responses["200"]);
    deepStrictEqual(responses["200"].schema, {
      $ref: "#/definitions/Foo",
    });
    ok(responses["400"]);
    deepStrictEqual(responses["400"].schema, {
      $ref: "#/definitions/Error",
    });
    ok(responses["default"] === undefined);
  });

  it("defines body schema when explicit body has no content", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @delete
        op delete(): { @header date: string, @body body: {} };
      }
      `
    );
    const responses = res.paths["/"].delete.responses;
    ok(responses["204"] === undefined);
    ok(responses["200"]);
    ok(responses["200"].headers["date"]);
    ok(responses["200"].schema);
  });

  it("return type with only statusCode should have specified status code and no content", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get op create(): {@statusCode code: 201};
      }
      `
    );

    const responses = res.paths["/"].get.responses;
    ok(responses["201"]);
    ok(responses["201"].schema === undefined, "response should have no content");
    ok(responses["200"] === undefined);
    ok(responses["204"] === undefined);
  });

  it("defaults to 204 no content with void response type", async () => {
    const res = await openApiFor(`@get op read(): void;`);
    ok(res.paths["/"].get.responses["204"]);
  });

  it("defaults to 204 no content with void @body", async () => {
    const res = await openApiFor(`@get op read(): {@body body: void};`);
    ok(res.paths["/"].get.responses["204"]);
  });

  describe("binary responses", () => {
    it("bytes responses should produce application/json with byte schema", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): bytes;
      }
      `
      );
      const operation = res.paths["/"].get;
      deepStrictEqual(operation.produces, undefined);
      strictEqual(operation.responses["200"].schema.type, "string");
      strictEqual(operation.responses["200"].schema.format, "byte");
    });

    it("@body body: bytes responses should produce application/json with byte schema", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): {@body body: bytes};
      }
      `
      );

      const operation = res.paths["/"].get;
      deepStrictEqual(operation.produces, undefined);
      strictEqual(operation.responses["200"].schema.type, "string");
      strictEqual(operation.responses["200"].schema.format, "byte");
    });

    it("@header contentType should override content type and set type to file", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): {@header contentType: "image/png", @body body: bytes};
      }
      `
      );

      const operation = res.paths["/"].get;
      deepStrictEqual(operation.produces, ["image/png"]);
      strictEqual(operation.responses["200"].schema.type, "file");
    });
  });
});
