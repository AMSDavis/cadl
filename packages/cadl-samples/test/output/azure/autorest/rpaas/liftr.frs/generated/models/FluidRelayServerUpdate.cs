// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.FluidRelay.Service.Models
{
    /// <summary>
    /// The updatable properties of the FluidRelayServer. 
    /// </summary>
    public class FluidRelayServerUpdate 
    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        /// <summary>
        ///  Provisioning states for FluidRelay RP 
        /// </summary>
        public ProvisioningState ProvisioningState { get; set; }

    }
}
