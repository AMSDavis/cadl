// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using Microsoft.Cadl.ProviderHub.Controller;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.ContosoProviderHub.Service.Models
{
    /// <summary>
    /// The updatable properties of the Employee.
    /// </summary>
    public class EmployeeUpdate 
    {
        /// <summary>
        /// Resource tags.
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        public EmployeeUpdateProperties Properties { get; set; }

    }
}
