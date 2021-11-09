// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// ZTSI Resource 
    /// </summary>
    public class ZTSIResource : TrackedResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public ZTSIProperties Properties { get; set; }

        /// <summary>
        ///  The managed service identities assigned to this resource. 
        /// </summary>
        public ManagedIdentityProperties Identity { get; set; }

    }
}
