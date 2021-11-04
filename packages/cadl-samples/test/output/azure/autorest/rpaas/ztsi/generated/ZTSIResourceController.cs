// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.ZeroTrustSystemIntegrity.Service
{
    /// <summary>
    /// Controller for user RP operations on the ZTSIResource resource.
    /// </summary>
    public partial class ZTSIResourceController : ZTSIResourceControllerBase
    {
        public ZTSIResourceController(ILogger<ZTSIResourceController> logger) : base(logger)
        {
        }
    }
}
