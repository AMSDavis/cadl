import { deepStrictEqual, strictEqual } from "assert";
import { comparePaths } from "../src/openapi.js";

// /foo < /foo/{thing}
// /foo/{thing} < /foo/bar/{thing}
// /{thing}/one < /{thing}/two

describe("autorest: OpenAPI output quasi-stable sorting", () => {
  it("sorts paths correctly", () => {
    strictEqual(comparePaths("/foo", "/foo/{thing}"), -1);
    strictEqual(comparePaths("/foo/{thing}", "/foo/bar/{thing}"), -1);
    strictEqual(comparePaths("/foo/{thing}/beta", "/foo/{thing}/alpha"), 1);
    strictEqual(comparePaths("/{thing}/two", "/{thing}/one"), 1);

    deepStrictEqual(
      ["/foo/{thing}", "/foo/bar/{thing}", "/foo", "/bar/{thing}"].sort(comparePaths),
      ["/bar/{thing}", "/foo", "/foo/{thing}", "/foo/bar/{thing}"]
    );
  });
});
