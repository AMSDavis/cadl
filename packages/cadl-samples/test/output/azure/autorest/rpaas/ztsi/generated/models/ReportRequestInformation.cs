// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// ZTSI Report request information. 
    /// </summary>
    public class ReportRequestInformation 
    {
        /// <summary>
        ///  Request Header. 
        /// </summary>
        public RequestHeader RequestHeader { get; set; }

        /// <summary>
        ///  Service Context 
        /// </summary>
        public byte[] ServiceContext { get; set; }

        /// <summary>
        ///  Challenge given by the service in InitiateRequest response 
        /// </summary>
        public byte[] Challenge { get; set; }

        /// <summary>
        ///  List of attestations the service had required from the client 
        /// </summary>
        public AttestationInformation[] Attestations { get; set; }

        public byte[] EphemeralKeyPub { get; set; }

        public byte[] EphemeralKeySignature { get; set; }

    }
}
