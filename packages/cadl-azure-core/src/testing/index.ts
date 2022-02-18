import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const AzureCoreTestLibrary: CadlTestLibrary = {
  name: "@azure-tools/cadl-azure-core",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    {
      realDir: "",
      pattern: "package.json",
      virtualPath: "./node_modules/@azure-tools/cadl-azure-core",
    },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@azure-tools/cadl-azure-core/dist/src",
    },
    {
      realDir: "lib",
      pattern: "*.cadl",
      virtualPath: "./node_modules/@azure-tools/cadl-azure-core/lib",
    },
  ],
};
