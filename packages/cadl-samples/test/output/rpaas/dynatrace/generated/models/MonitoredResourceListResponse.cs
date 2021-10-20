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
    /// List of all the resources being monitored by Dynatrace monitor resource 
    /// </summary>
    public class MonitoredResourceListResponse : Pageable<MonitoredResource> 
    {
    }
}
