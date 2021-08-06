//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.FluidRelay.Service.Models
{
    /// <summary>
    /// The updatable properties of FluidRelayServerProperties 
    /// </summary>
    public class FluidRelayServerUpdateProperties    {
        /// <summary>
        ///  The Fluid tenantId for this server 
        /// </summary>
        public string FrsTenantId { get; set; }
        /// <summary>
        ///  The Fluid service endpoints for this server. 
        /// </summary>
        public FluidRelayEndpoints FluidRelayEndpoints { get; set; }
        /// <summary>
        ///  Provisioning states for FluidRelay RP 
        /// </summary>
        public ProvisioningState ProvisioningState { get; set; }
    }
}
