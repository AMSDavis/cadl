// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Cadl.ProviderHub.Controller
{
    /// <summary>
    /// Class for ARM tracked resource
    /// </summary>
    public class TrackedResource : ResourceBase
    {
        /// <summary>
        /// Gets or sets the resource location
        /// </summary>
        public string Location { get; set;}

        /// <summary>
        /// Gets or sets the tags
        /// </summary>
        public IDictionary<string, string> Tags { get; set;} = new Dictionary<string, string>(StringComparer.InvariantCultureIgnoreCase);
    }

    /// <summary>
    /// Class for ARM tracked resource
    /// </summary>
    /// <typeparam name="T">Type of the resource properties</typeparam>
    public class TrackedResource<T> : TrackedResource where T: class
    {
        /// <summary>
        /// Gets or sets the resource properties
        /// </summary>
        public T Properties { get; set;}
    }
}
