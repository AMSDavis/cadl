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
    /// The updatable properties of the MonitorResource. 
    /// </summary>
    public class MonitorResourceUpdate    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }
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
    }
}
