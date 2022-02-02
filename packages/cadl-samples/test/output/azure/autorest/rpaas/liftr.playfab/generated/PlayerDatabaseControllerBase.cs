// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Cadl.Providerhub.Controller;
using Microsoft.PlayFab.Service.Models;
using Microsoft.PlayFab.Service.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microsoft.PlayFab.Service
{
    /// <summary>
    /// Controller for user RP operations on the PlayerDatabase resource.
    /// </summary>
    [ApiController]
    public abstract class PlayerDatabaseControllerBase : ControllerBase
    {
        internal readonly ILogger<PlayerDatabaseControllerBase> _logger;

        public PlayerDatabaseControllerBase(ILogger<PlayerDatabaseControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validate the request to Read the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.PlayerDatabaseValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, name);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string name)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }


        /// <summary>
        /// Read the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <returns> The PlayerDatabase resource.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.PlayerDatabaseBeginRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(PlayerDatabase))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, name);

        }

        protected virtual Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string name)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Create the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <param name="body">
        /// The resource data.
        /// </param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.PlayerDatabaseValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string name, PlayerDatabase body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, name, body);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string name, PlayerDatabase body)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Create the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <param name="body">
        /// The resource data.
        /// </param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.PlayerDatabaseEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string name, PlayerDatabase body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, name, body);
            return;
        }

        protected virtual Task OnEndCreate(string subscriptionId, string resourceGroupName, string name, PlayerDatabase body)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Create the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <param name="body">
        /// The resource data.
        /// </param>
        /// <returns> The PlayerDatabase resource.</returns>
        [HttpPut]
        [Route(PlayFabServiceRoutes.PlayerDatabaseItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(PlayerDatabase))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(PlayerDatabase))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string name, PlayerDatabase body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, name, body);

        }

        protected virtual Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string name, PlayerDatabase body)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Patch the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <param name="body">
        /// The resource patch data.
        /// </param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.PlayerDatabaseValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string name, PlayerDatabaseUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, name, body);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string name, PlayerDatabaseUpdate body)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Patch the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <param name="body">
        /// The resource patch data.
        /// </param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.PlayerDatabaseEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string name, PlayerDatabaseUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, name, body);
            return;
        }

        protected virtual Task OnEndPatch(string subscriptionId, string resourceGroupName, string name, PlayerDatabaseUpdate body)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Patch the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <param name="body">
        /// The resource patch data.
        /// </param>
        /// <returns> The PlayerDatabase resource.</returns>
        [HttpPatch]
        [Route(PlayFabServiceRoutes.PlayerDatabaseItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(PlayerDatabase))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(PlayerDatabase))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string name, PlayerDatabaseUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, name, body);

        }

        protected virtual Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string name, PlayerDatabaseUpdate body)
        {
            return Task.FromResult(Ok(body) as IActionResult);
        }

        /// <summary>
        /// Validate the request to Delete the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.PlayerDatabaseValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
            var modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, name);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string name)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Delete the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.PlayerDatabaseEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, name);
            return;
        }

        protected virtual Task OnEndDelete(string subscriptionId, string resourceGroupName, string name)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Delete the PlayerDatabase resource.
        /// </summary>
        /// <param name="subscriptionId">
        /// The subscription containing the resource.
        /// </param>
        /// <param name="resourceGroupName">
        /// The resource group containing the resource.
        /// </param>
        /// <param name="name">
        /// The name of the player database resource.
        /// </param>
        /// <returns> The PlayerDatabase resource.</returns>
        [HttpDelete]
        [Route(PlayFabServiceRoutes.PlayerDatabaseItem)]
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

            return await OnDeleteAsync(subscriptionId, resourceGroupName, name);

        }

        protected virtual Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            return Task.FromResult(Ok() as IActionResult);
        }
    }
}
