// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using Microsoft.Cadl.ProviderHub.Controller;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.DiscriminatorTest.Service.Models
{
    /// <summary>
    /// The updatable properties of the Employee.
    /// </summary>
    public class EmployeeUpdateProperties 
    {
        public int Age { get; set; }

        public string City { get; set; }

        public EmployeeRole Role { get; set; }

        public EmployeeType Type { get; set; }

        /// <summary>
        /// The provisioning state of the resource.
        /// </summary>
        public ResourceProvisioningState ProvisioningState { get; set; }
    }
}