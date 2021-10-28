// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.FluidRelay.Service
{
    /// <summary>
    /// Controller for user RP operations on the FluidRelayServer resource.
    /// </summary>
    public partial class FluidRelayServerController : FluidRelayServerControllerBase
    {
        public FluidRelayServerController(ILogger<FluidRelayServerController> logger) : base(logger)
        {
        }
    }
}