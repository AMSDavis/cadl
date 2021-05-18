import { spawnSync, SpawnSyncOptionsWithBufferEncoding } from "child_process";
import { mkdtemp, readdir, rmdir } from "fs/promises";
import mkdirp from "mkdirp";
import os from "os";
import path, { join, resolve } from "path";
import url from "url";
import yargs from "yargs";
import { CompilerOptions } from "../compiler/options.js";
import { compile } from "../compiler/program.js";
import { compilerAssert, DiagnosticError, dumpError, logDiagnostics } from "./diagnostics.js";
import { formatADLFiles } from "./formatter.js";
import { adlVersion, NodeHost } from "./util.js";

const args = yargs(process.argv.slice(2))
  .scriptName("adl")
  .help()
  .strict()
  .command("compile <path>", "Compile a directory of ADL files.", (cmd) => {
    return cmd
      .positional("path", {
        description: "The path to folder containing .adl files",
        type: "string",
      })
      .option("output-path", {
        type: "string",
        default: "./adl-output",
        describe:
          "The output path for generated artifacts.  If it does not exist, it will be created.",
      })
      .option("option", {
        type: "array",
        string: true,
        describe:
          "Key/value pairs that can be passed to ADL components.  The format is 'key=value'.  This parameter can be used multiple times to add more options.",
      })
      .option("nostdlib", {
        type: "boolean",
        default: false,
        describe: "Don't load the ADL standard library.",
      });
  })
  .command(
    "generate <path>",
    "Generate client and server code from a directory of ADL files.",
    (cmd) => {
      return (
        cmd
          .positional("path", {
            description: "The path to folder containing .adl files",
            type: "string",
          })
          .option("client", {
            type: "boolean",
            describe: "Generate a client library for the ADL definition",
          })
          .option("language", {
            type: "string",
            choices: ["typescript", "csharp", "python"],
            describe: "The language to use for code generation",
          })
          .option("output-path", {
            type: "string",
            default: "./adl-output",
            describe:
              "The output path for generated artifacts.  If it does not exist, it will be created.",
          })
          .option("option", {
            type: "array",
            string: true,
            describe:
              "Key/value pairs that can be passed to ADL components.  The format is 'key=value'.  This parameter can be used multiple times to add more options.",
          })
          // we can't generate anything but a client yet
          .demandOption("client")
          // and language is required to do so
          .demandOption("language")
      );
    }
  )
  .command("code", "Manage VS Code Extension.", (cmd) => {
    return cmd
      .demandCommand(1, "No command specified.")
      .command("install", "Install VS Code Extension")
      .command("uninstall", "Uninstall VS Code Extension")
      .option("insiders", { type: "boolean", description: "Use VS Code Insiders" });
  })
  .command("vs", "Manage Visual Studio Extension.", (cmd) => {
    return cmd
      .demandCommand(1, "No command specified")
      .command("install", "Install Visual Studio Extension.")
      .command("uninstall", "Uninstall VS Extension");
  })
  .command("format <include...>", "Format given list of adl files.", (cmd) => {
    return cmd.positional("include", {
      description: "Wildcard pattern of the list of files.",
      type: "string",
      array: true,
    });
  })
  .option("debug", {
    type: "boolean",
    description: "Output debug log messages.",
  })
  .version(adlVersion)
  .demandCommand(1, "You must use one of the supported commands.").argv;

async function compileInput(compilerOptions: CompilerOptions, printSuccess = true) {
  try {
    await compile(args.path!, NodeHost, compilerOptions);
    if (printSuccess) {
      console.log(
        `Compilation completed successfully, output files are in ${compilerOptions.outputPath}.`
      );
    }
  } catch (err) {
    if (err instanceof DiagnosticError) {
      logDiagnostics(err.diagnostics, console.error);
      if (args.debug) {
        console.error(`Stack trace:\n\n${err.stack}`);
      }
      process.exit(1);
    }
    throw err; // let non-diagnostic errors go to top-level bug handler.
  }
}

async function getCompilerOptions(): Promise<CompilerOptions> {
  // Ensure output path
  const outputPath = resolve(args["output-path"]);
  await mkdirp(outputPath);

  const miscOptions: any = {};
  for (const option of args.option || []) {
    const optionParts = option.split("=");
    if (optionParts.length != 2) {
      throw new Error(
        `The --option parameter value "${option}" must be in the format: some-option=value`
      );
    }
    miscOptions[optionParts[0]] = optionParts[1];
  }

  return {
    miscOptions,
    outputPath,
    swaggerOutputFile: resolve(args["output-path"], "openapi.json"),
    nostdlib: args["nostdlib"],
  };
}

async function generateClient(options: CompilerOptions) {
  const clientPath = path.resolve(args["output-path"], "client");
  const autoRestBin = process.platform === "win32" ? "autorest.cmd" : "autorest";
  const autoRestPath = new url.URL(`../../node_modules/.bin/${autoRestBin}`, import.meta.url);

  // Execute AutoRest on the output file
  console.log(); //newline between compilation output and generation output
  const result = run(
    url.fileURLToPath(autoRestPath),
    [
      `--${args.language}`,
      `--clear-output-folder=true`,
      `--output-folder=${clientPath}`,
      `--title=AdlClient`,
      `--input-file=${options.swaggerOutputFile}`,
    ],
    {
      shell: true,
    }
  );

  if (result.status === 0) {
    console.log(`\nGeneration completed successfully, output files are in ${clientPath}.`);
  } else {
    console.error("\nClient generation failed.");
    process.exit(result.status || 1);
  }
}

