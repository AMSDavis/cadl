// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.ContosoRPaas.Service
{
    /// <summary>
    /// Controller for user RP operations on the Employee resource.
    /// </summary>
    public partial class EmployeeController : EmployeeControllerBase
    {
        public EmployeeController(ILogger<EmployeeController> logger) : base(logger)
        {
        }
    }
}
