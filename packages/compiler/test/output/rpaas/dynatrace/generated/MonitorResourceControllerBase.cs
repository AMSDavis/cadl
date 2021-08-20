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
        }        /// <summary>
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
        public async Task<IActionResult> CreateAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResource body)
        {
            _logger.LogInformation("CreateAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, monitorName, body, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string monitorName, MonitorResource body, HttpRequest request);
        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResource body, HttpRequest request);        /// <summary>
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
        public async Task<IActionResult> PatchAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResourceUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, monitorName, body, Request);

        }

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string monitorName, MonitorResourceUpdate body, HttpRequest request);
        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string monitorName, MonitorResourceUpdate body, HttpRequest request);        /// <summary>
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
        public async Task<IActionResult> DeleteAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("DeleteAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);
        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);        /// <summary>
        /// Validate the request to GetAccountCredentials the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the GetAccountCredentials request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidateGetAccountCredentials)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateGetAccountCredentialsAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation($"ValidateGetAccountCredentialsAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateGetAccountCredentials(subscriptionId, resourceGroupName, monitorName, Request);
            }

            return modelValidation;
        }

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
        public async Task<IActionResult> GetAccountCredentialsAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("GetAccountCredentialsAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnGetAccountCredentialsAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateGetAccountCredentials(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);
        internal abstract Task<IActionResult> OnGetAccountCredentialsAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);        /// <summary>
        /// Validate the request to ListMonitoredResources the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the ListMonitoredResources request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidateListMonitoredResources)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateListMonitoredResourcesAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation($"ValidateListMonitoredResourcesAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateListMonitoredResources(subscriptionId, resourceGroupName, monitorName, Request);
            }

            return modelValidation;
        }

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
        public async Task<IActionResult> ListMonitoredResourcesAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("ListMonitoredResourcesAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnListMonitoredResourcesAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateListMonitoredResources(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);
        internal abstract Task<IActionResult> OnListMonitoredResourcesAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);        /// <summary>
        /// Validate the request to VmHostPayload the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the VmHostPayload request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidateVmHostPayload)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateVmHostPayloadAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation($"ValidateVmHostPayloadAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateVmHostPayload(subscriptionId, resourceGroupName, monitorName, Request);
            }

            return modelValidation;
        }

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
        public async Task<IActionResult> VmHostPayloadAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("VmHostPayloadAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnVmHostPayloadAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateVmHostPayload(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);
        internal abstract Task<IActionResult> OnVmHostPayloadAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);        /// <summary>
        /// Validate the request to VmHostUpdate the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <param name="request"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the VmHostUpdate request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidateVmHostUpdate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateVmHostUpdateAsync(string subscriptionId, string resourceGroupName, string monitorName, VMHostUpdateRequest request)
        {
            _logger.LogInformation($"ValidateVmHostUpdateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateVmHostUpdate(subscriptionId, resourceGroupName, monitorName, request, Request);
            }

            return modelValidation;
        }

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
        public async Task<IActionResult> VmHostUpdateAsync(string subscriptionId, string resourceGroupName, string monitorName, VMHostUpdateRequest request)
        {
            _logger.LogInformation("VmHostUpdateAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnVmHostUpdateAsync(subscriptionId, resourceGroupName, monitorName, request, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateVmHostUpdate(string subscriptionId, string resourceGroupName, string monitorName, VMHostUpdateRequest request, HttpRequest request);
        internal abstract Task<IActionResult> OnVmHostUpdateAsync(string subscriptionId, string resourceGroupName, string monitorName, VMHostUpdateRequest request, HttpRequest request);        /// <summary>
        /// Validate the request to ListVMHosts the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the ListVMHosts request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidateListVMHosts)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateListVMHostsAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation($"ValidateListVMHostsAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateListVMHosts(subscriptionId, resourceGroupName, monitorName, Request);
            }

            return modelValidation;
        }

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
        public async Task<IActionResult> ListVMHostsAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("ListVMHostsAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnListVMHostsAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateListVMHosts(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);
        internal abstract Task<IActionResult> OnListVMHostsAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);        /// <summary>
        /// Validate the request to SingleSignOnConfigurations the MonitorResource resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="monitorName"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the SingleSignOnConfigurations request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.MonitorResourceValidateSingleSignOnConfigurations)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateSingleSignOnConfigurationsAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation($"ValidateSingleSignOnConfigurationsAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateSingleSignOnConfigurations(subscriptionId, resourceGroupName, monitorName, Request);
            }

            return modelValidation;
        }

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
        public async Task<IActionResult> SingleSignOnConfigurationsAsync(string subscriptionId, string resourceGroupName, string monitorName)
        {
            _logger.LogInformation("SingleSignOnConfigurationsAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnSingleSignOnConfigurationsAsync(subscriptionId, resourceGroupName, monitorName, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateSingleSignOnConfigurations(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);
        internal abstract Task<IActionResult> OnSingleSignOnConfigurationsAsync(string subscriptionId, string resourceGroupName, string monitorName, HttpRequest request);        /// <summary>
        /// List Organization resources in the specified subscription.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <returns> The list of MonitorResource Resources in the specified subscription.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.MonitorResourceListBySubscription)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(MonitorResourceListResult))]
        public Task<MonitorResourceListResult> ListBySubscription(string subscriptionId)
        {
            _logger.LogInformation("ListBySubscriptionAsync()");
            return OnListBySubscription(subscriptionId, Request);
        }

        internal abstract Task<MonitorResourceListResult> OnListBySubscription(string subscriptionId, HttpRequest request);
                /// <summary>
        /// List MonitorResource resources in the specified resource group.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <returns> The list of MonitorResource Resources in the specified resource group.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.MonitorResourceListByResourceGroup)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(MonitorResourceListResult))]
        public Task<MonitorResourceListResult> ListByResourceGroupAsync(string subscriptionId, string resourceGroupName)
        {
            _logger.LogInformation("ListByResourceGroupAsync()");
            return OnListByResourceGroupAsync(subscriptionId, resourceGroupName, Request);
        }
                
        internal abstract Task<MonitorResourceListResult> OnListByResourceGroupAsync(string subscriptionId, string resourceGroupName, HttpRequest request);    }
}
