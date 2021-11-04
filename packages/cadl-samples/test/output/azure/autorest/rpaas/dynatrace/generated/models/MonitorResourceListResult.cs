// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// The response of a MonitorResource list operation. 
    /// </summary>
    public class MonitorResourceListResult : Pageable<MonitorResource> 
    {
    }
}
