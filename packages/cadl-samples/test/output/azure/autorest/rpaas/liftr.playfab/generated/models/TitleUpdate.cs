// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.PlayFab.Service.Models
{
    /// <summary>
    /// The updatable properties of the Title. 
    /// </summary>
    public class TitleUpdate 
    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        /// <summary>
        ///  The provisioning state of the resource. 
        /// </summary>
        public ResourceProvisioningState ProvisioningState { get; set; }

    }
}
