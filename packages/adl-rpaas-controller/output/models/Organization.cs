//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Adl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// Details of the subscriber.
    /// </summary>
    public class Organization : TrackedResource
    {
    
        public OrganizationProperties Properties { get; set; }
    }
}
