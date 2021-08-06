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
    /// Specifies which key should be generated. 
    /// </summary>
    public class RegenerateKeyRequest    {
        /// <summary>
        ///  The key to regenerate. 
        /// </summary>
        public KeyName KeyName { get; set; }
    }
}
