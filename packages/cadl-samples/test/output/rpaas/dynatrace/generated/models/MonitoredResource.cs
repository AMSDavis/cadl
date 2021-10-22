// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Details of resource being monitored by Dynatrace monitor resource 
    /// </summary>
    public class MonitoredResource 
    {
        /// <summary>
        ///  The ARM id of the resource. 
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        ///  Flag indicating if resource is sending metrics to Dynatrace. 
        /// </summary>
        public SendingMetricsStatus SendingMetrics { get; set; }

        /// <summary>
        ///  Reason for why the resource is sending metrics (or why it is not sending). 
        /// </summary>
        public string ReasonForMetricsStatus { get; set; }

        /// <summary>
        ///  Flag indicating if resource is sending logs to Dynatrace. 
        /// </summary>
        public SendingLogsStatus SendingLogs { get; set; }

        /// <summary>
        ///  Reason for why the resource is sending logs (or why it is not sending). 
        /// </summary>
        public string ReasonForLogsStatus { get; set; }

    }
}
