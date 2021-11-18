using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Linq;
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
        /// List of language files generated by cadl-rpaas-controller. 
        /// </summary>
        [Output]
        public ITaskItem[] GeneratedFiles { get; private set; }


        /// <summary>
        /// The Operation system ,  Window_NT or Linux . 
        /// </summary>
        [Required]
        public string OS { get; set; }

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
            cmd.AddArg(Path.GetDirectoryName(CadlPath[0].ItemSpec));
            cmd.AddSwitchMaybe("output-path", OutputDir);

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
                Log.LogError("Found over 1 cadl paths:" + String.Join(",",cadlParentPaths));
                return false;
            }

            bool ok = base.Execute();
            if (!ok)
            {
                return false;
            }

            if (OutputDir != null)
            {
                var generatedDir = Path.GetFullPath(Path.Combine(OutputDir, "generated"));
                // format the relative path, './generate' to 'genearted'
                if (generatedDir.StartsWith(Environment.CurrentDirectory)) {
                  generatedDir = generatedDir.Substring(Environment.CurrentDirectory.Length + 1);
                }
                var generateCsFiles = getCsFiles(generatedDir);
                GeneratedFiles = new ITaskItem[generateCsFiles.Length];
                for (int i = 0; i < generateCsFiles.Length; i++)
                {
                    GeneratedFiles[i] = new TaskItem(generateCsFiles[i]);
                }
            }

            return true;
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

    }
}
