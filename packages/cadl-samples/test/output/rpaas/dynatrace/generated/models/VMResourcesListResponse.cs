// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Response of a list VM Host Update Operation. 
    /// </summary>
    public class VMResourcesListResponse : Pageable<VMResources> 
    {
    }
}
