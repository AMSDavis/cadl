using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.Build.Framework;
using Microsoft.Build.Utilities;

namespace Cadl.Tools
{
    public class CadlCompiler : ToolTask
    {
        /// <summary>
        /// Generated code directory.
        /// </summary>
        [Required]
        public string OutputDir { get; set; }

        /// <summary>
        /// Generated service code directory.
        /// </summary>
       private string serviceCodePath { get; set; }


        /// <summary>
        /// List of language files generated by cadl-providerhub-controller. 
        /// </summary>
        [Output]
        public ITaskItem[] GeneratedFiles { get; private set; }


        /// <summary>
        /// The Operation system ,  Window_NT or Linux . 
        /// </summary>
        [Required]
        public string OS { get; set; }

        /// <summary>
        /// The args that use --option to pass to the cadl compiler, the value is following 'key=value' 
        /// </summary>
        public string[] Options { get; set; }

        /// <summary>
        /// The args that use --import to pass to the cadl compiler, can be specified multiple times.
        /// </summary>
        public string[] Imports { get; set; }

        /// <summary>
        /// The args that use --emit to pass to the cadl compiler, can be specified multiple times.
        /// </summary>
        [Required]
        public string[] Emitters { get; set; }

        class CadlCommandBuilder
        {
            StringBuilder _data = new System.Text.StringBuilder(1000);
            public override string ToString() => _data.ToString();

            // If 'value' is not empty, append ' --name=value'.
            public void AddSwitchMaybe(string name, string value)
            {
                if (!string.IsNullOrEmpty(value))
                {
                    _data.Append(" --").Append(name).Append("=")
                         .Append(value);
                }
            }

            public void AddArg(string arg)
            {
                _data.Append(' ').Append(arg);
            }
        };


        /// <summary>
        ///  generate the cadl command to execute, like  `cadl compile  ./cadl --output-path=. ` 
        /// </summary>    
        protected override string GenerateCommandLineCommands()
        {
            var cmd = new CadlCommandBuilder();
            cmd.AddArg("compile");
            // should switch to current folder.
            cmd.AddArg(".");
            cmd.AddSwitchMaybe("output-path", OutputDir);
            if (Options != null){
              foreach (var option in Options) {
                // ensure option is following: key=value
                if (option.Contains("=")) {
                  cmd.AddSwitchMaybe("option", option);
                  var slices = option.Split('=');
                  if (slices[0].Equals("serviceCodePath") && !slices[1].Equals("")) {
                    this.serviceCodePath = slices[1];
                  }
                }
              }
            }
            if (Imports != null) {
              foreach (var import in Imports) {
                cmd.AddSwitchMaybe("import", import);
              }
            }

            if (Emitters != null) {
              foreach (var emitter in Emitters) {
                cmd.AddSwitchMaybe("emit", emitter);
              }
            }
            Log.LogMessage(cmd.ToString());
            return cmd.ToString();
        }

        /// <summary>
        /// search in the generated folder to get all the output cs files . 
        /// </summary>
        public string[] getCsFiles(string root)
        {
            if (!Directory.Exists(root))
            {
                throw new ArgumentException();
            }
            var generatedFiles = new List<string>();
            string[] files;
            try {
              files = Directory.GetFiles(root, "*.cs",SearchOption.AllDirectories);
              foreach (string file in files) {
                  generatedFiles.Add(file);
              }
            } catch (Exception e) {
              Log.LogError(e.Message);
            }
            return generatedFiles.ToArray();
        }
        /// <summary>
        /// this is the task entry
        /// </summary>
        public override bool Execute()
        {
            base.UseCommandProcessor = false;

            var cadlParentPaths = CadlPath.Select(path => Path.GetDirectoryName(path.ItemSpec)).Distinct().ToArray();
            if (cadlParentPaths.Length > 1)
            {
                Log.LogError("Found over 1 cadl folders:" + String.Join(",",cadlParentPaths));
                return false;
            }
            try {
              Directory.SetCurrentDirectory(cadlParentPaths[0]);
            }
            catch (DirectoryNotFoundException e) {
              Log.LogError(e.ToString());
              return false;
            }

            bool ok = base.Execute();
            if (!ok)
            {
                return false;
            }
            var outputDir = this.serviceCodePath != null ? this.serviceCodePath : this.OutputDir;
            if (outputDir != null)
            {
                var generatedDir = Path.Combine(outputDir, "generated");
                var generateCsFiles = getCsFiles(generatedDir);
                GeneratedFiles = new ITaskItem[generateCsFiles.Length];
                for (int i = 0; i < generateCsFiles.Length; i++)
                {
                    GeneratedFiles[i] = new TaskItem(generateCsFiles[i]);
                }
            }

            return true;
        }

