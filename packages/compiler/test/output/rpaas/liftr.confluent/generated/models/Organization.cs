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
    /// Details of the Confluent organization. 
    /// </summary>
    public class Organization : TrackedResource    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public OrganizationProperties Properties { get; set; }
    }
}
