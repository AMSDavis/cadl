import { resolvePath } from "@cadl-lang/compiler";
import { CadlTestLibrary } from "@cadl-lang/compiler/testing";
import { fileURLToPath } from "url";

export const ProviderHubControllerTestLibrary: CadlTestLibrary = {
  name: "@azure-tools/cadl-providerhub-controller",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  files: [
    {
      realDir: "",
      pattern: "package.json",
      virtualPath: "./node_modules/@azure-tools/cadl-providerhub-controller",
    },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@azure-tools/cadl-providerhub-controller/dist/src",
    },
    {
      realDir: "clientlib",
      pattern: "*",
      virtualPath: "./node_modules/@azure-tools/cadl-providerhub-controller/clientlib",
    },
    {
      realDir: "templates",
      pattern: "*",
      virtualPath: "./node_modules/@azure-tools/cadl-providerhub-controller/templates",
    },
  ],
};
