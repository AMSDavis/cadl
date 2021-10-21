// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ContosoRPaas.Service.Models
{
    /// <summary>
    /// A ContosoRPaas resource 
    /// </summary>
    public class Employee : TrackedResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public EmployeeProperties Properties { get; set; }

    }
}
