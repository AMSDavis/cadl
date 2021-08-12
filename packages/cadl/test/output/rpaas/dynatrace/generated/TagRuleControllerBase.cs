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
    /// Controller for user RP operations on the TagRule resource.
    /// </summary>
    public abstract class TagRuleControllerBase : Controller
    {
        internal readonly ILogger<TagRuleControllerBase> _logger;

        public TagRuleControllerBase(ILogger<TagRuleControllerBase> logger)
        {
            _logger = logger;
        }        /// <summary>
        /// Validate the request to Create the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.TagRuleValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRule body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, monitorName, ruleSetName, body, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Create the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The TagRule resource.</returns>
        [HttpPut]
        [Route(ObservabilityServiceRoutes.TagRuleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(TagRule))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(TagRule))]
        public async Task<IActionResult> CreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRule body)
        {
            _logger.LogInformation("CreateAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, monitorName, ruleSetName, body, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRule body, HttpRequest request);
        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRule body, HttpRequest request);        /// <summary>
        /// Validate the request to Patch the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.TagRuleValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRuleUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, monitorName, ruleSetName, body, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Patch the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The TagRule resource.</returns>
        [HttpPatch]
        [Route(ObservabilityServiceRoutes.TagRuleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(TagRule))]
        public async Task<IActionResult> PatchAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRuleUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, monitorName, ruleSetName, body, Request);

        }

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRuleUpdate body, HttpRequest request);
        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRuleUpdate body, HttpRequest request);        /// <summary>
        /// Validate the request to Delete the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.TagRuleValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
                modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, monitorName, ruleSetName, Request);

            return modelValidation;
        }

        /// <summary>
        /// Delete the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <returns> The TagRule resource.</returns>
        [HttpDelete]
        [Route(ObservabilityServiceRoutes.TagRuleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public async Task<IActionResult> DeleteAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName)
        {
            _logger.LogInformation("DeleteAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, monitorName, ruleSetName, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, HttpRequest request);
        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, HttpRequest request);        /// <summary>
        /// List Organization resources in the specified subscription.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <returns> The list of TagRule Resources in the specified subscription.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.TagRuleListBySubscription)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(TagRuleListResult))]
        public Task<TagRuleListResult> ListBySubscription(string subscriptionId)
        {
            _logger.LogInformation("ListBySubscriptionAsync()");
            return OnListBySubscription(subscriptionId, Request);
        }

        internal abstract Task<TagRuleListResult> OnListBySubscription(string subscriptionId, HttpRequest request);
                /// <summary>
        /// List TagRule resources in the specified resource group.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <returns> The list of TagRule Resources in the specified resource group.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.TagRuleListByResourceGroup)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(TagRuleListResult))]
        public Task<TagRuleListResult> ListByResourceGroupAsync(string subscriptionId, string resourceGroupName)
        {
            _logger.LogInformation("ListByResourceGroupAsync()");
            return OnListByResourceGroupAsync(subscriptionId, resourceGroupName, Request);
        }
                
        internal abstract Task<TagRuleListResult> OnListByResourceGroupAsync(string subscriptionId, string resourceGroupName, HttpRequest request);    }
}
