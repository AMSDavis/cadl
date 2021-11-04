// ------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ------------------------------------------------------------

namespace {Provider}.Helpers
{
    using System;
    using System.Runtime.Serialization;

    /// <summary>
    /// The deployment environment class.
    /// </summary>
    public static class DeploymentEnvironmentHelper
    {
        /// <summary>
        /// Available environment options.
        /// </summary>
        public enum DeploymentEnvironmentName
        {
            /// <summary>
            /// VisualStudio development environment.
            /// </summary>
            [EnumMember]
            Development,

            /// <summary>
            /// Dogfood environment.
            /// </summary>
            [EnumMember]
            Dogfood,

            /// <summary>
            /// Production environment.
            /// </summary>
            [EnumMember]
            Production,
        }

        /// <summary>
        /// Gets the current running environment.
        /// </summary>
        public static string GetEnvironment()
        {
            return string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")) ?
                DeploymentEnvironmentName.Production.ToString() :
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        }

        /// <summary>
        /// Sets the current running environment.
        /// </summary>
        /// <param name="deploymentEnvironmentName"> Deployment environment name. </param>
        public static void SetEnvironment(DeploymentEnvironmentName deploymentEnvironmentName)
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", deploymentEnvironmentName.ToString());
        }

        /// <summary>
        /// Tells if the current environment is development.
        /// </summary>
        public static bool IsDevelopment()
        {
            return DeploymentEnvironmentHelper.GetEnvironment()
                .Equals(DeploymentEnvironmentName.Development.ToString(), StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Tells if the current environment is dogfood.
        /// </summary>
        public static bool IsDogfood()
        {
            return DeploymentEnvironmentHelper.GetEnvironment()
                .Equals(DeploymentEnvironmentName.Dogfood.ToString(), StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Tells if the current environment is production.
        /// </summary>
        public static bool IsProduction()
        {
            return DeploymentEnvironmentHelper.GetEnvironment()
                .Equals(DeploymentEnvironmentName.Production.ToString(), StringComparison.OrdinalIgnoreCase);
        }
    }
}
