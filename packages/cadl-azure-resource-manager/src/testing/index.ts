import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const AzureResourceManagerTestLibrary: CadlTestLibrary = {
  name: "@azure-tools/cadl-azure-resource-manager",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    {
      realDir: "",
      pattern: "package.json",
      virtualPath: "./node_modules/@azure-tools/cadl-azure-resource-manager",
    },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@azure-tools/cadl-azure-resource-manager/dist/src",
    },
    {
      realDir: "lib",
      pattern: "*.cadl",
      virtualPath: "./node_modules/@azure-tools/cadl-azure-resource-manager/lib",
    },
  ],
};
