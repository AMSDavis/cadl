// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// Attestation information 
    /// </summary>
    public class AttestationInformation 
    {
        /// <summary>
        ///  Attestation type that this information object is refering to 
        /// </summary>
        public AttestationType AttestationType { get; set; }

        /// <summary>
        ///  Base64 encoded attestation data. 
        /// </summary>
        public byte[] AttestationData { get; set; }

    }
}
