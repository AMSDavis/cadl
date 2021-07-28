//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Adl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.FluidRelay.Service.Models
{
    /// <summary>
    /// The updatable properties of the FluidRelayServer. 
    /// </summary>
    public class FluidRelayServerUpdate    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }
        /// <summary>
        ///  The updatable properties of FluidRelayServerProperties 
        /// </summary>
        public FluidRelayServerUpdateProperties Properties { get; set; }
    }
}
