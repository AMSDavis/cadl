// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Cadl.Providerhub.Controller
{
    /// <summary>
    /// The base class for ARM resource
    /// </summary>
    public abstract class ResourceBase
    {
        /// <summary>
        /// Gets or sets the resource id
        /// </summary>
        public string Id { get; set;}

        /// <summary>
        /// Gets or sets the resource name
        /// </summary>
        public string Name { get; set;}

        /// <summary>
        /// Gets or sets the resource type
        /// </summary>
        public string Type { get; set;}
    }
}
