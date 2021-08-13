//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// The updatable properties of the Organization. 
    /// </summary>
    public class OrganizationUpdate    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }
        /// <summary>
        ///  The updateable properties of OrganizationProperties 
        /// </summary>
        public OrganizationUpdateProperties Properties { get; set; }
    }
}
