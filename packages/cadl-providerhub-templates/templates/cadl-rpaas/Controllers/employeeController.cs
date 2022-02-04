// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Microsoft.Cadl.ProviderHub.Controller;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Contoso.Service.Models;

namespace Microsoft.Contoso.Service
{
    /// <summary>
    /// Controller for user RP operations on the Employee resource.
    /// This is a sample code, you should override the abstract functions in the EmployeeControllerBase on demand to implement your own logic.
    /// </summary>
    [ApiController]
    public partial class EmployeeController : EmployeeControllerBase {

    protected override Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string EmployeeName, Employee body, HttpRequest request)
    {
        return Task.FromResult(ValidationResponse.Valid);
    }

    protected override Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string EmployeeName, Employee body, HttpRequest request)
    {
        return Task.FromResult(this.Ok() as IActionResult);
    }

    protected override Task OnEndCreate(string subscriptionId, string resourceGroupName, string EmployeeName, Employee body, HttpRequest request)
    {
        return Task.CompletedTask;
    }
    }
}
