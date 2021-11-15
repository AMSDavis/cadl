// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// ZTSI report given after a successful Report Request. 
    /// </summary>
    public class ZTSIReport 
    {
        /// <summary>
        ///  Base64 encoded ZTSI report information 
        /// </summary>
        public byte[] ZtsiReport { get; set; }

    }
}
