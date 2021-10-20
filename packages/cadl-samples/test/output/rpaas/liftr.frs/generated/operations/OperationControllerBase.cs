using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.FluidRelay.Service.Models;
using Microsoft.FluidRelay.Service.Controllers;
using System.Net;

namespace Microsoft.FluidRelay.Service
{
    public abstract class OperationControllerBase : Controller
    {
        internal readonly ILogger<OperationControllerBase> _logger;

        public OperationControllerBase(ILogger<OperationControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// List all operations provided by Microsoft.FluidRelay.
        /// </summary>
        /// <returns> The list of Microsoft.FluidRelay operations.</returns>
        [HttpGet]
        [Route(FluidRelayServiceRoutes.ListOperations)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OperationListResult))]
        public async Task<OperationListResult> ListOperationsAsync()
        {
            _logger.LogInformation("ListOperationsAsync()");
            return await OnOperationListAsync(Request);
        }

        internal abstract Task<OperationListResult> OnOperationListAsync(HttpRequest request);

    }
}
