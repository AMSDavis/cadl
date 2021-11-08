// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Net;
using System.Threading.Tasks;
using Cadl.ProviderHubController.Common;
using Microsoft.Contoso.Service.Models;
using Microsoft.Contoso.Service.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Microsoft.Contoso.Service {

  /// <summary>
  /// Controller for user RP operations on the Employee resource.
  /// </summary>
  [ApiController]
  public partial class EmployeeController : EmployeeControllerBase {
    protected override Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string EmployeeName, Employee body, HttpRequest request) {
      return Task.FromResult(ValidationResponse.Valid);
    }

    protected override Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroupName, string EmployeeName, Employee body, HttpRequest request) {
      return Task.FromResult(Ok() as IActionResult);
    }

    protected override Task OnEndCreate(string subscriptionId, string resourceGroupName, string EmployeeName, Employee body, HttpRequest request) {
      return Task.CompletedTask;
    }
  }
}
