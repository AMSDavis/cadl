// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// The details of a marketplace agreement. 
    /// </summary>
    public class ConfluentAgreementResource : ProxyResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public ConfluentAgreementResourceProperties Properties { get; set; }

    }
}
