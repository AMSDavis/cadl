// @ts-check

import { existsSync, rmdirSync, rmSync } from "fs";
import { join, resolve } from "path";
import { repoRoot, runDotnetOrExit } from "./helpers.js";

export const cadlProviderhubTemplateName = "cadl-providerhub";
export const templateDir = resolve(
  repoRoot,
  "packages",
  "cadl-providerhub-templates",
  "templates",
  cadlProviderhubTemplateName
);
const templateOutputDir = resolve(
  repoRoot,
  "packages/cadl-samples/test/output/azure/templates-contoso"
);

export function instantiateTemplate() {
  // 'rush update' will create a node_modules folder , so we need to remove it,otherwise the following creating command will be slow.
  const node_modules = resolve(templateDir, "cadl", "node_modules");
  if (existsSync(node_modules)) {
    rmdirSync(node_modules, { recursive: true });
  }
  const templateInstallTempDir = join(repoRoot, "temp/dotnet-template-hive");
  rmSync(templateInstallTempDir, { force: true, recursive: true });

  // install template locally
  runDotnetOrExit(["new", "-i", templateDir, "--debug:custom-hive", templateInstallTempDir]);

  // create a sample project from template
  runDotnetOrExit([
    "new",
    cadlProviderhubTemplateName,
    "-o",
    templateOutputDir,
    "--debug:custom-hive",
    templateInstallTempDir,
    "-n",
    "contoso",
    "--force",
    "--allow-scripts",
    "no",
  ]);

  console.log("\n");
}

export function buildTemplateProject() {
  runDotnetOrExit(["restore"], { cwd: templateDir });
  runDotnetOrExit(["build"], { cwd: templateDir });
}
