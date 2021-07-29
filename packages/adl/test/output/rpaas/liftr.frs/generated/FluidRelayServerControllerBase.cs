using Microsoft.Adl.RPaaS;
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
        }        /// <summary>
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
        public async Task<IActionResult> CreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body)
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

        internal abstract Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body, HttpRequest request);
        internal abstract Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServer body, HttpRequest request);        /// <summary>
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
        public async Task<IActionResult> PatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body)
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

        internal abstract Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body, HttpRequest request);
        internal abstract Task<IActionResult> OnPatchAsync(string subscriptionId, string resourceGroupName, string name, FluidRelayServerUpdate body, HttpRequest request);        /// <summary>
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
        /// Validate the request to RegenerateKey the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="name"> undefined</param>
        /// <param name="parameters"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the RegenerateKey request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidateRegenerateKey)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateRegenerateKeyAsync(string subscriptionId, string resourceGroupName, string name, RegenerateKeyRequest parameters)
        {
            _logger.LogInformation($"ValidateRegenerateKeyAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateRegenerateKey(subscriptionId, resourceGroupName, name, parameters, Request);
            }

            return modelValidation;
        }

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
        public async Task<IActionResult> RegenerateKeyAsync(string subscriptionId, string resourceGroupName, string name, RegenerateKeyRequest parameters)
        {
            _logger.LogInformation("RegenerateKeyAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnRegenerateKeyAsync(subscriptionId, resourceGroupName, name, parameters, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateRegenerateKey(string subscriptionId, string resourceGroupName, string name, RegenerateKeyRequest parameters, HttpRequest request);
        internal abstract Task<IActionResult> OnRegenerateKeyAsync(string subscriptionId, string resourceGroupName, string name, RegenerateKeyRequest parameters, HttpRequest request);        /// <summary>
        /// Validate the request to GetKeys the FluidRelayServer resource.
        /// </summary>
        /// <param name="subscriptionId"> undefined</param>
        /// <param name="resourceGroupName"> undefined</param>
        /// <param name="name"> undefined</param>
        /// <returns> A ValidationResponse indicating the validity of the GetKeys request.</returns>
        [HttpPost]
        [Route(FluidRelayServiceRoutes.FluidRelayServerValidateGetKeys)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ValidationResponse))]
        public async Task<ValidationResponse> ValidateGetKeysAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation($"ValidateGetKeysAsync()");
            var modelValidation = ValidationHelpers.ValidateModel(body);
            if (modelValidation.Valid)
            {
                modelValidation = await OnValidateGetKeys(subscriptionId, resourceGroupName, name, Request);
            }

            return modelValidation;
        }

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
        public async Task<IActionResult> GetKeysAsync(string subscriptionId, string resourceGroupName, string name)
        {
            _logger.LogInformation("GetKeysAsync()");
            resource = resource ?? throw new ArgumentNullException(nameof(resource));

            if (Request == null)
            {
                _logger.LogError($"Http request is null");
                return BadRequest("Http request is null");
            }

            return await OnGetKeysAsync(subscriptionId, resourceGroupName, name, Request);

        }

        internal abstract Task<ValidationResponse> OnValidateGetKeys(string subscriptionId, string resourceGroupName, string name, HttpRequest request);
        internal abstract Task<IActionResult> OnGetKeysAsync(string subscriptionId, string resourceGroupName, string name, HttpRequest request);        /// <summary>
        /// List Organization resources in the specified subscription.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <returns> The list of FluidRelayServer Resources in the specified subscription.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.FluidRelayServerListBySubscription)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServerListResult))]
        public Task<FluidRelayServerListResult> ListBySubscription(string subscriptionId)
        {
            _logger.LogInformation("ListBySubscriptionAsync()");
            return OnListBySubscription(subscriptionId, Request);
        }

        internal abstract Task<FluidRelayServerListResult> OnListBySubscription(string subscriptionId, HttpRequest request);
                /// <summary>
        /// List FluidRelayServer resources in the specified resource group.
        /// </summary>
        /// <param name="subscriptionId"> The subscription id.</param>
        /// <param name="resourceGroupName"> The resource group name.</param>
        /// <returns> The list of FluidRelayServer Resources in the specified resource group.</returns>
        [HttpGet]
        [Route(ConfluentServiceRoutes.FluidRelayServerListByResourceGroup)]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(FluidRelayServerListResult))]
        public Task<FluidRelayServerListResult> ListByResourceGroupAsync(string subscriptionId, string resourceGroupName)
        {
            _logger.LogInformation("ListByResourceGroupAsync()");
            return OnListByResourceGroupAsync(subscriptionId, resourceGroupName, Request);
        }
                
        internal abstract Task<FluidRelayServerListResult> OnListByResourceGroupAsync(string subscriptionId, string resourceGroupName, HttpRequest request);    }
}
