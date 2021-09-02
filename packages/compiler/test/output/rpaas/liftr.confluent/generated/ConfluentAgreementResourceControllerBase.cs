using Microsoft.Cadl.RPaaS;
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
        }

        /// <summary>
        /// Validate the request to Read the ConfluentAgreementResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ConfluentAgreementResourceValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, Request);
            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateRead(string subscriptionId, HttpRequest request);


        /// <summary>
        /// Read the ConfluentAgreementResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <returns> The ConfluentAgreementResource resource.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.ConfluentAgreementResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ConfluentAgreementResource))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, Request);

        }

        internal abstract Task<IActionResult> OnReadAsync(string subscriptionId, HttpRequest request);

        /// <summary>
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
            var modelValidation = ValidationHelpers.ValidateModel(agreement);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, agreement, Request);
            }

            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, ConfluentAgreementResource agreement, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Create the ConfluentAgreementResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="agreement"> undefined</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ConfluentAgreementResourceEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, ConfluentAgreementResource agreement)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, agreement, Request);
            return;
        }

        internal abstract Task OnEndCreate(string subscriptionId, ConfluentAgreementResource agreement, HttpRequest request);

        /// <summary>
        /// Create the ConfluentAgreementResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="agreement"> undefined</param>
        /// <returns> The ConfluentAgreementResource resource.</returns>
        [HttpPut]
        [Route(ConfluentServiceRoutes.ConfluentAgreementResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ConfluentAgreementResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(ConfluentAgreementResource))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, ConfluentAgreementResource agreement)
        {
            _logger.LogInformation("CreateAsync()");
            agreement = agreement ?? throw new ArgumentNullException(nameof(agreement));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, agreement, Request);

        }

        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, ConfluentAgreementResource agreement, HttpRequest request);
    }
}
