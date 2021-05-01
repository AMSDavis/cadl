using Microsoft.Adl.RPaaS;
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
    /// Controller for user RP operations on the Organization resource.
    /// </summary>
    public abstract class OrganizationControllerBase : Controller
    {
        internal readonly ILogger<OrganizationControllerBase> _logger;

        public OrganizationControllerBase(ILogger<OrganizationControllerBase> logger)
        {
            _logger = logger;
        }
        /// <summary>
        /// Validate the request to Create the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription Id.</param>
        /// <param name="resourceGroupName"> The resource group.</param>
        /// <param name="organizationName"> The name of the Organization resource.</param>
        /// <param name="model"> The details of the Organization resource.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, Organization model)
        {
            _logger.LogInformation($"ValidateCreateAsync()");

            var modelValidation = ValidationHelpers.ValidateCreateModel(resource);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, organizationName, model, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Create the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription Id.</param>
        /// <param name="resourceGroupName"> The resource group.</param>
        /// <param name="organizationName"> The name of the Organization resource.</param>
        /// <param name="model"> The details of the Organization resource.</param>
        /// <returns> The Organization resource.</returns>
        [HttpPut]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(OrganizationResource))]
        public async Task<IActionResult> CreateAsync(string subscriptionId, string resourceGroupName, string organizationName, Organization model)
        {
            _logger.LogInformation("CreateAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, organizationName, model, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string organizationName, Organization model, HttpRequest request);
        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, Organization model, HttpRequest request);
        /// <summary>
        /// Validate the request to Patch the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription Id.</param>
        /// <param name="resourceGroupName"> The resource group.</param>
        /// <param name="organizationName"> The name of the Organization resource.</param>
        /// <param name="model"> The resource tags to update.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string organizationName, ResourceUpdate model)
        {
            _logger.LogInformation($"ValidatePatchAsync()");

            var modelValidation = ValidationHelpers.ValidatePatchModel(resource);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, organizationName, model, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Patch the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription Id.</param>
        /// <param name="resourceGroupName"> The resource group.</param>
        /// <param name="organizationName"> The name of the Organization resource.</param>
        /// <param name="model"> The resource tags to update.</param>
        /// <returns> The Organization resource.</returns>
        [HttpPut]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(OrganizationResource))]
        public async Task<IActionResult> PatchAsync(string subscriptionId, string resourceGroupName, string organizationName, ResourceUpdate model)
        {
            _logger.LogInformation("PatchAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, organizationName, model, Request);

        }

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string organizationName, ResourceUpdate model, HttpRequest request);
        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string organizationName, ResourceUpdate model, HttpRequest request);
        /// <summary>
        /// Validate the request to Delete the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription Id.</param>
        /// <param name="resourceGroupName"> The resource group.</param>
        /// <param name="organizationName"> The name of the Organization resource.</param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");

            var modelValidation = ValidationHelpers.ValidateDeleteModel(resource);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, organizationName, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Delete the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription Id.</param>
        /// <param name="resourceGroupName"> The resource group.</param>
        /// <param name="organizationName"> The name of the Organization resource.</param>
        /// <returns> The Organization resource.</returns>
        [HttpPut]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(OrganizationResource))]
        public async Task<IActionResult> DeleteAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation("DeleteAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, organizationName, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);
        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);
        /// <summary>
        /// List Organization resources in the specified subscription.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <returns> The list of Organization Resources in the specified subscription.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.OrganizationListBySubscription)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationResourceListResult))]
        public Task<OrganizationResourceListResult> ListBySubscription(string subscriptionId)
        {
            _logger.LogInformation("ListBySubscriptionAsync()");
            return OnListBySubscription(subscriptionId, Request);
        }

        internal abstract Task<OrganizationResourceListResult> OnListBySubscription(string subscriptionId, HttpRequest request);

        
        /// <summary>
        /// List Organization resources in the specified resource group.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <returns> The list of Organization Resources in the specified resource group.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.OrganizationListByResourceGroup)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationResourceListResult))]
        public Task<OrganizationResourceListResult> ListByResourceGroupAsync(string subscriptionId, string resourceGroupName)
        {
            _logger.LogInformation("ListByResourceGroupAsync()");
            return OnListByResourceGroupAsync(subscriptionId, resourceGroupName, Request);
        }
                
        internal abstract Task<OrganizationResourceListResult> OnListByResourceGroupAsync(string subscriptionId, string resourceGroupName, HttpRequest request);
    }
}
