// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// The updatable properties of the ZTSIResource. 
    /// </summary>
    public class ZTSIResourceUpdate 
    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        /// <summary>
        ///  User info. 
        /// </summary>
        public UserInfo UserInfo { get; set; }

        /// <summary>
        ///  Billing plan information. 
        /// </summary>
        public PlanData PlanData { get; set; }

    }
}