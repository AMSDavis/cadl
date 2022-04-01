// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using Microsoft.Cadl.ProviderHub.Controller;
using System;
using System.Security.Policy;
using System.Collections.Generic; 
using Newtonsoft.Json;

namespace Microsoft.DiscriminatorTest.Service.Models
{
    [Discriminator(DiscriminatorPropertyName, DiscriminatorValue)]
    [JsonConverter(typeof(DiscriminatorJsonConverter<EmployeeRole>))]
    public class ManagerRole : EmployeeRole 
    {
        // Discriminator value
        const string DiscriminatorValue = "Manager";

        /// <summary>
        /// Initializes a new instance of the ManagerRole class.
        /// </summary>
        public ManagerRole()
        {
            RoleType = DiscriminatorValue;
        }

        public string RoleType { get; set; }

        public int TeamSize { get; set; }
    }
}