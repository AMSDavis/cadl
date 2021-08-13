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
    /// The updateable properties of FluidRelayServerProperties 
    /// </summary>
    public class FluidRelayServerUpdateProperties    {
        /// <summary>
        ///  Provisioning states for FluidRelay RP 
        /// </summary>
        public ProvisioningState ProvisioningState { get; set; }
    }
}
