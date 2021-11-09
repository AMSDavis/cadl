import { checkForChangedFiles, coreRepoRoot, repoRoot } from "./helpers.js";

if (checkForChangedFiles(coreRepoRoot, "## cadl ##", repoRoot, "## cadl-azure ##")) {
  console.error(
    `ERROR: Files above were changed during PR validation, but not included in the PR.
Include any automated changes such as sample output, spec.html, and ThirdPartyNotices.txt in your PR.`
  );
  process.exit(1);
}
