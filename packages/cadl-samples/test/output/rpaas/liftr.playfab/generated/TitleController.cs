// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.PlayFab.Service
{
    /// <summary>
    /// Controller for user RP operations on the Title resource.
    /// </summary>
    public partial class TitleController : TitleControllerBase
    {
        public TitleController(ILogger<TitleController> logger) : base(logger)
        {
        }
    }
}
