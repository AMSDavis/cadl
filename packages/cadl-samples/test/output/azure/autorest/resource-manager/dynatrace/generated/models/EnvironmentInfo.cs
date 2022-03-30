// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using Microsoft.Cadl.ProviderHub.Controller;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Dynatrace Environment Information
    /// </summary>
    public class EnvironmentInfo 
    {
        /// <summary>
        /// Id of the environment created
        /// </summary>
        public string EnvironmentId { get; set; }

        /// <summary>
        /// Ingestion key of the environment
        /// </summary>
        public string IngestionKey { get; set; }

        /// <summary>
        /// Ingestion endpoint used for sending logs
        /// </summary>
        public string LogsIngestionEndpoint { get; set; }
    }
}
