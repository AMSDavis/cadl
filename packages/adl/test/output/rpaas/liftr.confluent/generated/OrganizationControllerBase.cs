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
        }        /// <summary>
        /// Validate the request to Create the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.OrganizationValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, Organization body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, organizationName, body, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Create the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The Organization resource.</returns>
        [HttpPut]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Organization))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(Organization))]
        public async Task<IActionResult> CreateAsync(string subscriptionId, string resourceGroupName, string organizationName, Organization body)
        {
            _logger.LogInformation("CreateAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, organizationName, body, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string organizationName, Organization body, HttpRequest request);
        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, Organization body, HttpRequest request);        /// <summary>
        /// Validate the request to Patch the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.OrganizationValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, organizationName, body, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Patch the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The Organization resource.</returns>
        [HttpPatch]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Organization))]
        public async Task<IActionResult> PatchAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, organizationName, body, Request);

        }

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string organizationName, OrganizationUpdate body, HttpRequest request);
        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationUpdate body, HttpRequest request);        /// <summary>
        /// Validate the request to Delete the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.OrganizationValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
                modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, organizationName, Request);

            return modelValidation;
        }

        /// <summary>
        /// Delete the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <returns> The Organization resource.</returns>
        [HttpDelete]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
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
        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);        /// <summary>
        /// List Organization resources in the specified subscription.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <returns> The list of Organization Resources in the specified subscription.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.OrganizationListBySubscription)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationListResult))]
        public Task<OrganizationListResult> ListBySubscription(string subscriptionId)
        {
            _logger.LogInformation("ListBySubscriptionAsync()");
            return OnListBySubscription(subscriptionId, Request);
        }

        internal abstract Task<OrganizationListResult> OnListBySubscription(string subscriptionId, HttpRequest request);
                /// <summary>
        /// List Organization resources in the specified resource group.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <returns> The list of Organization Resources in the specified resource group.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.OrganizationListByResourceGroup)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(OrganizationListResult))]
        public Task<OrganizationListResult> ListByResourceGroupAsync(string subscriptionId, string resourceGroupName)
        {
            _logger.LogInformation("ListByResourceGroupAsync()");
            return OnListByResourceGroupAsync(subscriptionId, resourceGroupName, Request);
        }
                
        internal abstract Task<OrganizationListResult> OnListByResourceGroupAsync(string subscriptionId, string resourceGroupName, HttpRequest request);    }
}
