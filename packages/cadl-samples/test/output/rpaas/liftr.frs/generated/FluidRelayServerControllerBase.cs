// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Net;
using System.Threading.Tasks;
using Cadl.ProviderHubController.Common;
using Microsoft.FluidRelay.Service.Models;
using Microsoft.FluidRelay.Service.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microsoft.FluidRelay.Service
{
    /// <summary>
    /// Controller for user RP operations on the FluidRelayServer resource.
    /// </summary>
    public abstract class FluidRelayServerControllerBase : ControllerBase
    {
        internal readonly ILogger<FluidRelayServerControllerBase> _logger;

        public FluidRelayServerControllerBase(ILogger<FluidRelayServerControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validate the request to Read the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, name, Request);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string name, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }


        /// <summary>
        /// Read the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpGet]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServer))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, name, Request);

        }

        protected virtual Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string name, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Create the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, name, body, Request);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Create the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, name, body, Request);
            return;
        }

        protected virtual Task OnEndCreate(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Create the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpPut]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServer))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(FluidRelayServer))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, name, body, Request);

        }

        protected virtual Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Patch the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, name, body, Request);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Patch the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, name, body, Request);
            return;
        }

        protected virtual Task OnEndPatch(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Patch the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpPatch]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServer))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(FluidRelayServer))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, name, body, Request);

        }

        protected virtual Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Delete the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
            var modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, name, Request);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string name, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Delete the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, name, Request);
            return;
        }

        protected virtual Task OnEndDelete(string subscriptionId, string resourceGroupName, string name, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Delete the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> The resource name.</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpDelete]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public async Task<IActionResult> BeginDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation("DeleteAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, name, Request);

        }

        protected virtual Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string name, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// RegenerateKey the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The ID of the target subscription.</param>
        /// <param name="resourceGroupName"> The name of the resource group. The name is case insensitive.</param>
        /// <param name="name"> The resource name.</param>
        /// <param name="parameters"> The details of the key generation request.</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItemRegenerateKey)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServerKeys))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(FluidRelayServerKeys))]
        public async Task<IActionResult> BeginRegenerateKeyAsync(string subscriptionId, string resourceGroupName, string name, RegenerateKeyRequest parameters)
        {
            _logger.LogInformation("RegenerateKeyAsync()");
            parameters = parameters ?? throw new ArgumentNullException(nameof(parameters));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnRegenerateKeyAsync(subscriptionId, resourceGroupName, name, parameters, Request);

        }

        protected virtual Task<IActionResult> OnRegenerateKeyAsync(string subscriptionId, string resourceGroupName, string name, RegenerateKeyRequest parameters, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// GetKeys the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> The ID of the target subscription.</param>
        /// <param name="resourceGroupName"> The name of the resource group. The name is case insensitive.</param>
        /// <param name="name"> The resource name.</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItemGetKeys)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServerKeys))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(FluidRelayServerKeys))]
        public async Task<IActionResult> BeginGetKeysAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation("GetKeysAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnGetKeysAsync(subscriptionId, resourceGroupName, name, Request);

        }

        protected virtual Task<IActionResult> OnGetKeysAsync(string subscriptionId, string resourceGroupName, string name, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }
    }
}
