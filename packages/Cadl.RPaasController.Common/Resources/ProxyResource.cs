// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Cadl.RPaasController.Common
{
    /// <summary>
    /// Class for ARM proxy resources
    /// </summary>
    public class ProxyResource : ResourceBase
    {
    }

    /// <summary>
    /// Class for ARM proxy resources
    /// </summary>
    /// <typeparam name="T">Type of the resource properties</typeparam>
    public class ProxyResource<T> : ProxyResource where T: class
    {
        /// <summary>
        /// Gets or sets the resource properties
        /// </summary>
        public T Properties { get; set;}
    }
}
