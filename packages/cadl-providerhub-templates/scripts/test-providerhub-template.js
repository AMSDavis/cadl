import { buildTemplateProject } from "../../../eng/scripts/cadl-providerhub-template.js";

async function buildProviderhubTemplate() {
  console.log("Start build cadl providerhub templating project:");

  // In linux , there is issue to restore dotnet nuget dependencies.
  buildTemplateProject();
  console.log("Build cadl providerhub templating project successfully: \n");
}

buildProviderhubTemplate().catch((error) => {
  console.error("Error", error);
  process.exit(1);
});
