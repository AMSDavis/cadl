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
        }

        /// <summary>
        /// Validate the request to Read the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.TagRuleValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, monitorName, ruleSetName, Request);
            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, HttpRequest request);


        /// <summary>
        /// Read the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <returns> The TagRule resource.</returns>
        [HttpGet]
        [Route(ObservabilityServiceRoutes.TagRuleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(TagRule))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, monitorName, ruleSetName, Request);

        }

        internal abstract Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, HttpRequest request);

        /// <summary>
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

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRule body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Create the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.TagRuleEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRule body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, monitorName, ruleSetName, body, Request);
            return;
        }

        internal abstract Task OnEndCreate(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRule body, HttpRequest request);

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
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRule body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, monitorName, ruleSetName, body, Request);

        }

        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRule body, HttpRequest request);

        /// <summary>
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

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRuleUpdate body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Patch the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.TagRuleEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRuleUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, monitorName, ruleSetName, body, Request);
            return;
        }

        internal abstract Task OnEndPatch(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRuleUpdate body, HttpRequest request);

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
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(TagRule))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRuleUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, monitorName, ruleSetName, body, Request);

        }

        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, TagRuleUpdate body, HttpRequest request);

        /// <summary>
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
            var modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, monitorName, ruleSetName, Request);
            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Delete the TagRule resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="monitorName"> </param>
        /// <param name="ruleSetName"> </param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ObservabilityServiceRoutes.TagRuleEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, monitorName, ruleSetName, Request);
            return;
        }

        internal abstract Task OnEndDelete(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, HttpRequest request);

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
        public async Task<IActionResult> BeginDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName)
        {
            _logger.LogInformation("DeleteAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, monitorName, ruleSetName, Request);

        }

        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string monitorName, string ruleSetName, HttpRequest request);
    }
}
