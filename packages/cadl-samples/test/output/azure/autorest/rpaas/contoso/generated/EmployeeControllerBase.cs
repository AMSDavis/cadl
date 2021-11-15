// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using System;
using System.Net;
using System.Threading.Tasks;
using Cadl.ProviderHubController.Common;
using Microsoft.ContosoRPaas.Service.Models;
using Microsoft.ContosoRPaas.Service.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microsoft.ContosoRPaas.Service
{
    /// <summary>
    /// Controller for user RP operations on the Employee resource.
    /// </summary>
    public abstract class EmployeeControllerBase : ControllerBase
    {
        internal readonly ILogger<EmployeeControllerBase> _logger;

        public EmployeeControllerBase(ILogger<EmployeeControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validate the request to Read the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(ContosoRPaasServiceRoutes.EmployeeValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string employeeName)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, employeeName, Request);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string employeeName, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }


        /// <summary>
        /// Read the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <returns> The Employee resource.</returns>
        [HttpGet]
        [Route(ContosoRPaasServiceRoutes.EmployeeItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Employee))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string employeeName)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, employeeName, Request);

        }

        protected virtual Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string employeeName, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Create the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ContosoRPaasServiceRoutes.EmployeeValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string employeeName, Employee body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, employeeName, body, Request);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string employeeName, Employee body, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Create the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ContosoRPaasServiceRoutes.EmployeeEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string employeeName, Employee body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, employeeName, body, Request);
            return;
        }

        protected virtual Task OnEndCreate(string subscriptionId, string resourceGroupName, string employeeName, Employee body, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Create the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The Employee resource.</returns>
        [HttpPut]
        [Route(ContosoRPaasServiceRoutes.EmployeeItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Employee))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(Employee))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string employeeName, Employee body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, employeeName, body, Request);

        }

        protected virtual Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string employeeName, Employee body, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Patch the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(ContosoRPaasServiceRoutes.EmployeeValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string employeeName, EmployeeUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, employeeName, body, Request);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string employeeName, EmployeeUpdate body, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Patch the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ContosoRPaasServiceRoutes.EmployeeEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string employeeName, EmployeeUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, employeeName, body, Request);
            return;
        }

        protected virtual Task OnEndPatch(string subscriptionId, string resourceGroupName, string employeeName, EmployeeUpdate body, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Patch the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The Employee resource.</returns>
        [HttpPatch]
        [Route(ContosoRPaasServiceRoutes.EmployeeItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Employee))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(Employee))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string employeeName, EmployeeUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, employeeName, body, Request);

        }

        protected virtual Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string employeeName, EmployeeUpdate body, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Delete the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(ContosoRPaasServiceRoutes.EmployeeValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string employeeName)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
            var modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, employeeName, Request);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string employeeName, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Delete the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ContosoRPaasServiceRoutes.EmployeeEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string employeeName)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, employeeName, Request);
            return;
        }

        protected virtual Task OnEndDelete(string subscriptionId, string resourceGroupName, string employeeName, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Delete the Employee resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="employeeName"> undefined</param>
        /// <returns> The Employee resource.</returns>
        [HttpDelete]
        [Route(ContosoRPaasServiceRoutes.EmployeeItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public async Task<IActionResult> BeginDeleteAsync(string subscriptionId, string resourceGroupName, string employeeName)
        {
            _logger.LogInformation("DeleteAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, employeeName, Request);

        }

        protected virtual Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string employeeName, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }
    }
}
