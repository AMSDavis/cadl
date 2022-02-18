import { deepStrictEqual, ok } from "assert";
import { oapiForModel } from "./test-host.js";

describe("openapi3: primitives", () => {
  it("defines models extended from primitives", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      model shortString extends string {}
      model Pet { name: shortString };
      `
    );

    ok(res.isRef);
    ok(res.defs.shortString, "expected definition named shortString");
    ok(res.defs.Pet, "expected definition named Pet");
    deepStrictEqual(res.defs.shortString, {
      type: "string",
    });
  });

  it("apply description on extended primitive", async () => {
    const res = await oapiForModel(
      "shortString",
      `
      @doc("My custom description")
      model shortString extends string {}
      `
    );

    ok(res.isRef);
    ok(res.defs.shortString, "expected definition named shortString");
    deepStrictEqual(res.defs.shortString, {
      type: "string",
      description: "My custom description",
    });
  });

  it("defines models extended from primitives with attrs", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      @maxLength(10) @minLength(10)
      model shortString extends string {}
      model Pet { name: shortString };
      `
    );

    ok(res.isRef);
    ok(res.defs.shortString, "expected definition named shortString");
    ok(res.defs.Pet, "expected definition named Pet");
    deepStrictEqual(res.defs.shortString, {
      type: "string",
      minLength: 10,
      maxLength: 10,
    });
  });

  it("defines models extended from primitives with new attrs", async () => {
    const res = await oapiForModel(
      "Pet",
      `
      @maxLength(10)
      model shortString extends string {}
      @minLength(1)
      model shortButNotEmptyString extends shortString {};
      model Pet { name: shortButNotEmptyString, breed: shortString };
      `
    );
    ok(res.isRef);
    ok(res.defs.shortString, "expected definition named shortString");
    ok(res.defs.shortButNotEmptyString, "expected definition named shortButNotEmptyString");
    ok(res.defs.Pet, "expected definition named Pet");

    deepStrictEqual(res.defs.shortString, {
      type: "string",
      maxLength: 10,
    });
    deepStrictEqual(res.defs.shortButNotEmptyString, {
      type: "string",
      minLength: 1,
      maxLength: 10,
    });
  });
});
