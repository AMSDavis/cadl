// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.EnvelopeTest.Service.Models
{
    /// <summary>
    /// A managed identity assigned by the user. 
    /// </summary>
    public class UserAssignedIdentity 
    {
        /// <summary>
        ///  The active directory client identifier for this principal. 
        /// </summary>
        public string ClientId { get; set; }

        /// <summary>
        ///  The active directory identifier for this principal. 
        /// </summary>
        public string PrincipalId { get; set; }

    }
}
