import { writeFileSync } from "fs";
import { join } from "path";
import {
  checkForChangedFiles,
  CommandFailedError,
  coreRepoRoot,
  forEachProject,
  repoRoot,
  run,
} from "./helpers.js";

// Check that we have a clean slate before starting
checkPrePublishState();

// Determine project versions including any bumps from cadl publish above
const versions = getProjectVersions();
const branch = `publish/${Date.now().toString(36)}`;

// Stage the cadl publish
cadlRun("rush", "publish", "--apply");

// Bump cadl-azure -> cadl dependencies.
bumpCrossSubmoduleDependencies();

// Stage cadl-azure publish
cadlAzureRun("rush", "publish", "--apply");

// Checkout branches and commit
doubleRun("git", "checkout", "-b", branch);
commitChanges();

// And we're done
console.log();
console.log(`Success! Push ${branch} branches and send PRs.`);

function checkPrePublishState() {
  if (checkForChangedFiles()) {
    console.error("ERROR: Cannot prepare publish because files above were modified.");
    process.exit(1);
  }

  try {
    doubleRun("rush", "change", "--verify");
  } catch (e) {
    if (e instanceof CommandFailedError) {
      console.error("ERROR: Cannot prepare publish because changelogs are missing.");
      process.exit(1);
    }
    throw e;
  }
}

function doubleRun(command, ...args) {
  cadlRun(command, ...args);
  cadlAzureRun(command, ...args);
}

function cadlRun(command, ...args) {
  console.log();
  console.log("## cadl ##");
  run(command, args, { cwd: coreRepoRoot });
}

function cadlAzureRun(command, ...args) {
  console.log();
  console.log("## cadl-azure ##");
  run(command, args, { cwd: repoRoot });
}

function getProjectVersions() {
  const map = new Map();
  forEachProject((packageName, _, project) => {
    map.set(packageName, project.version);
  });
  return map;
}

function bumpCrossSubmoduleDependencies() {
  forEachProject((_, projectFolder, project) => {
    if (bumpDependencies(project.dependencies, project.devDependencies)) {
      writeFileSync(
        join(projectFolder, "package.json"),
        JSON.stringify(project, undefined, 2) + "\n"
      );
      cadlAzureRun(
        "rush",
        "change",
        "--bulk",
        "--bump-type",
        "patch",
        "--message",
        "Update dependencies."
      );
    }
  });
}

function bumpDependencies(...dependencyGroups) {
  let changed = false;
  for (const dependencies of dependencyGroups) {
    for (const [dependency, oldVersion] of Object.entries(dependencies)) {
      const newVersion = versions.get(dependency);
      if (newVersion && newVersion !== oldVersion) {
        dependencies[dependency] = newVersion;
        changed = true;
      }
    }
  }
  return changed;
}

function commitChanges() {
  doubleRun("git", "add", "-A");

  if (checkForChangedFiles(coreRepoRoot, undefined, { silent: true })) {
    cadlRun("git", "commit", "-m", "Prepare cadl publish");
  } else {
    console.log("INFO: No changes to cadl.");
  }

  if (checkForChangedFiles(repoRoot, undefined, { silent: true })) {
    cadlAzureRun("git", "commit", "-m", "Prepare cadl-azure publish");
  } else {
    console.log("INFO: No changes to cadl-azure.");
  }
}
