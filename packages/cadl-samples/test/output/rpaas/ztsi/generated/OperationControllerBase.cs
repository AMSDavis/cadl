// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.ZeroTrustSystemIntegrity.Service.Models;
using Microsoft.ZeroTrustSystemIntegrity.Service.Controllers;
using Cadl.ProviderHubController.Common;
using System.Net;

namespace Microsoft.ZeroTrustSystemIntegrity.Service
{
    public abstract class OperationControllerBase : Controller
    {
        internal readonly ILogger<OperationControllerBase> _logger;

        public OperationControllerBase(ILogger<OperationControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// List all operations provided by Microsoft.ZeroTrustSystemIntegrity.
        /// </summary>
        /// <returns> The list of Microsoft.ZeroTrustSystemIntegrity operations.</returns>
        [HttpGet]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ListOperations)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OperationListResult))]
        public async Task<OperationListResult> ListOperationsAsync()
        {
            _logger.LogInformation("ListOperationsAsync()");
            return await OnOperationListAsync(Request);
        }

        internal abstract Task<OperationListResult> OnOperationListAsync(HttpRequest request);

    }
}
