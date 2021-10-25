// ------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ------------------------------------------------------------
namespace {Provider}.Helpers
{
    using System.Diagnostics;

    /// <summary>
    /// The shell helper.
    /// </summary>
    public static class ShellHelper
    {
        /// <summary>
        /// Method that executes passed command in BASH
        /// </summary>
        /// <param name="cmd">The command to execute.</param>
        public static string Bash(string cmd)
        {
            #pragma warning disable CA1307 // Specify StringComparison
            var escapedArgs = cmd.Replace("\"", "\\\"");

            var process = new Process()
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "/bin/bash",
                    Arguments = $"-c \"{escapedArgs}\"",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                },
            };
            process.Start();
            var result = process.StandardOutput.ReadToEnd();
            process.WaitForExit();
            return result;
        }
    }
}
