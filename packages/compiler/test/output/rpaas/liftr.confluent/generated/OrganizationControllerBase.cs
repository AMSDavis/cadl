using Microsoft.Cadl.RPaaS;
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
        /// Validate the request to Read the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.OrganizationValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation($"ValidateReadAsync()");
            var modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, organizationName, Request);
            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);


        /// <summary>
        /// Read the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <returns> The Organization resource.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.OrganizationItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(Organization))]
        public async Task<IActionResult> BeginReadAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation("ReadAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnReadAsync(subscriptionId, resourceGroupName, organizationName, Request);

        }

        internal abstract Task<IActionResult> OnReadAsync(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);

        /// <summary>
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

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string organizationName, Organization body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Create the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.OrganizationEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, Organization body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, organizationName, body, Request);
            return;
        }

        internal abstract Task OnEndCreate(string subscriptionId, string resourceGroupName, string organizationName, Organization body, HttpRequest request);

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
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, Organization body)
        {
            _logger.LogInformation("CreateAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnCreateAsync(subscriptionId, resourceGroupName, organizationName, body, Request);

        }

        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, Organization body, HttpRequest request);

        /// <summary>
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

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string organizationName, OrganizationUpdate body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Patch the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.OrganizationEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, organizationName, body, Request);
            return;
        }

        internal abstract Task OnEndPatch(string subscriptionId, string resourceGroupName, string organizationName, OrganizationUpdate body, HttpRequest request);

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
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(Organization))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationUpdate body)
        {
            _logger.LogInformation("PatchAsync()");
            body = body ?? throw new ArgumentNullException(nameof(body));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnPatchAsync(subscriptionId, resourceGroupName, organizationName, body, Request);

        }

        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationUpdate body, HttpRequest request);

        /// <summary>
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
            var modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, organizationName, Request);
            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Delete the Organization resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="organizationName"> </param>
        /// <returns> Nothing.</returns>
        [HttpPost]
        [Route(ConfluentServiceRoutes.OrganizationEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, organizationName, Request);
            return;
        }

        internal abstract Task OnEndDelete(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);

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
        public async Task<IActionResult> BeginDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName)
        {
            _logger.LogInformation("DeleteAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnDeleteAsync(subscriptionId, resourceGroupName, organizationName, Request);

        }

        internal abstract Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request);
    }
}