async function installVsix(pkg: string, install: (vsixPath: string) => void) {
  // download npm package to temporary directory
  const temp = await mkdtemp(path.join(os.tmpdir(), "adl"));
  run("npm", ["install", "--silent", "--prefix", temp, pkg]);

  // locate .vsix
  const dir = path.join(temp, "node_modules", pkg);
  const files = await readdir(dir);
  let vsix: string | undefined;
  for (const file of files) {
    if (file.endsWith(".vsix")) {
      vsix = path.join(dir, file);
      break;
    }
  }

  compilerAssert(vsix, `Installed ${pkg} from npm, but didn't find its .vsix file.`);

  // install extension
  install(vsix);

  // delete temporary directory
  await rmdir(temp, { recursive: true });
}

async function runCode(codeArgs: string[]) {
  await run(args.insiders ? "code-insiders" : "code", codeArgs, {
    // VS Code's CLI emits node warnings that we can't do anything about. Suppress them.
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
  });
}

async function installVSCodeExtension() {
  await installVsix("adl-vscode", (vsix) => {
    runCode(["--install-extension", vsix]);
  });
}

async function uninstallVSCodeExtension() {
  await runCode(["--uninstall-extension", "microsoft.adl-vscode"]);
}

function getVsixInstallerPath(): string {
  if (process.platform !== "win32") {
    console.error("error: Visual Studio extension is not supported on non-Windows");
    process.exit(1);
  }

  return join(
    process.env["ProgramFiles(x86)"] ?? "",
    "Microsoft Visual Studio/Installer/resources/app/ServiceHub/Services/Microsoft.VisualStudio.Setup.Service",
    "VSIXInstaller.exe"
  );
}

async function installVSExtension() {
  const vsixInstaller = getVsixInstallerPath();
  await installVsix("@azure-tools/adl-vs", (vsix) => {
    run(vsixInstaller, [vsix]);
  });
}

async function uninstallVSExtension() {
  const vsixInstaller = getVsixInstallerPath();
  run(vsixInstaller, ["/uninstall:88b9492f-c019-492c-8aeb-f325a7e4cf23"]);
}

// NOTE: We could also use { shell: true } to let windows find the .cmd, but that breaks
// ENOENT checking and handles spaces poorly in some cases.
const isCmdOnWindows = ["code", "code-insiders", "npm"];

function run(command: string, commandArgs: string[], options?: SpawnSyncOptionsWithBufferEncoding) {
  if (args.debug) {
    console.log(`> ${command} ${commandArgs.join(" ")}\n`);
  }

  const baseCommandName = path.basename(command);
  if (process.platform === "win32" && isCmdOnWindows.includes(command)) {
    command += ".cmd";
  }

  const proc = spawnSync(command, commandArgs, {
    stdio: "inherit",
    ...(options ?? {}),
  });

  if (proc.error) {
    if ((proc.error as any).code === "ENOENT") {
      console.error(`error: Command '${baseCommandName}' not found.`);
      if (args.debug) {
        console.log(proc.error.stack);
      }
      process.exit(1);
    } else {
      throw proc.error;
    }
  }

  if (proc.status !== 0) {
    console.error(
      `error: Command '${baseCommandName} ${commandArgs.join(" ")}' failed with exit code ${
        proc.status
      }.`
    );
    process.exit(proc.status || 1);
  }

  return proc;
}

async function main() {
  console.log(`ADL compiler v${adlVersion}\n`);
  const command = args._[0];
  let options: CompilerOptions;
  let action: string | number;

  switch (command) {
    case "compile":
      options = await getCompilerOptions();
      await compileInput(options);
      break;
    case "generate":
      options = await getCompilerOptions();
      await compileInput(options, false);
      if (args.client) {
        await generateClient(options);
      }
      break;
    case "code":
      action = args._[1];
      switch (action) {
        case "install":
          await installVSCodeExtension();
          break;
        case "uninstall":
          await uninstallVSCodeExtension();
          break;
      }
      break;
    case "vs":
      action = args._[1];
      switch (action) {
        case "install":
          await installVSExtension();
          break;
        case "uninstall":
          await uninstallVSExtension();
          break;
      }
      break;
    case "format":
      await formatADLFiles(args["include"]!, { debug: args.debug });
      break;
  }
}

main()
  .then(() => {})
  .catch((err) => {
    // NOTE: An expected error, like one thrown for bad input, shouldn't reach
    // here, but be handled somewhere else. If we reach here, it should be
    // considered a bug and therefore we should not suppress the stack trace as
    // that risks losing it in the case of a bug that does not repro easily.
    console.error("Internal compiler error!");
    console.error("File issue at https://github.com/azure/adl");
    dumpError(err, console.error);
    process.exit(1);
  });
