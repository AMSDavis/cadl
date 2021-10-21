// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.Confluent.Service
{
    /// <summary>
    /// Controller for user RP operations on the Organization resource.
    /// </summary>
    public partial class OrganizationController : OrganizationControllerBase
    {
        public OrganizationController(ILogger<OrganizationController> logger) : base(logger)
        {
        }
    }
}
