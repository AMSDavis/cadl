// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.Observability.Service
{
    /// <summary>
    /// Controller for user RP operations on the MonitorResource resource.
    /// </summary>
    public partial class MonitorResourceController : MonitorResourceControllerBase
    {
        public MonitorResourceController(ILogger<MonitorResourceController> logger) : base(logger)
        {
        }
    }
}
