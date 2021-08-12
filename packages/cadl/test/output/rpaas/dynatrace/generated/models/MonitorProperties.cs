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
    /// Properties specific to the monitor resource. 
    /// </summary>
    public class MonitorProperties    {
        /// <summary>
        ///  Status of the monitor. 
        /// </summary>
        public MonitoringStatus MonitoringStatus { get; set; }
        /// <summary>
        ///  Marketplace subscription status. 
        /// </summary>
        public MarketplaceSubscriptionStatus MarketplaceSubscriptionStatus { get; set; }
        /// <summary>
        ///  Properties of the Dynatrace environment. 
        /// </summary>
        public DynatraceEnvironmentProperties DynatraceEnvironmentProperties { get; set; }
        /// <summary>
        ///  User info. 
        /// </summary>
        public UserInfo UserInfo { get; set; }
        /// <summary>
        ///  Billing plan information. 
        /// </summary>
        public PlanData PlanData { get; set; }
        /// <summary>
        ///  Liftr Resource category. 
        /// </summary>
        public LiftrResourceCategories LiftrResourceCategory { get; set; }
        /// <summary>
        ///  The priority of the resource. 
        /// </summary>
        public int LiftrResourcePreference { get; set; }
        /// <summary>
        ///  Provisioning state of the resource. 
        /// </summary>
        public ProvisioningState ProvisioningState { get; set; }
    }
}
