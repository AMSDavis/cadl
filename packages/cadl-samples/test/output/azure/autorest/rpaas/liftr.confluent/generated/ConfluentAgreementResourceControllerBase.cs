// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using System;
using System.Net;
using System.Threading.Tasks;
using Cadl.ProviderHubController.Common;
using Microsoft.Confluent.Service.Models;
using Microsoft.Confluent.Service.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microsoft.Confluent.Service
{
    /// <summary>
    /// Controller for user RP operations on the ConfluentAgreementResource resource.
    /// </summary>
    [ApiController]
    public abstract class ConfluentAgreementResourceControllerBase : ControllerBase
    {
        internal readonly ILogger<ConfluentAgreementResourceControllerBase> _logger;

        public ConfluentAgreementResourceControllerBase(ILogger<ConfluentAgreementResourceControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validate the request to Create the ConfluentAgreementResource resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The ID of the target subscription.
        /// </param>
        /// <param name="agreement">
        /// The agreement details.
        /// </param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ConfluentAgreementResourceValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, ConfluentAgreementResource agreement)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(agreement);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, agreement);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateCreate(string subscriptionId, ConfluentAgreementResource agreement)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Create the ConfluentAgreementResource resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The ID of the target subscription.
        /// </param>
        /// <param name="agreement">
        /// The agreement details.
        /// </param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ConfluentAgreementResourceEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, ConfluentAgreementResource agreement)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, agreement);
            return;
        }

        protected virtual Task OnEndCreate(string subscriptionId, ConfluentAgreementResource agreement)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Create the ConfluentAgreementResource resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The ID of the target subscription.
        /// </param>
        /// <param name="agreement">
        /// The agreement details.
        /// </param>
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

            return await OnCreateAsync(subscriptionId, agreement);

        }

        protected virtual Task<IActionResult> OnCreateAsync(string subscriptionId, ConfluentAgreementResource agreement)
        {
            return Task.FromResult(Ok() as IActionResult);
        }
    }
}
