using Microsoft.Cadl.RPaaS;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Confluent.Service.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Microsoft.Confluent.Service
{
    public class OrganizationController : OrganizationControllerBase
    {
        public OrganizationController(ILogger<OrganizationControllerBase> logger) : base(logger)
        {
        }

        internal override Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResource resource, HttpRequest request)
        {
            throw new NotImplementedException();
        }

        internal override Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request)
        {
            throw new NotImplementedException();
        }

        internal override Task<OrganizationResource> OnGetAsync(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request)
        {
            return Task.FromResult( new OrganizationResource { Id = $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}" });
        }

        internal override Task<OrganizationResourceListResult> OnListByResourceGroupAsync(string subscriptionId, string resourceGroupName, HttpRequest request)
        {
            throw new NotImplementedException();
        }

        internal override Task<OrganizationResourceListResult> OnListBySubscription(string subscriptionId, HttpRequest request)
        {
            throw new NotImplementedException();
        }

        internal override Task<ActionResult<OrganizationResource>> OnPatchAsync(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResourceUpdate updateParameters, HttpRequest request)
        {
            throw new NotImplementedException();
        }

        internal override Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResource resource, HttpRequest request)
        {
            throw new NotImplementedException();
        }

        internal override Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string organizationName, HttpRequest request)
        {
            throw new NotImplementedException();
        }

        internal override Task<ValidationResponse> OnValidatePatch(string subscriptionId, string resourceGroupName, string organizationName, OrganizationResource resource, HttpRequest request)
        {
            throw new NotImplementedException();
        }
    }
}
