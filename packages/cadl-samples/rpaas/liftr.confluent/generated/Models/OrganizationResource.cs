//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

// library of Cadl base constructs - need to decide whether this is generated for each service, or this is a library
using Microsoft.Cadl.RPaaS;

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// The Microsoft.Confluent/organizations resource.
    /// </summary>
    public partial class OrganizationResource : TrackedResource
    {
        /// <summary>
        /// Details of the Confluent organization.
        /// </summary>
        public OrganizationResourceProperties Properties { get; set; }
    }
}
