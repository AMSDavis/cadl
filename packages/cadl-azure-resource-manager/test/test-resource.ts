import { checkFor } from "./test-host.js";

describe("ARM resource model:", () => {
  it("will contain tests in the next PR", async () => {
    const result = await checkFor(`
      @armNamespace
      @serviceTitle("Microsoft.Test")
      @serviceVersion("2021-03-01-preview")
      namespace Microsoft.Test;
    `);
  });
});
