// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// Expected response of the Initiate Request 
    /// </summary>
    public class InitiateResponse 
    {
        /// <summary>
        ///  Service Context 
        /// </summary>
        public byte[] ServiceContext { get; set; }

        /// <summary>
        ///  Challenge/Nonce 
        /// </summary>
        public byte[] Challenge { get; set; }

        /// <summary>
        ///  List of attestations that the service requires the client to send, based on the last ZTSI report if one is available. 
        /// </summary>
        public AttestationInformation[] RequiredAttestations { get; set; }

    }
}
