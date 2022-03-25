// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using Microsoft.Cadl.ProviderHub.Controller;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.FluidRelay.Service.Models
{
    /// <summary>
    /// The type used for update operations of the FluidRelayServer.
    /// </summary>
    public class FluidRelayServerUpdate 
    {
        /// <summary>
        /// ARM resource tags.
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        public FluidRelayServerUpdateProperties Properties { get; set; }

    }
}