        protected override void LogEventsFromTextOutput(string singleLine, MessageImportance messageImportance) {

          foreach (CadlLogFilter filter in cadlLogFilters) {
            Match match = filter.Pattern.Match(singleLine);
            if (match.Success) {
              filter.LogAction(Log, match);
              return;
            }
          }
          base.LogEventsFromTextOutput(singleLine, messageImportance);
        }

        protected override string ToolName => OS.Equals("Windows_NT") ? "cadl.cmd" : "cadl";


        /// <summary>
        /// The input cadl files for the Task . 
        /// </summary>

        [Required]
        public ITaskItem[] CadlPath { get; set; }

        protected override string GenerateFullPathToTool() => ToolExe;

        protected override MessageImportance StandardErrorLoggingImportance => MessageImportance.High;

        protected override bool ValidateParameters() => true;

        static readonly List<CadlLogFilter> cadlLogFilters = new List<CadlLogFilter>()
        {
            // Example of warning filter
            //C:\code\cadl\main.cadl:33:1 - warning @azure-tools/cadl-providerhub/model-requires-documentation: The model must have a documentation or description, please use decorator @doc to add it.
            new CadlLogFilter
            {
                Pattern = new Regex(
                    pattern: "^(?'FILENAME'.+?):(?'LINE'\\d+):(?'COLUMN'\\d+) - warning (?'CODE'.+?): ?(?'TEXT'.*)",
                    options: RegexOptions.Compiled | RegexOptions.IgnoreCase),
                LogAction = (log, match) =>
                {
                    int.TryParse(match.Groups["LINE"].Value, out var line);
                    int.TryParse(match.Groups["COLUMN"].Value, out var column);

                    log.LogWarning(
                        subcategory: null,
                        warningCode: match.Groups["CODE"].Value,
                        helpKeyword: null,
                        file: match.Groups["FILENAME"].Value,
                        lineNumber: line,
                        columnNumber: column,
                        endLineNumber: 0,
                        endColumnNumber: 0,
                        message: match.Groups["TEXT"].Value);
                }
            },

            // Example of error filter
            //C:\code\cadl\main.cadl:33:1 - error @azure-tools/cadl-providerhub/missing-required-prop: Resource configuration is missing required 'parameterType' property
            new CadlLogFilter
            {
                Pattern = new Regex(
                    pattern: "^(?'FILENAME'.+?):(?'LINE'\\d+):(?'COLUMN'\\d+) - error (?'CODE'.+?): ?(?'TEXT'.*)",
                    options: RegexOptions.Compiled | RegexOptions.IgnoreCase),
                LogAction = (log, match) =>
                {
                    int.TryParse(match.Groups["LINE"].Value, out var line);
                    int.TryParse(match.Groups["COLUMN"].Value, out var column);

                    log.LogError(
                        subcategory: null,
                        errorCode: match.Groups["CODE"].Value,
                        helpKeyword: null,
                        file: match.Groups["FILENAME"].Value,
                        lineNumber: line,
                        columnNumber: column,
                        endLineNumber: 0,
                        endColumnNumber: 0,
                        message: match.Groups["TEXT"].Value);
                }
            }
        };

        class CadlLogFilter {
          public Regex Pattern { get; set; }
          public Action<TaskLoggingHelper, Match> LogAction { get; set; }
        }
    }
}
