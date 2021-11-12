// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// Request initiating the communication between ZTSI service and agent 
    /// </summary>
    public class InitiateRequestInformation 
    {
        /// <summary>
        ///  Request Header 
        /// </summary>
        public RequestHeader RequestHeader { get; set; }

        /// <summary>
        ///  ZTSI report from last RequestReport call, if any 
        /// </summary>
        public byte[] LastZtsiReport { get; set; }

    }
}