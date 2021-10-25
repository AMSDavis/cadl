// ------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ------------------------------------------------------------

namespace Provider.Controllers
{
    using System;
    using System.IO;
    using System.Net;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.AspNetCore.Http;
    using Microsoft.Extensions.Logging;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Linq;
    using System.Threading.Tasks;
    using Microsoft.{Provider}.Service;
    using Microsoft.Cadl.RPaaS;
    using Microsoft.{Provider}.Service.Models;

    /// <summary>
    /// The resource controller.
    /// </summary>
    [ApiController]
    public class EmployeeController : EmployeeControllerBase
    {

        /// <summary>
        /// Initializes a new instance of the <see cref="EmployeeController"/> class.
        /// </summary>
        /// <param name="logger"></param>
        public EmployeeController(ILogger<EmployeeControllerBase> logger) : base(logger)
        {
        }

        internal override Task<ValidationResponse> OnValidateCreate(string subscriptionId, string resourceGroupName, string TestName, Employee body, HttpRequest request)
        {
            return Task.FromResult(CreateValidateResponse(true));
        }

        internal override Task<IActionResult> OnCreateAsync(string subscriptionId, string resourceGroup, string EmployeeName, Employee body,HttpRequest request)
        {
            /*** Implement this method if you want to opt for "ResourceCreationBegin" extension for your resource type. ***/

            // This is a sample implementation
            // Logging: this log will be stored to "DefaultTable" in your geneva namespace.
            var logMessage = @"{""Tablename"" : ""DefaultTable"", ""logMessage"": ""OnResourceCreationBegin called at " + DateTime.Now + @"""}";
            _logger.LogInformation(logMessage);

            return Task.FromResult<IActionResult>(Json(body));
        }

        internal override Task OnEndCreate(string subscriptionId, string resourceGroupName, string TestName, Employee body, HttpRequest request)
        {
            return Task.FromResult(Json(body));
        }

        internal override Task<ValidationResponse> OnValidateDelete(string subscriptionId, string resourceGroupName, string EmployeeName, HttpRequest request)
        {
            return Task.FromResult(CreateValidateResponse(true));
        }

        internal override Task<IActionResult> OnDeleteAsync(string subscriptionId, string resourceGroupName, string EmployeeName,HttpRequest request)
        {
            /*** Implement this method if you want to opt for "OnResourceDeletionValidate" extension for your resource type. ***/

            // This is a sample implementation
            // Logging: this log will be stored to "DefaultTable" in your geneva namespace.
            var logMessage = @"{""Tablename"" : ""DefaultTable"", ""logMessage"": ""OnResourceDeletionValidate called at " + DateTime.Now + @"""}";
            Console.WriteLine(logMessage);

            // Do pre deletion validation here
            // This is a sample implementation
            if (subscriptionId == null || resourceGroupName == null || EmployeeName == null)
            {
                ErrorResponse errorRespone = new ErrorResponse
                {
                    Error = new ErrorDetail
                    {
                        Code = "SampleErrorCode",
                        Message = "SampleErrorMessage - Please don't delete this resource. This is important.",
                    }
                };

                // Required response format in case of validation failure.
                return Task.FromResult<IActionResult>(CreateResponse(
                    statusCode: HttpStatusCode.OK,
                    value: errorRespone));
            }

            // Required response format in case validation pass with empty body.
            return Task.FromResult<IActionResult>(new OkObjectResult(string.Empty));
        }
        internal override Task OnEndDelete(string subscriptionId, string resourceGroupName, string EmployeeName, HttpRequest request)
        {
            return Task.FromResult(new OkObjectResult(string.Empty));
        }

        /// <summary>
        /// Creates http responses.
        /// </summary>
        /// <param name="statusCode">The status code.</param>
        /// <param name="value">The value.</param>
        private static JsonResult CreateResponse(HttpStatusCode statusCode, object value = null)
        {
            var response = new JsonResult(value)
            {
                StatusCode = (int)statusCode,
            };

            return response;
        }

        /// <summary>
        /// Creates validate responses.
        /// </summary>
        /// <param name="valid"> the property valid. </param>
        private static ValidationResponse CreateValidateResponse(bool valid)
        {
            var response = new ValidationResponse();
            response.Valid = valid;
            return response;
        }
    }
}
