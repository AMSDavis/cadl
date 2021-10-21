//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.EnvelopeTest.Service.Models
{
    /// <summary>
    /// The updatable properties of the SystemOnlyResource. 
    /// </summary>
    public class SystemOnlyResourceUpdate 
    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        /// <summary>
        ///  The status of the last operation performed on this resource. 
        /// </summary>
        public EnvelopeProvisioningState ProvisioningState { get; set; }

    }
}
