#!/usr/bin/env node
// @ts-check
import { readdirSync, rmdirSync } from "fs";
import mkdirp from "mkdirp";
import { dirname, join, normalize, resolve } from "path";
import { fileURLToPath } from "url";
import { run } from "../../../eng/scripts/helpers.js";

const excludedSamples = [
  // fails compilation by design to demo language server
  "local-cadl",
  "rpaas/cognitive",

  // remove this when versioning is implemented in autorest
  "versioning",

  // no actual samples in these dirs
  "node_modules",
  "scratch",
  "scripts",
  "test",
  ".rush",
];

main();

function main() {
  // clear any previous output as otherwise failing to emit anything could
  // escape PR validation. Also ensures we delete output for samples that
  // no longer exist.
  rmdirSync(resolvePath("../test/output/"), { recursive: true });

  function outputPath(sampleSet, emitterName) {
    return resolvePath(join("../test/output", sampleSet, emitterName));
  }

  const azureSamplesPath = resolvePath("../");
  const coreSamplesPath = resolvePath("../../../core/packages/samples/");

  // Generate output for core samples with the Swagger emitter (the core repo
  // takes care of generating its samples with openapi3 emitter)
  runCadlSamples(coreSamplesPath, outputPath("core", "autorest"), {
    emitter: resolvePath("../node_modules/@azure-tools/cadl-autorest/dist/src/openapi.js").replace(
      /\\/g,
      "/"
    ),
  });

  // Generate output for Azure samples with both emitters
  runCadlSamples(azureSamplesPath, outputPath("azure", "autorest"), {
    emitter: "@azure-tools/cadl-autorest",
  });
  runCadlSamples(azureSamplesPath, outputPath("azure", "openapi"), {
    emitter: "@cadl-lang/openapi3",
    excludes: [
      // An example for `x-ms-paths`, not supported by openapi3
      "overloads",

      // ARM specs depend on functionality in cadl-autorest
      "rpaas",

      // Spec that uses RPaaS, incompatible with OpenAPI3
      "operations",
    ],
  });
  runCadlSamples(join(azureSamplesPath, "rpaas"), outputPath("azure", "autorest/rpaas"), {
    imports: ["@azure-tools/cadl-autorest"],
    emitter: "@azure-tools/cadl-rpaas-controller",
    excludes: ["codesigning", "logz", "servicelinker"],
  });
}

function runCadlSamples(samplesPath, baseOutputPath, options) {
  for (const folderName of getSampleFolders(samplesPath, options.excludes)) {
    const inputPath = join(samplesPath, folderName);
    const outputPath = join(baseOutputPath, folderName);
    const registrationOutput = join(outputPath, "registrations");
    mkdirp(outputPath);

    run(process.execPath, [
      "../../core/packages/compiler/dist/core/cli.js",
      "compile",
      inputPath,
      `--option=arm-types-path=../../../../../../rpaas/types.json`,
      `--option=registrationOutputPath=${registrationOutput}`,
      `--output-path=${outputPath}`,
      ...(options.imports ? options.imports.map((x) => `--import="${x}"`) : []),
      `--emit="${options.emitter}"`,
      `--debug`,
    ]);
  }
}

function getSampleFolders(samplesPath, additionalExcludes) {
  const samples = new Set();
  const excludes = new Set([...excludedSamples, ...(additionalExcludes || [])].map(normalize));

  walk("");
  return samples;

  function walk(relativeDir) {
    if (samples.has(relativeDir) || excludes.has(relativeDir)) {
      return;
    }
    const fullDir = join(samplesPath, relativeDir);
    for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(join(relativeDir, entry.name));
      } else if (relativeDir && (entry.name === "main.cadl" || entry.name === "package.json")) {
        samples.add(relativeDir);
      }
    }
  }
}

function resolvePath(...parts) {
  const dir = dirname(fileURLToPath(import.meta.url));
  return resolve(dir, ...parts);
}
