// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Response of payload to be passed while installing VM agent. 
    /// </summary>
    public class VMExtensionPayload 
    {
        /// <summary>
        ///  API Key of the user account 
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        ///  Id of the environment created 
        /// </summary>
        public string EnvironmentId { get; set; }

    }
}
