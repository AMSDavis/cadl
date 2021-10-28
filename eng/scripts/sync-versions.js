import { writeFileSync } from "fs";
import { join } from "path";
import { forEachProject } from "./helpers.js";

const versions = new Map();
forEachProject((packageName, projectFolder, project) => {
  versions.set(packageName, project.version);
});
console.log(versions);

forEachProject((packageName, projectFolder, project) => {
  if (reversion(project.dependencies, project.devDependencies)) {
    writeFileSync(
      join(projectFolder, "package.json"),
      JSON.stringify(project, undefined, 2) + "\n"
    );
  }
});

function reversion(...dependencyGroups) {
  let changed = false;
  for (const dependencies of dependencyGroups) {
    for (const dependency in dependencies) {
      const newVersion = versions.get(dependency);
      if (newVersion) {
        dependencies[dependency] = newVersion;
        changed = true;
      }
    }
  }
  return changed;
}
