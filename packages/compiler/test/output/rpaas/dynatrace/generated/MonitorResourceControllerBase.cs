using Microsoft.Cadl.RPaaS;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Microsoft.Observability.Service.Models;
using Microsoft.Observability.Service.Controllers;
using System.Net;

namespace Microsoft.Observability.Service
{
    /// <summary>
    /// Controller for user RP operations on the MonitorResource resource.
    /// </summary>
    public abstract class MonitorResourceControllerBase : Controller
    {
        internal readonly ILogger<MonitorResourceControllerBase> _logger;

        public MonitorResourceControllerBase(ILogger<MonitorResourceControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validate the request to Read the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation($"ValidateReadAsync()");
                modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, monitorName, Request);

            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);


        /// <summary>
        /// Read the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpGet]
        [Route(ObservabilityServiceRoutes.MonitorResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(MonitorResource))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);

        /// <summary>
        /// Validate the request to Create the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResource body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, monitorName, body, Request);
            }

            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string monitorName, MonitorResource body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Create the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResource body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, monitorName, body, Request);
            return;
        }

        internal abstract Task OnEndCreate(string subscriptionId, string resourceGroupName, string monitorName, MonitorResource body, HttpRequest request);

        /// <summary>
        /// Create the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpPut]
        [Route(ObservabilityServiceRoutes.MonitorResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(MonitorResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(MonitorResource))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResource body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, monitorName, body, Request);

        }

        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResource body, HttpRequest request);

        /// <summary>
        /// Validate the request to Patch the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResourceUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, monitorName, body, Request);
            }

            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string monitorName, MonitorResourceUpdate body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Patch the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResourceUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, monitorName, body, Request);
            return;
        }

        internal abstract Task OnEndPatch(string subscriptionId, string resourceGroupName, string monitorName, MonitorResourceUpdate body, HttpRequest request);

        /// <summary>
        /// Patch the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpPatch]
        [Route(ObservabilityServiceRoutes.MonitorResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(MonitorResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(MonitorResource))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResourceUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, monitorName, body, Request);

        }

        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResourceUpdate body, HttpRequest request);

        /// <summary>
        /// Validate the request to Delete the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
                modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, monitorName, Request);

            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Delete the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, monitorName, Request);
            return;
        }

        internal abstract Task OnEndDelete(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);

        /// <summary>
        /// Delete the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpDelete]
        [Route(ObservabilityServiceRoutes.MonitorResourceItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public async Task<IActionResult> BeginDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("DeleteAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);

        /// <summary>
        /// GetAccountCredentials the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceItemGetAccountCredentials)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(void))]
        public async Task<IActionResult> BeginGetAccountCredentialsAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("GetAccountCredentialsAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnGetAccountCredentialsAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<IActionResult> OnGetAccountCredentialsAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);

        /// <summary>
        /// ListMonitoredResources the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceItemListMonitoredResources)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(MonitoredResourceListResponse))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(MonitoredResourceListResponse))]
        public async Task<IActionResult> BeginListMonitoredResourcesAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("ListMonitoredResourcesAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnListMonitoredResourcesAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<IActionResult> OnListMonitoredResourcesAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);

        /// <summary>
        /// VmHostPayload the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceItemVmHostPayload)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(VMExtensionPayload))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(VMExtensionPayload))]
        public async Task<IActionResult> BeginVmHostPayloadAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("VmHostPayloadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnVmHostPayloadAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<IActionResult> OnVmHostPayloadAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);

        /// <summary>
        /// VmHostUpdate the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <param name="request"> undefined</param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceItemVmHostUpdate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(VMResourcesListResponse))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(VMResourcesListResponse))]
        public async Task<IActionResult> BeginVmHostUpdateAsync(string subscriptionId, string resourceGroupName, string monitorName, VMHostUpdateRequest request)
        {
            _logger.LogInformation("VmHostUpdateAsync()");
            request = request ?? throw new ArgumentNullException(nameof(request));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnVmHostUpdateAsync(subscriptionId, resourceGroupName, monitorName, request, Request);

        }

        internal abstract Task<IActionResult> OnVmHostUpdateAsync(string subscriptionId, string resourceGroupName, string monitorName, VMHostUpdateRequest request, HttpRequest request);

        /// <summary>
        /// ListVMHosts the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceItemListVMHosts)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(VMResourcesListResponse))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(VMResourcesListResponse))]
        public async Task<IActionResult> BeginListVMHostsAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("ListVMHostsAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnListVMHostsAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<IActionResult> OnListVMHostsAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);

        /// <summary>
        /// SingleSignOnConfigurations the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> The MonitorResource resource.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceItemSingleSignOnConfigurations)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(VMResourcesListResponse))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(VMResourcesListResponse))]
        public async Task<IActionResult> BeginSingleSignOnConfigurationsAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("SingleSignOnConfigurationsAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnSingleSignOnConfigurationsAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<IActionResult> OnSingleSignOnConfigurationsAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);
    }
}
