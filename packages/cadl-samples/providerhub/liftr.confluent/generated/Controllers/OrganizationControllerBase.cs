using Microsoft.Cadl.ProviderHub;
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
        /// Validate the request for creating the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name. </param>
        /// <param name="organizationName">The organization resource name.</param>
        /// <param name="resource"> The organization resource model.</param>
        /// <returns> A ValidationResponse indicating the validity of the request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResource resource)
        {
            _logger.LogInformation($"ValidateCreateAsync()");

            var modelValidation = ValidationHelpers.ValidateCreateModel(resource);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, organizationName, resource, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Validate the request for patching the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name. </param>
        /// <param name="organizationName">The organization resource name.</param>
        /// <param name="resource"> The organization resource model.</param>
        /// <returns> A ValidationResponse indicating the validity of the request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(
            string subscriptionId, string resourceGroupName, string organizationName, OrganizationResource resource)
        {
            _logger.LogInformation("ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidatePatchModel(resource);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, organizationName, resource, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Validate the request for deleting the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name. </param>
        /// <param name="organizationName">The Organization resource name.</param>
        /// <param name="resource"> The Organization resource model.</param>
        /// <returns> A ValidationResponse indicating the validity of the request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.ValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
            return OnValidateDelete(subscriptionId, resourceGroupName, organizationName, Request);
        }

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


        /// <summary>
        /// Get the properties of a specific Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <param name="organizationName"> The Organization resource name.</param>
        /// <returns> The properties of the specified Organization resource.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationResource))]
        public Task<OrganizationResource> GetAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation("GetAsync()");
            return OnGetAsync(subscriptionId, resourceGroupName, organizationName, Request);
        }

        /// <summary>
        /// Create the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <param name="organizationName"> The Organization resource name.</param>
        /// <param name="resource"> The Organization resource model.</param>
        /// <returns> The created Organization resource.</returns>
        [HttpPut]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationResource))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(OrganizationResource))]
        public async Task<IActionResult> CreateAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResource resource)
        {
            _logger.LogInformation("CreateAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, organizationName, resource, Request);

        }

        /// <summary>
        /// Update the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <param name="organizationName"> The Organization resource name.</param>
        /// <param name="updateParameters"> The Organization resource properties to update. </param>
        /// <returns> The updated Organization resource.</returns>
        [HttpPatch]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationResource))]
        public Task<ActionResult<OrganizationResource>> PatchAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResourceUpdate updateParameters)
        {
            _logger.LogInformation("PatchAsync()");
            return OnPatchAsync(subscriptionId, resourceGroupName, organizationName, updateParameters, Request);
        }

        /// <summary>
        /// Delete the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> The azure subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <param name="organizationName"> The Organization resource name.</param>
        /// <returns> An <see cref="IActionResult"/> indicating the status of the operation. </returns>
        [HttpDelete]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public Task<IActionResult> DeleteAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation("DeleteAsync()");
            return OnDeleteAsync(subscriptionId, resourceGroupName, organizationName, Request);

        }

        // Abstract methods for RP to implement
        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResource resource, HttpRequest request);
        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);
        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResource resource, HttpRequest request);
        internal abstract Task<OrganizationResourceListResult> OnListBySubscription(string subscriptionId, HttpRequest request);
        internal abstract Task<OrganizationResourceListResult> OnListByResourceGroupAsync(string subscriptionId, string resourceGroupName, HttpRequest request);
        internal abstract Task<OrganizationResource> OnGetAsync(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);
        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResource resource, HttpRequest request);
        internal abstract Task<ActionResult<OrganizationResource>> OnPatchAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResourceUpdate updateParameters, HttpRequest request);
        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);
    }
}
