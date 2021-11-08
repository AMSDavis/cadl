// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Net;
using System.Threading.Tasks;
using Cadl.ProviderHubController.Common;
using Microsoft.Observability.Service.Models;
using Microsoft.Observability.Service.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microsoft.Observability.Service
{
    /// <summary>
    /// Controller for user RP operations on the DynatraceSingleSignOnResource resource.
    /// </summary>
    public abstract class DynatraceSingleSignOnResourceControllerBase : ControllerBase
    {
        internal readonly ILogger<DynatraceSingleSignOnResourceControllerBase> _logger;

        public DynatraceSingleSignOnResourceControllerBase(ILogger<DynatraceSingleSignOnResourceControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validate the request to Create the DynatraceSingleSignOnResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="monitorName"> Monitor resource name</param>
        /// <param name="configurationName"> Single Sign On Configuration Name</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.DynatraceSingleSignOnResourceValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string configurationName, DynatraceSingleSignOnResource body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, monitorName, configurationName, body, Request);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string monitorName, string configurationName, DynatraceSingleSignOnResource body, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Create the DynatraceSingleSignOnResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="monitorName"> Monitor resource name</param>
        /// <param name="configurationName"> Single Sign On Configuration Name</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.DynatraceSingleSignOnResourceEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string configurationName, DynatraceSingleSignOnResource body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, monitorName, configurationName, body, Request);
            return;
        }

        protected virtual Task OnEndCreate(string subscriptionId, string resourceGroupName, string monitorName, string configurationName, DynatraceSingleSignOnResource body, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Create the DynatraceSingleSignOnResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="monitorName"> Monitor resource name</param>
        /// <param name="configurationName"> Single Sign On Configuration Name</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The DynatraceSingleSignOnResource resource.</returns>
        [HttpPut]
        [Route(ObservabilityServiceRoutes.DynatraceSingleSignOnResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(DynatraceSingleSignOnResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(DynatraceSingleSignOnResource))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string configurationName, DynatraceSingleSignOnResource body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, monitorName, configurationName, body, Request);

        }

        protected virtual Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string configurationName, DynatraceSingleSignOnResource body, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Read the DynatraceSingleSignOnResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="monitorName"> Monitor resource name</param>
        /// <param name="configurationName"> Single Sign On Configuration Name</param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.DynatraceSingleSignOnResourceValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string monitorName, string configurationName)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, monitorName, configurationName, Request);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string monitorName, string configurationName, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }


        /// <summary>
        /// Read the DynatraceSingleSignOnResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="monitorName"> Monitor resource name</param>
        /// <param name="configurationName"> Single Sign On Configuration Name</param>
        /// <returns> The DynatraceSingleSignOnResource resource.</returns>
        [HttpGet]
        [Route(ObservabilityServiceRoutes.DynatraceSingleSignOnResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(DynatraceSingleSignOnResource))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string monitorName, string configurationName)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, monitorName, configurationName, Request);

        }

        protected virtual Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string monitorName, string configurationName, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }
    }
}
