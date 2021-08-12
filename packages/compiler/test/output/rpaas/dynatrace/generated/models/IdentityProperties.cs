//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// The properties of the managed service identities assigned to this resource. 
    /// </summary>
    public class IdentityProperties    {
        /// <summary>
        ///  The Active Directory tenant id of the principal. 
        /// </summary>
        public string TenantId { get; set; }
        /// <summary>
        ///  The active directory identifier of this principal. 
        /// </summary>
        public string PrincipalId { get; set; }
        /// <summary>
        ///  The type of managed identity assigned to this resource. 
        /// </summary>
        public ManagedIdentityType Type { get; set; }
        /// <summary>
        ///  The identities assigned to this resource by the user. 
        /// </summary>
        public IDictionary<string, UserAssignedIdentity> UserAssignedIdentities { get; set; }
    }
}
