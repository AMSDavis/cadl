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
    /// Details of the FluidRelay server. 
    /// </summary>
    public class FluidRelayServer : TrackedResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public FluidRelayServerProperties Properties { get; set; }

    }
}
