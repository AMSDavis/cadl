// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Single sign-on configurations for a given monitor resource. 
    /// </summary>
    public class DynatraceSingleSignOnResource : ProxyResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public DynatraceSingleSignOnProperties Properties { get; set; }

    }
}
