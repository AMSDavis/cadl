// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Properties for the Tag rules resource of a Monitor account. 
    /// </summary>
    public class MonitoringTagRulesProperties 
    {
        /// <summary>
        ///  Set of rules for sending logs for the Monitor resource. 
        /// </summary>
        public LogRules LogRules { get; set; }

        /// <summary>
        ///  Provisioning state of the resource. 
        /// </summary>
        public ProvisioningState ProvisioningState { get; set; }

    }
}
