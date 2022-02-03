import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const RPaaSControllerTestLibrary: CadlTestLibrary = {
  name: "@azure-tools/cadl-rpaas-controller",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    {
      realDir: "",
      pattern: "package.json",
      virtualPath: "./node_modules/@azure-tools/cadl-rpaas-controller",
    },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@azure-tools/cadl-rpaas-controller/dist/src",
    },
    {
      realDir: "clientlib",
      pattern: "*",
      virtualPath: "./node_modules/@azure-tools/cadl-rpaas-controller/clientlib",
    },
    {
      realDir: "templates",
      pattern: "*",
      virtualPath: "./node_modules/@azure-tools/cadl-rpaas-controller/templates",
    },
  ],
};
