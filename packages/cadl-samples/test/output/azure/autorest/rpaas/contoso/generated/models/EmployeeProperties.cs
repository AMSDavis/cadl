// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ContosoRPaas.Service.Models
{
    public class EmployeeProperties 
    {
        public int Age { get; set; }

        public string City { get; set; }

        /// <summary>
        ///  The status of the last operation. 
        /// </summary>
        public ProvisioningState ProvisioningState { get; set; }

    }
}
