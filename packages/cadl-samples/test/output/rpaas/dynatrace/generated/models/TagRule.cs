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
    /// Tag rules for a monitor resource 
    /// </summary>
    public class TagRule : ProxyResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public MonitoringTagRulesProperties Properties { get; set; }

    }
}
