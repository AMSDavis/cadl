// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// Properties specific to the ztsi resource. 
    /// </summary>
    public class ZTSIProperties 
    {
        /// <summary>
        ///  User info. 
        /// </summary>
        public UserInfo UserInfo { get; set; }

        /// <summary>
        ///  Billing plan information. 
        /// </summary>
        public PlanData PlanData { get; set; }

        /// <summary>
        ///  Provisioning state of the resource. 
        /// </summary>
        public ProvisioningState ProvisioningState { get; set; }

    }
}
