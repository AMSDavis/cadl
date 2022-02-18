import { checkFor } from "./test-host.js";

describe("Azure Core:", () => {
  it("will contain tests in the next PR", async () => {
    const result = await checkFor(`
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
    `);
  });
});
