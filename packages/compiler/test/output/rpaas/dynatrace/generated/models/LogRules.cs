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
    /// Set of rules for sending logs for the Monitor resource. 
    /// </summary>
    public class LogRules 
    {
        /// <summary>
        ///  Flag specifying if AAD logs should be sent for the Monitor resource. 
        /// </summary>
        public SendAadLogsStatus SendAadLogs { get; set; }

        /// <summary>
        ///  Flag specifying if subscription logs should be sent for the Monitor resource. 
        /// </summary>
        public SendSubscriptionLogsStatus SendSubscriptionLogs { get; set; }

        /// <summary>
        ///  Flag specifying if activity logs from Azure resources should be sent for the Monitor resource. 
        /// </summary>
        public SendActivityLogsStatus SendActivityLogs { get; set; }

        /// <summary>
        ///  List of filtering tags to be used for capturing logs. This only takes effect if SendActivityLogs flag is enabled. If empty, all resources will be captured.
If only Exclude action is specified, the rules will apply to the list of all available resources. If Include actions are specified, the rules will only include resources with the associated tags. 
        /// </summary>
        public FilteringTag[] FilteringTags { get; set; }

    }
}
