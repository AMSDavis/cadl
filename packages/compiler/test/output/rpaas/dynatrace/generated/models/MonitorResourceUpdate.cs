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
    /// The updatable properties of the MonitorResource. 
    /// </summary>
    public class MonitorResourceUpdate    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }
        /// <summary>
        ///  The updatable properties of MonitorProperties 
        /// </summary>
        public MonitorResourceUpdateProperties Properties { get; set; }
    }
}
