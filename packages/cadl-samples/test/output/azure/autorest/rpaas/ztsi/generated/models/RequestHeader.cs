// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// Common information that's included in all ZTSI Agent requests. 
    /// </summary>
    public class RequestHeader 
    {
        /// <summary>
        ///  Version of the Api that's being used for the request. 
        /// </summary>
        public string ApiVersion { get; set; }

        /// <summary>
        ///  Unique identifier of the device 
        /// </summary>
        [Pattern(@"^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$")]
        public string DeviceId { get; set; }

        /// <summary>
        ///  Type of the message that follows this header 
        /// </summary>
        public string MessageType { get; set; }

    }
}
