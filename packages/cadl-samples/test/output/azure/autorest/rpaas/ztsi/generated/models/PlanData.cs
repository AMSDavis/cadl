// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// Billing plan information. 
    /// </summary>
    public class PlanData 
    {
        /// <summary>
        ///  different usage type like PAYG/COMMITTED. this could be enum 
        /// </summary>
        [Length(50)]
        public string UsageType { get; set; }

        /// <summary>
        ///  different billing cycles like MONTHLY/WEEKLY. this could be enum 
        /// </summary>
        [Length(50)]
        public string BillingCycle { get; set; }

        /// <summary>
        ///  plan id as published by Dynatrace 
        /// </summary>
        [Length(50)]
        public string PlanDetails { get; set; }

        /// <summary>
        ///  date when plan was applied 
        /// </summary>
        public DateTime EffectiveDate { get; set; }

    }
}
