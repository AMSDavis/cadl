﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Cadl.RPaasController.Common
{
    /// <summary>
    /// A collection of values that may take multiple service requests to iterate over.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class Pageable<T> where T: class
    {
        /// <summary>
        /// Gets the collection of values
        /// </summary>
        public IEnumerable<T> Values { get; set; }

        /// <summary>
        /// Gets the
        /// </summary>
        public Uri NextLink { get; set; }
    }
}
