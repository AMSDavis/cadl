using Microsoft.Adl.RPaaS;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Microsoft.Confluent.Service.Models;
using Microsoft.Confluent.Service.Controllers;
using System.Net;

namespace Microsoft.Confluent.Service
{
    /// <summary>
    /// Controller for user RP operations on the ConfluentAgreementResource resource.
    /// </summary>
    public abstract class ConfluentAgreementResourceControllerBase : Controller
    {
        internal readonly ILogger<ConfluentAgreementResourceControllerBase> _logger;

        public ConfluentAgreementResourceControllerBase(ILogger<ConfluentAgreementResourceControllerBase> logger)
        {
            _logger = logger;
        }        /// <summary>
        /// Validate the request to Create the ConfluentAgreementResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="agreement"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ConfluentAgreementResourceValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, ConfluentAgreementResource agreement)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, agreement, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Create the ConfluentAgreementResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="agreement"> undefined</param>
        /// <returns> The ConfluentAgreementResource resource.</returns>
        [HttpPut]
        [Route(ConfluentServiceRoutes.ConfluentAgreementResourceItemCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ConfluentAgreementResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(ConfluentAgreementResource))]
        public async Task<IActionResult> CreateAsync(string subscriptionId, ConfluentAgreementResource agreement)
        {
            _logger.LogInformation("CreateAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, agreement, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, ConfluentAgreementResource agreement, HttpRequest request);
        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, ConfluentAgreementResource agreement, HttpRequest request);
            }
}
