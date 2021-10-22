// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.EnvelopeTest.Service.Models
{
    /// <summary>
    /// The properties of the service-assigned identity associated with this resource/ 
    /// </summary>
    public class ManagedSystemIdentityProperties 
    {
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
        public ManagedSystemIdentityType Type { get; set; }

    }
}
