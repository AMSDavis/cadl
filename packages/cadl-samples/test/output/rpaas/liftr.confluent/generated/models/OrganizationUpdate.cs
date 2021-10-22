// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// The updatable properties of the Organization. 
    /// </summary>
    public class OrganizationUpdate 
    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        /// <summary>
        ///  Details of the product offering. 
        /// </summary>
        public OfferDetail OfferDetail { get; set; }

        /// <summary>
        ///  Subscriber details. 
        /// </summary>
        public UserDetail UserDetail { get; set; }

        /// <summary>
        ///  The provisioning state of the resource. 
        /// </summary>
        public ResourceProvisioningState ProvisioningState { get; set; }

    }
}
