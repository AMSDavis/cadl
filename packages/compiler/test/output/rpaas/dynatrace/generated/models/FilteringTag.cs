//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// The definition of a filtering tag. Filtering tags are used for capturing resources and include/exclude them from being monitored. 
    /// </summary>
    public class FilteringTag 
    {
        /// <summary>
        ///  The name (also known as the key) of the tag. 
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        ///  The value of the tag. 
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        ///  Valid actions for a filtering tag. Exclusion takes priority over inclusion. 
        /// </summary>
        public TagAction Action { get; set; }

    }
}
