using Microsoft.Cadl.RPaaS;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Microsoft.PlayFab.Service.Models;
using Microsoft.PlayFab.Service.Controllers;
using System.Net;

namespace Microsoft.PlayFab.Service
{
    /// <summary>
    /// Controller for user RP operations on the Title resource.
    /// </summary>
    public abstract class TitleControllerBase : Controller
    {
        internal readonly ILogger<TitleControllerBase> _logger;

        public TitleControllerBase(ILogger<TitleControllerBase> logger)
        {
            _logger = logger;
        }        /// <summary>
        /// Validate the request to Create the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.TitleValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string name, Title body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, name, body, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Create the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The Title resource.</returns>
        [HttpPut]
        [Route(PlayFabServiceRoutes.TitleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Title))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(Title))]
        public async Task<IActionResult> CreateAsync(string subscriptionId, string resourceGroupName, string name, Title body)
        {
            _logger.LogInformation("CreateAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, name, body, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string name, Title body, HttpRequest request);
        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string name, Title body, HttpRequest request);        /// <summary>
        /// Validate the request to Patch the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.TitleValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string name, TitleUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, name, body, Request);
            }

            return modelValidation;
        }

        /// <summary>
        /// Patch the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The Title resource.</returns>
        [HttpPatch]
        [Route(PlayFabServiceRoutes.TitleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Title))]
        public async Task<IActionResult> PatchAsync(string subscriptionId, string resourceGroupName, string name, TitleUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, name, body, Request);

        }

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string name, TitleUpdate body, HttpRequest request);
        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string name, TitleUpdate body, HttpRequest request);        /// <summary>
        /// Validate the request to Delete the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.TitleValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
                modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, name, Request);

            return modelValidation;
        }

        /// <summary>
        /// Delete the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <returns> The Title resource.</returns>
        [HttpDelete]
        [Route(PlayFabServiceRoutes.TitleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public async Task<IActionResult> DeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation("DeleteAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, name, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string name, HttpRequest request);
        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string name, HttpRequest request);        /// <summary>
        /// List Organization resources in the specified subscription.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <returns> The list of Title Resources in the specified subscription.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.TitleListBySubscription)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(TitleListResult))]
        public Task<TitleListResult> ListBySubscription(string subscriptionId)
        {
            _logger.LogInformation("ListBySubscriptionAsync()");
            return OnListBySubscription(subscriptionId, Request);
        }

        internal abstract Task<TitleListResult> OnListBySubscription(string subscriptionId, HttpRequest request);
                /// <summary>
        /// List Title resources in the specified resource group.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <returns> The list of Title Resources in the specified resource group.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.TitleListByResourceGroup)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(TitleListResult))]
        public Task<TitleListResult> ListByResourceGroupAsync(string subscriptionId, string resourceGroupName)
        {
            _logger.LogInformation("ListByResourceGroupAsync()");
            return OnListByResourceGroupAsync(subscriptionId, resourceGroupName, Request);
        }
                
        internal abstract Task<TitleListResult> OnListByResourceGroupAsync(string subscriptionId, string resourceGroupName, HttpRequest request);    }
}
