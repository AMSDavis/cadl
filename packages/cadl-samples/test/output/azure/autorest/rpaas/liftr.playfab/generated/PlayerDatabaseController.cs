// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.PlayFab.Service
{
    /// <summary>
    /// Controller for user RP operations on the PlayerDatabase resource.
    /// </summary>
    public partial class PlayerDatabaseController : PlayerDatabaseControllerBase
    {
        public PlayerDatabaseController(ILogger<PlayerDatabaseController> logger) : base(logger)
        {
        }
    }
}
