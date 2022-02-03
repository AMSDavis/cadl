import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const RPaaSTestLibrary: CadlTestLibrary = {
  name: "@azure-tools/cadl-rpaas",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    { realDir: "", pattern: "package.json", virtualPath: "./node_modules/@azure-tools/cadl-rpaas" },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@azure-tools/cadl-rpaas/dist/src",
    },
    {
      realDir: "lib",
      pattern: "*.cadl",
      virtualPath: "./node_modules/@azure-tools/cadl-rpaas/lib",
    },
  ],
};
