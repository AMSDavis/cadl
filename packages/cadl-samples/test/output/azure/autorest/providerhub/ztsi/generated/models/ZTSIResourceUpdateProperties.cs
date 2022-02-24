// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using Microsoft.Cadl.ProviderHub.Controller;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// The updatable properties of ZTSIProperties
    /// </summary>
    public class ZTSIResourceUpdateProperties 
    {
        /// <summary>
        /// User info.
        /// </summary>
        public UserInfo UserInfo { get; set; }

        /// <summary>
        /// Billing plan information.
        /// </summary>
        public PlanData PlanData { get; set; }

    }
}
