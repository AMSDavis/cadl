// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// The response of a ZTSIResource list operation. 
    /// </summary>
    public class ZTSIResourceListResult : Pageable<ZTSIResource> 
    {
    }
}
