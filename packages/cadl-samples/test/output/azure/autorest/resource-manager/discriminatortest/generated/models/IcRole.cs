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
    public class IcRole : EmployeeRole 
    {
        // Discriminator value
        const string DiscriminatorValue = "IC";

        /// <summary>
        /// Initializes a new instance of the IcRole class.
        /// </summary>
        public IcRole()
        {
            RoleType = DiscriminatorValue;
        }

        public string RoleType { get; set; }
    }
}
