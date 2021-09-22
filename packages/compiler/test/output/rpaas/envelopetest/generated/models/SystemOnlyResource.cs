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
    /// Concrete tracked resource types can be created by aliasing this type using a specific property type. 
    /// </summary>
    public class SystemOnlyResource : TrackedResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public SystemOnlyProperties Properties { get; set; }

        /// <summary>
        ///  The managed service identities assigned to this resource. 
        /// </summary>
        public ManagedSystemIdentityProperties Identity { get; set; }

    }
}
