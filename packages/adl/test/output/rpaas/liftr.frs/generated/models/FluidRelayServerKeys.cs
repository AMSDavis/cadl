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
    /// The set of available keys for this server. 
    /// </summary>
    public class FluidRelayServerKeys    {
        /// <summary>
        ///  The primary key for this server. 
        /// </summary>
        public string Key1 { get; set; }
        /// <summary>
        ///  The secondary key for this server. 
        /// </summary>
        public string Key2 { get; set; }
    }
}
