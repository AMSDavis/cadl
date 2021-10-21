// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Properties of the Dynatrace environment. 
    /// </summary>
    public class DynatraceEnvironmentProperties 
    {
        /// <summary>
        ///  User id 
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        ///  Dynatrace Account Information 
        /// </summary>
        public AccountInfo AccountInfo { get; set; }

        /// <summary>
        ///  Dynatrace Environment Information 
        /// </summary>
        public EnvironmentInfo EnvironmentInfo { get; set; }

    }
}
