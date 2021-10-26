// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// Microsoft Azure Attestation Endpoint 
    /// </summary>
    public class MAAURL 
    {
        /// <summary>
        ///  URL of the MAA instance that ztsi is using for attestation. 
        /// </summary>
        public string Url { get; set; }

    }
}
