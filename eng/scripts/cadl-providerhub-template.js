import { existsSync, rmdirSync } from "fs";
import { resolve } from "path";
import { repoRoot, run } from "./helpers.js";

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

export function InstantiateTemplate() {
  // 'rush update' will create a node_modules folder , so we need to remove it,otherwise the following creating command will be slow.
  const node_modules = resolve(templateDir, "cadl", "node_modules");
  if (existsSync(node_modules)) {
    rmdirSync(node_modules, { recursive: true });
  }
  // install template locally
  try {
    run("dotnet", ["new", "-i", templateDir]);
  } catch (e) {}

  // create a sample project from template
  try {
    run("dotnet", [
      "new",
      cadlProviderhubTemplateName,
      "-o",
      templateOutputDir,
      "-n",
      "contoso",
      "--force",
      "--allow-scripts",
      "no",
    ]);
  } catch (e) {}

  console.log("\n");
}

export function buildTemplateProject() {
  run("dotnet", ["build"], { cwd: templateDir });
}
