// @ts-check
import { runMsBuildOrExit } from "../../../eng/scripts/helpers.js";

runMsBuildOrExit("packages/cadl-msbuild-target", "CadlMSBuild.csproj");
