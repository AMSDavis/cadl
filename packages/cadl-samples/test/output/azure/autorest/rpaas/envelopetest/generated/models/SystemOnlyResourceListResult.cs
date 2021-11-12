// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.EnvelopeTest.Service.Models
{
    /// <summary>
    /// The response of a SystemOnlyResource list operation. 
    /// </summary>
    public class SystemOnlyResourceListResult : Pageable<SystemOnlyResource> 
    {
    }
}