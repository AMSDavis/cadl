// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Net;
using System.Threading.Tasks;
using Cadl.ProviderHubController.Common;
using Microsoft.EnvelopeTest.Service.Models;
using Microsoft.EnvelopeTest.Service.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microsoft.EnvelopeTest.Service
{
    /// <summary>
    /// Controller for user RP operations on the SystemOnlyResource resource.
    /// </summary>
    public abstract class SystemOnlyResourceControllerBase : ControllerBase
    {
        internal readonly ILogger<SystemOnlyResourceControllerBase> _logger;

        public SystemOnlyResourceControllerBase(ILogger<SystemOnlyResourceControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validate the request to Read the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, systemOnlyPropertiesName, Request);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }


        /// <summary>
        /// Read the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <returns> The SystemOnlyResource resource.</returns>
        [HttpGet]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(SystemOnlyResource))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, systemOnlyPropertiesName, Request);

        }

        protected virtual Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Create the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResource body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, systemOnlyPropertiesName, body, Request);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResource body, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Create the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResource body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, systemOnlyPropertiesName, body, Request);
            return;
        }

        protected virtual Task OnEndCreate(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResource body, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Create the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The SystemOnlyResource resource.</returns>
        [HttpPut]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(SystemOnlyResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(SystemOnlyResource))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResource body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, systemOnlyPropertiesName, body, Request);

        }

        protected virtual Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResource body, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Patch the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResourceUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, systemOnlyPropertiesName, body, Request);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResourceUpdate body, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Patch the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResourceUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, systemOnlyPropertiesName, body, Request);
            return;
        }

        protected virtual Task OnEndPatch(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResourceUpdate body, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Patch the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The SystemOnlyResource resource.</returns>
        [HttpPatch]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(SystemOnlyResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(SystemOnlyResource))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResourceUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, systemOnlyPropertiesName, body, Request);

        }

        protected virtual Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, SystemOnlyResourceUpdate body, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Delete the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
            var modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, systemOnlyPropertiesName, Request);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Delete the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, systemOnlyPropertiesName, Request);
            return;
        }

        protected virtual Task OnEndDelete(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Delete the SystemOnlyResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="systemOnlyPropertiesName"> The name of the all properties resource.</param>
        /// <returns> The SystemOnlyResource resource.</returns>
        [HttpDelete]
        [Route(EnvelopeTestServiceRoutes.SystemOnlyResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public async Task<IActionResult> BeginDeleteAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName)
        {
            _logger.LogInformation("DeleteAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, systemOnlyPropertiesName, Request);

        }

        protected virtual Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string systemOnlyPropertiesName, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }
    }
}
