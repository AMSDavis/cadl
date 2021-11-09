// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    /// <summary>
    /// ZTSI URL 
    /// </summary>
    public class ZTSIURL 
    {
        /// <summary>
        ///  URL of the ZTSI instance created as a part of the resource. 
        /// </summary>
        public string Url { get; set; }

    }
}
