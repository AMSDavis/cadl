// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using Microsoft.Cadl.ProviderHub.Controller;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// The type used for update operations of the ZTSIResource.
    /// </summary>
    public class ZTSIResourceUpdate 
    {
        /// <summary>
        /// ARM resource tags.
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        public ZTSIResourceUpdateProperties Properties { get; set; }
    }
}
