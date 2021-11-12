// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.EnvelopeTest.Service.Models
{
    public class SystemOnlyProperties 
    {
        /// <summary>
        ///  The status of the last operation performed on this resource. 
        /// </summary>
        public EnvelopeProvisioningState ProvisioningState { get; set; }

    }
}