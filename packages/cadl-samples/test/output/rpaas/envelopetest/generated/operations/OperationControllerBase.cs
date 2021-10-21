using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.EnvelopeTest.Service.Models;
using Microsoft.EnvelopeTest.Service.Controllers;
using System.Net;

namespace Microsoft.EnvelopeTest.Service
{
    public abstract class OperationControllerBase : Controller
    {
        internal readonly ILogger<OperationControllerBase> _logger;

        public OperationControllerBase(ILogger<OperationControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// List all operations provided by Microsoft.EnvelopeTest.
        /// </summary>
        /// <returns> The list of Microsoft.EnvelopeTest operations.</returns>
        [HttpGet]
        [Route(EnvelopeTestServiceRoutes.ListOperations)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OperationListResult))]
        public async Task<OperationListResult> ListOperationsAsync()
        {
            _logger.LogInformation("ListOperationsAsync()");
            return await OnOperationListAsync(Request);
        }

        internal abstract Task<OperationListResult> OnOperationListAsync(HttpRequest request);

    }
}
