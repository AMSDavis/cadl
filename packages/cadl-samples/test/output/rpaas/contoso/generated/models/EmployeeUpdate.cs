// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ContosoRPaas.Service.Models
{
    /// <summary>
    /// The updatable properties of the Employee. 
    /// </summary>
    public class EmployeeUpdate 
    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        public int Age { get; set; }

        public string City { get; set; }

    }
}
