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
    /// The response of a FluidRelayServer list operation. 
    /// </summary>
    public class FluidRelayServerListResult : Pageable<FluidRelayServer> 
    {
    }
}
