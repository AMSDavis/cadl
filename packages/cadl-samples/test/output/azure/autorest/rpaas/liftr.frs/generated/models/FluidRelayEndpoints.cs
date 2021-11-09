// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.FluidRelay.Service.Models
{
    /// <summary>
    /// The Fluid Relay Service endpoints for this server. 
    /// </summary>
    public class FluidRelayEndpoints 
    {
        /// <summary>
        ///  The Fluid Relay Orderer Endpoints. 
        /// </summary>
        public string[] OrdererEndpoints { get; set; }

        /// <summary>
        ///  The Fluid Relay storage endpoints. 
        /// </summary>
        public string[] StorageEndpoints { get; set; }

    }
}
