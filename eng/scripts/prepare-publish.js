import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import {
  checkForChangedFiles,
  CommandFailedError,
  coreRepoRoot,
  forEachProject,
  repoRoot,
  run,
} from "./helpers.js";

const NoChange = 0;
const Patch = 1;
const Minor = 2;
const Major = 3;

// Create and checkout branches
const branch = `publish/${Date.now().toString(36)}`;
doubleRun("git", "checkout", "-b", branch);

// Check that we have a clean slate before starting
checkPrePublishState();

// Update the cadl core submodule
cadlRun("git", "fetch", "https://github.com/microsoft/cadl", "main");
cadlRun("git", "merge", "--ff-only", "FETCH_HEAD");

// Stage the cadl core publish
cadlRun("rush", "publish", "--apply");
cadlRun("git", "add", "-A");
if (checkForChangedFiles(coreRepoRoot, undefined, { silent: true })) {
  cadlRun("git", "commit", "-m", "Prepare cadl publish");
} else {
  console.log("INFO: No changes to cadl.");
}

if (checkForChangedFiles(repoRoot, undefined, { silent: true })) {
  cadlAzureRun("git", "commit", "-a", "-m", "Update core submodule");
}

// Determine project versions including any bumps from cadl publish above
const versions = getProjectVersions();

// Bump cadl-azure -> cadl dependencies.
bumpCrossSubmoduleDependencies();

// Stage cadl-azure publish
cadlAzureRun("rush", "publish", "--apply");
cadlAzureRun("git", "add", "-A");
if (checkForChangedFiles(repoRoot, undefined, { silent: true })) {
  cadlAzureRun("git", "commit", "-m", "Prepare cadl-azure publish");
} else {
  console.log("INFO: No changes to cadl-azure.");
}

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
  let changed = false;

  forEachProject((_, projectFolder, project, rushProject) => {
    if (projectFolder.startsWith(coreRepoRoot)) {
      return;
    }

    const change = bumpDependencies(
      project.dependencies,
      project.peerDependencies,
      project.devDependencies
    );

    if (change == NoChange) {
      return;
    }

    writeFileSync(
      join(projectFolder, "package.json"),
      JSON.stringify(project, undefined, 2) + "\n"
    );

    if (!rushProject.shouldPublish) {
      return;
    }

    const changelog = {
      changes: [
        {
          comment: "Update dependencies.",
          type: change === Major ? "major" : change === Minor ? "minor" : "patch",
          packageName: project.name,
        },
      ],
      packageName: project.name,
      email: "microsoftopensource@users.noreply.github.com",
    };

    const changelogDir = join(repoRoot, "common/changes", project.name);
    mkdirSync(changelogDir, { recursive: true });

    writeFileSync(
      join(changelogDir, branch.replace("/", "-") + ".json"),
      JSON.stringify(changelog, undefined, 2) + "\n"
    );

    changed = true;
  });

  if (changed) {
    cadlAzureRun("git", "add", "-A");
    cadlAzureRun("git", "commit", "-m", `Bump cross-submodule dependencies.`);
  }
}

function bumpDependencies(...dependencyGroups) {
  let change = NoChange;
  for (const dependencies of dependencyGroups.filter((x) => x !== undefined)) {
    for (const [dependency, oldVersion] of Object.entries(dependencies)) {
      const newVersion = versions.get(dependency);
      if (newVersion && `~${newVersion}` !== oldVersion) {
        dependencies[dependency] = `~${newVersion}`;
        change = Math.max(change, getChangeType(oldVersion, newVersion));
      }
    }
  }
  return change;
}

function getChangeType(oldVersion, newVersion) {
  const oldParts = getVersionParts(oldVersion);
  const newParts = getVersionParts(newVersion);

  if (newParts.major > oldParts.major) {
    return Major;
  }
  if (newParts.major < oldParts.major) {
    throw new Error("version downgrade");
  }
  if (newParts.minor > oldParts.minor) {
    return Minor;
  }
  if (newParts.minor < oldParts.minor) {
    throw new Error("version downgrade");
  }
  if (newParts.minor > oldParts.minor) {
    return Patch;
  }
  if (newParts.minor < oldParts.minor) {
    throw new Error("version downgrade");
  }
  return NoChange;
}

function getVersionParts(version) {
  const parts = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!parts) {
    throw new Error(`Invalid version: ${version}`);
  }
  return { major: parts[1], minor: parts[2], patch: parts[3] };
}
