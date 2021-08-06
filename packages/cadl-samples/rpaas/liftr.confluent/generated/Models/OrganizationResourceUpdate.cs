//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using System;
using System.Collections.Generic;

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// Organization Resource update properties.
    /// </summary>
    public class OrganizationResourceUpdate 
    {
        /// <summary>
        /// ARM resource tags.
        /// </summary>
        public IDictionary<string, string> Tags { get; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    }
}