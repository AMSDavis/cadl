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
        }

        /// <summary>
        /// Validate the request to Read the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.TitleValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, name, Request);
            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string name, HttpRequest request);


        /// <summary>
        /// Read the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
        /// <returns> The Title resource.</returns>
        [HttpGet]
        [Route(PlayFabServiceRoutes.TitleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Title))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, name, Request);

        }

        internal abstract Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string name, HttpRequest request);

        /// <summary>
        /// Validate the request to Create the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
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

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string name, Title body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Create the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.TitleEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string name, Title body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, name, body, Request);
            return;
        }

        internal abstract Task OnEndCreate(string subscriptionId, string resourceGroupName, string name, Title body, HttpRequest request);

        /// <summary>
        /// Create the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The Title resource.</returns>
        [HttpPut]
        [Route(PlayFabServiceRoutes.TitleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Title))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(Title))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string name, Title body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, name, body, Request);

        }

        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string name, Title body, HttpRequest request);

        /// <summary>
        /// Validate the request to Patch the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
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

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string name, TitleUpdate body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Patch the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.TitleEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string name, TitleUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, name, body, Request);
            return;
        }

        internal abstract Task OnEndPatch(string subscriptionId, string resourceGroupName, string name, TitleUpdate body, HttpRequest request);

        /// <summary>
        /// Patch the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The Title resource.</returns>
        [HttpPatch]
        [Route(PlayFabServiceRoutes.TitleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Title))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(Title))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string name, TitleUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, name, body, Request);

        }

        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string name, TitleUpdate body, HttpRequest request);

        /// <summary>
        /// Validate the request to Delete the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.TitleValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
            var modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, name, Request);
            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string name, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Delete the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(PlayFabServiceRoutes.TitleEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, name, Request);
            return;
        }

        internal abstract Task OnEndDelete(string subscriptionId, string resourceGroupName, string name, HttpRequest request);

        /// <summary>
        /// Delete the Title resource.
        /// </summary>
        /// <param name="subscriptionId"> The subscription containing the resource.</param>
        /// <param name="resourceGroupName"> The resource group containing the resource.</param>
        /// <param name="name"> Name of the title resource.</param>
        /// <returns> The Title resource.</returns>
        [HttpDelete]
        [Route(PlayFabServiceRoutes.TitleItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        [ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]
        public async Task<IActionResult> BeginDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation("DeleteAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, name, Request);

        }

        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string name, HttpRequest request);
    }
}
