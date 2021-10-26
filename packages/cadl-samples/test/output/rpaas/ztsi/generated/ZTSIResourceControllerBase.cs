// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Net;
using System.Threading.Tasks;
using Cadl.ProviderHubController.Common;
using Microsoft.ZeroTrustSystemIntegrity.Service.Models;
using Microsoft.ZeroTrustSystemIntegrity.Service.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microsoft.ZeroTrustSystemIntegrity.Service
{
    /// <summary>
    /// Controller for user RP operations on the ZTSIResource resource.
    /// </summary>
    public abstract class ZTSIResourceControllerBase : ControllerBase
    {
        internal readonly ILogger<ZTSIResourceControllerBase> _logger;

        public ZTSIResourceControllerBase(ILogger<ZTSIResourceControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validate the request to Read the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string ztsiName)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, ztsiName, Request);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string ztsiName, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }


        /// <summary>
        /// Read the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <returns> The ZTSIResource resource.</returns>
        [HttpGet]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ZTSIResource))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string ztsiName)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, ztsiName, Request);

        }

        protected virtual Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string ztsiName, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Create the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResource body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, ztsiName, body, Request);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResource body, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Create the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResource body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, ztsiName, body, Request);
            return;
        }

        protected virtual Task OnEndCreate(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResource body, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Create the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The ZTSIResource resource.</returns>
        [HttpPut]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ZTSIResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(ZTSIResource))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResource body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, ztsiName, body, Request);

        }

        protected virtual Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResource body, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Patch the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResourceUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.IsValid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, ztsiName, body, Request);
            }

            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResourceUpdate body, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Patch the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResourceUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, ztsiName, body, Request);
            return;
        }

        protected virtual Task OnEndPatch(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResourceUpdate body, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Patch the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The ZTSIResource resource.</returns>
        [HttpPatch]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ZTSIResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(ZTSIResource))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResourceUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, ztsiName, body, Request);

        }

        protected virtual Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string ztsiName, ZTSIResourceUpdate body, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// Validate the request to Delete the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string ztsiName)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
            var modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, ztsiName, Request);
            return modelValidation;
        }

        protected virtual Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string ztsiName, HttpRequest request)
        {
            return Task.FromResult(ValidationResponse.Valid);
        }

        /// <summary>
        /// Called after the end of the request to Delete the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string ztsiName)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, ztsiName, Request);
            return;
        }

        protected virtual Task OnEndDelete(string subscriptionId, string resourceGroupName, string ztsiName, HttpRequest request)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Delete the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <returns> The ZTSIResource resource.</returns>
        [HttpDelete]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public async Task<IActionResult> BeginDeleteAsync(string subscriptionId, string resourceGroupName, string ztsiName)
        {
            _logger.LogInformation("DeleteAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, ztsiName, Request);

        }

        protected virtual Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string ztsiName, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// GetMAAURL the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The ID of the target subscription.</param>
        /// <param name="resourceGroupName"> The name of the resource group. The name is case insensitive.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <returns> The ZTSIResource resource.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceItemGetMAAURL)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(void))]
        public async Task<IActionResult> BeginGetMAAURLAsync(string subscriptionId, string resourceGroupName, string ztsiName)
        {
            _logger.LogInformation("GetMAAURLAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnGetMAAURLAsync(subscriptionId, resourceGroupName, ztsiName, Request);

        }

        protected virtual Task<IActionResult> OnGetMAAURLAsync(string subscriptionId, string resourceGroupName, string ztsiName, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// GetZTSIURL the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The ID of the target subscription.</param>
        /// <param name="resourceGroupName"> The name of the resource group. The name is case insensitive.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <returns> The ZTSIResource resource.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceItemGetZTSIURL)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(void))]
        public async Task<IActionResult> BeginGetZTSIURLAsync(string subscriptionId, string resourceGroupName, string ztsiName)
        {
            _logger.LogInformation("GetZTSIURLAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnGetZTSIURLAsync(subscriptionId, resourceGroupName, ztsiName, Request);

        }

        protected virtual Task<IActionResult> OnGetZTSIURLAsync(string subscriptionId, string resourceGroupName, string ztsiName, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// InitiateRequest the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The ID of the target subscription.</param>
        /// <param name="resourceGroupName"> The name of the resource group. The name is case insensitive.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <param name="initiateRequest"> undefined</param>
        /// <returns> The ZTSIResource resource.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceItemInitiateRequest)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(void))]
        public async Task<IActionResult> BeginInitiateRequestAsync(string subscriptionId, string resourceGroupName, string ztsiName, InitiateRequestInformation initiateRequest)
        {
            _logger.LogInformation("InitiateRequestAsync()");
            initiateRequest = initiateRequest ?? throw new ArgumentNullException(nameof(initiateRequest));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnInitiateRequestAsync(subscriptionId, resourceGroupName, ztsiName, initiateRequest, Request);

        }

        protected virtual Task<IActionResult> OnInitiateRequestAsync(string subscriptionId, string resourceGroupName, string ztsiName, InitiateRequestInformation initiateRequest, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }

        /// <summary>
        /// ReportRequest the ZTSIResource resource.
        /// </summary>
        /// <param name="subscriptionId"> The ID of the target subscription.</param>
        /// <param name="resourceGroupName"> The name of the resource group. The name is case insensitive.</param>
        /// <param name="ztsiName"> ZTSI resource name</param>
        /// <param name="reportRequest"> undefined</param>
        /// <returns> The ZTSIResource resource.</returns>
        [HttpPost]
        [Route(ZeroTrustSystemIntegrityServiceRoutes.ZTSIResourceItemReportRequest)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(void))]
        public async Task<IActionResult> BeginReportRequestAsync(string subscriptionId, string resourceGroupName, string ztsiName, ReportRequestInformation reportRequest)
        {
            _logger.LogInformation("ReportRequestAsync()");
            reportRequest = reportRequest ?? throw new ArgumentNullException(nameof(reportRequest));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReportRequestAsync(subscriptionId, resourceGroupName, ztsiName, reportRequest, Request);

        }

        protected virtual Task<IActionResult> OnReportRequestAsync(string subscriptionId, string resourceGroupName, string ztsiName, ReportRequestInformation reportRequest, HttpRequest request)
        {
            return Task.FromResult(Ok() as IActionResult);
        }
    }
}
