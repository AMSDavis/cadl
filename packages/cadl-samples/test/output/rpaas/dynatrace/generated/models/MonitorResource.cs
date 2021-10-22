// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Dynatrace Monitor Resource 
    /// </summary>
    public class MonitorResource : TrackedResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public MonitorProperties Properties { get; set; }

        /// <summary>
        ///  The managed service identities assigned to this resource. 
        /// </summary>
        public ManagedIdentityProperties Identity { get; set; }

    }
}
