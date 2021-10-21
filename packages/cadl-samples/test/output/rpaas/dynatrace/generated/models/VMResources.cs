// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// VM Resource Ids 
    /// </summary>
    public class VMResources 
    {
        /// <summary>
        ///  VM resource ID on which agent is installed 
        /// </summary>
        [Pattern(@"\/subscriptions\/[a-z0-9\-]+\/resourceGroups\/[^\/]+\/providers\/Microsoft\.Compute\/virtualMachines\/[^\/]+")]
        public string Id { get; set; }

        /// <summary>
        ///  Version of the Dynatrace agent installed on the VM. 
        /// </summary>
        public string AgentVersion { get; set; }

    }
}
