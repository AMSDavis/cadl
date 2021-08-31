using Microsoft.Cadl.RPaaS;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Microsoft.FluidRelay.Service.Models;
using Microsoft.FluidRelay.Service.Controllers;
using System.Net;

namespace Microsoft.FluidRelay.Service
{
    /// <summary>
    /// Controller for user RP operations on the FluidRelayServer resource.
    /// </summary>
    public abstract class FluidRelayServerControllerBase : Controller
    {
        internal readonly ILogger<FluidRelayServerControllerBase> _logger;

        public FluidRelayServerControllerBase(ILogger<FluidRelayServerControllerBase> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Validate the request to Read the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Read request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidateRead)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateReadAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateReadAsync()");
                modelValidation = await OnValidateRead(subscriptionId, resourceGroupName, name, Request);

            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateRead(string subscriptionId, string resourceGroupName, string name, HttpRequest request);


        /// <summary>
        /// Read the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpGet]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServer))]
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
        /// Validate the request to Create the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidateCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateCreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body)
        {
            _logger.LogInformation($"ValidateCreateAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateCreate(subscriptionId, resourceGroupName, name, body, Request);
            }

            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Create the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Create request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerEndCreate)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndCreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body)
        {
            _logger.LogInformation($"EndCreateAsync()");
            await OnEndCreate(subscriptionId, resourceGroupName, name, body, Request);
            return;
        }

        internal abstract Task OnEndCreate(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body, HttpRequest request);

        /// <summary>
        /// Create the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource data.</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpPut]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServer))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(FluidRelayServer))]
        public async Task<IActionResult> BeginCreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body)
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

        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body, HttpRequest request);

        /// <summary>
        /// Validate the request to Patch the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidatePatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidatePatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body)
        {
            _logger.LogInformation($"ValidatePatchAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidatePatch(subscriptionId, resourceGroupName, name, body, Request);
            }

            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Patch the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> A ValidationResponse indicating the validity of the Patch request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerEndPatch)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndPatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body)
        {
            _logger.LogInformation($"EndPatchAsync()");
            await OnEndPatch(subscriptionId, resourceGroupName, name, body, Request);
            return;
        }

        internal abstract Task OnEndPatch(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body, HttpRequest request);

        /// <summary>
        /// Patch the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <param name="body"> The resource patch data.</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpPatch]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItem)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServer))]
        [ProducesResponseType((int)HttpStatusCode.Created, Type = typeof(FluidRelayServer))]
        public async Task<IActionResult> BeginPatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body)
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

        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body, HttpRequest request);

        /// <summary>
        /// Validate the request to Delete the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidateDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateDeleteAsync()");
                modelValidation = await OnValidateDelete(subscriptionId, resourceGroupName, name, Request);

            return modelValidation;
        }

        internal abstract Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string name, HttpRequest request);

        /// <summary>
        /// Called after the end of the request to Delete the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <returns> A ValidationResponse indicating the validity of the Delete request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerEndDelete)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(void))]
        public async Task EndDeleteAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"EndDeleteAsync()");
            await OnEndDelete(subscriptionId, resourceGroupName, name, Request);
            return;
        }

        internal abstract Task OnEndDelete(string subscriptionId, string resourceGroupName, string name, HttpRequest request);

        /// <summary>
        /// Delete the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> </param>
        /// <param name="resourceGroupName"> </param>
        /// <param name="name"> </param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpDelete]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItem)]
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

        /// <summary>
        /// RegenerateKey the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="name"> undefined</param>
        /// <param name="parameters"> undefined</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItemRegenerateKey)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServerKeys))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(FluidRelayServerKeys))]
        public async Task<IActionResult> BeginRegenerateKeyAsync(string subscriptionId, string resourceGroupName, string name, RegenerateKeyRequest parameters)
        {
            _logger.LogInformation("RegenerateKeyAsync()");
            parameters = parameters ?? throw new ArgumentNullException(nameof(parameters));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnRegenerateKeyAsync(subscriptionId, resourceGroupName, name, parameters, Request);

        }

        internal abstract Task<IActionResult> OnRegenerateKeyAsync(string subscriptionId, string resourceGroupName, string name, RegenerateKeyRequest parameters, HttpRequest request);

        /// <summary>
        /// GetKeys the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="name"> undefined</param>
        /// <returns> The FluidRelayServer resource.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerItemGetKeys)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServerKeys))]
        [ProducesResponseType((int)HttpStatusCode.Accepted, Type = typeof(FluidRelayServerKeys))]
        public async Task<IActionResult> BeginGetKeysAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation("GetKeysAsync()");
            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnGetKeysAsync(subscriptionId, resourceGroupName, name, Request);

        }

        internal abstract Task<IActionResult> OnGetKeysAsync(string subscriptionId, string resourceGroupName, string name, HttpRequest request);
    }
}
