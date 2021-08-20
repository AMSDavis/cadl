//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// VM Resource Ids 
    /// </summary>
    public class VMResources    {
        /// <summary>
        ///  VM resource ID on which agent is installed 
        /// </summary>
        [Pattern(&quot;\/subscriptions\/[a-z0-9\-]+\/resourceGroups\/[^\/]+\/providers\/Microsoft\.Compute\/virtualMachines\/[^\/]+&quot;)]
        public string Id { get; set; }
        /// <summary>
        ///  Version of the Dynatrace agent installed on the VM. 
        /// </summary>
        public string AgentVersion { get; set; }
    }
}
