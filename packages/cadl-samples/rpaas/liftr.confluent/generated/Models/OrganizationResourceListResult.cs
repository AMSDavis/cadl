//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// The list of Microsoft.Confluent/organizatiosn resources.
    /// </summary>
    public partial class OrganizationResourceListResult : Pageable<OrganizationResource>
    {
        public OrganizationResourceListResult()
        {
        }
    }
}
