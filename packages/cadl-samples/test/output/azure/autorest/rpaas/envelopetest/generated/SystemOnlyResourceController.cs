// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.EnvelopeTest.Service
{
    /// <summary>
    /// Controller for user RP operations on the SystemOnlyResource resource.
    /// </summary>
    public partial class SystemOnlyResourceController : SystemOnlyResourceControllerBase
    {
        public SystemOnlyResourceController(ILogger<SystemOnlyResourceController> logger) : base(logger)
        {
        }
    }
}
